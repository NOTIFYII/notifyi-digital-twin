// Forward kinematics - must stay identical to 02_CAD/source/nfy_kin.py
//   T_world_child(q) = T_world_parent * Translate(origin_mm) * Rotate(axis, q_deg)
// All matrices are CAD millimetres, Z up. Row-major arrays from the JSON are converted to THREE.Matrix4.
import * as THREE from 'three';

export function matFromRows(rows) {
  const m = new THREE.Matrix4();
  m.set(rows[0][0], rows[0][1], rows[0][2], rows[0][3], rows[1][0], rows[1][1], rows[1][2], rows[1][3],
        rows[2][0], rows[2][1], rows[2][2], rows[2][3], 0, 0, 0, 1);
  return m;
}

export function fk(cfg, q = {}) {
  const out = { [cfg.root_link]: new THREE.Matrix4() };
  for (const j of cfg.joints) {
    const T = new THREE.Matrix4().makeTranslation(j.origin_mm[0], j.origin_mm[1], j.origin_mm[2]);
    const axis = new THREE.Vector3(...j.axis).normalize();
    const Tp = out[j.parent].clone().multiply(T);
    const ang = j.passive ? passiveAngle(j, Tp, axis) : (q[j.name] || 0);
    const R = new THREE.Matrix4().makeRotationAxis(axis, THREE.MathUtils.degToRad(ang));
    out[j.child] = Tp.multiply(R);
    if (j.passive) out.__passive = Object.assign(out.__passive || {}, { [j.name]: ang });
  }
  return out;
}

// PASSIVE gravity pendulum joint (no motor): same rule as passive_angle() in nfy_kin.py
function passiveAngle(j, Tp, a) {
  const g = new THREE.Vector3(0, 0, -1).applyMatrix4(new THREE.Matrix4().extractRotation(Tp).transpose());
  const ref = new THREE.Vector3(0, 0, -1);
  ref.addScaledVector(a, -ref.dot(a));
  const gp = g.clone().addScaledVector(a, -g.dot(a));
  if (gp.length() < 1e-9 || ref.length() < 1e-9) return 0;
  ref.normalize(); gp.normalize();
  const ang = THREE.MathUtils.radToDeg(Math.atan2(new THREE.Vector3().crossVectors(ref, gp).dot(a), ref.dot(gp)));
  return Math.max(j.passive.min ?? -180, Math.min(j.passive.max ?? 180, ang));
}

export function rowsFromMat(m) {
  const e = m.elements; // column-major
  return [[e[0], e[4], e[8], e[12]], [e[1], e[5], e[9], e[13]], [e[2], e[6], e[10], e[14]]];
}

// --- motion interpolation shared with 09_Control/notifyi_motion.py ---------------------------
export const EASE = {
  linear: u => u,
  minjerk: u => u * u * u * (10 - 15 * u + 6 * u * u),
  hold: u => (u < 1 ? 0 : 1),
};

export function sampleMotion(motion, t, jointNames) {
  const kf = motion.keyframes;
  if (!kf.length) return {};
  if (t <= kf[0].t) return { ...kf[0].q };
  if (t >= kf[kf.length - 1].t) return { ...kf[kf.length - 1].q };
  let i = 0;
  while (i < kf.length - 2 && t > kf[i + 1].t) i++;
  const a = kf[i], b = kf[i + 1];
  const u = (t - a.t) / Math.max(1e-9, b.t - a.t);
  const s = (EASE[b.ease] || EASE.minjerk)(u);
  const q = {};
  for (const n of jointNames) q[n] = (a.q[n] ?? 0) + ((b.q[n] ?? 0) - (a.q[n] ?? 0)) * s;
  return q;
}

export function motionDuration(motion) {
  return motion.keyframes.length ? motion.keyframes[motion.keyframes.length - 1].t : 0;
}
