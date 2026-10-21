// Notifyi cables in the viewer (round 22): every cable is re-solved for the pose on screen, so it never comes apart between links.
//
// A cable = waypoints, each tied to a link, + its real free length. The centre line is a smooth curve through the waypoints where the
// links have put them; the length the real cable has left over is paid out as a bow in the stretches that cross from one link to the
// next. If the path is longer than the cable it is TAUT: drawn straight, in red, and reported.
// The arithmetic repeats 02_CAD/source/nfy_cables.py (centerline) - change both together. No stiffness, no contact: a drawing aid.
import * as THREE from 'three';

const RED = new THREE.Color(0.9, 0.12, 0.1);

function smooth(P, step) {                 // uniform Catmull-Rom through the points, ends mirrored - as nfy_cables.smooth
  const Q = [P[0].clone().multiplyScalar(2).sub(P[1]), ...P, P[P.length - 1].clone().multiplyScalar(2).sub(P[P.length - 2])];
  const out = [Q[1].clone()];
  for (let i = 1; i < Q.length - 2; i++) {
    const p0 = Q[i - 1], p1 = Q[i], p2 = Q[i + 1], p3 = Q[i + 2];
    const n = Math.max(2, Math.ceil(p2.distanceTo(p1) / step));
    for (let k = 1; k <= n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = c => 0.5 * ((2 * p1[c]) + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3);
      out.push(new THREE.Vector3(f('x'), f('y'), f('z')));
    }
  }
  return out;
}
const lengthOf = pts => { let L = 0; for (let i = 1; i < pts.length; i++) L += pts[i].distanceTo(pts[i - 1]); return L; };

export class Cables {
  constructor(defs, root, links) {
    this.links = links;
    this.items = defs.map(c => {
      const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(c.rgb[0], c.rgb[1], c.rgb[2]), roughness: 0.6, metalness: 0 });
      const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
      mesh.name = 'cable ' + c.name; mesh.castShadow = true; mesh.matrixAutoUpdate = false;
      root.add(mesh);
      return { c, mesh, mat, base: mat.color.clone() };
    });
    this.meshes = this.items.map(i => i.mesh);
  }
  centerline(c) {
    const hosts = c.way.map(w => w[0]);
    const W = c.way.map(w => new THREE.Vector3(w[1][0], w[1][1], w[1][2]).applyMatrix4(this.links[w[0]].matrix));
    let spans = []; for (let i = 0; i < W.length - 1; i++) if (hosts[i] !== hosts[i + 1]) spans.push(i);
    if (!spans.length) { let best = 0, bl = -1; for (let i = 0; i < W.length - 1; i++) { const l = W[i].distanceTo(W[i + 1]); if (l > bl) { bl = l; best = i; } } spans = [best]; }
    const dirs = [], chord = [];
    for (const i of spans) {
      const a = W[i], b = W[i + 1], ch = b.clone().sub(a), L2 = Math.max(ch.lengthSq(), 1e-9);
      let n;
      if (hosts[i] === hosts[i + 1]) { const g = c.bulge || [0, 0, 1]; n = new THREE.Vector3(g[0], g[1], g[2]).transformDirection(this.links[hosts[i]].matrix); }
      else if (c.out) n = new THREE.Vector3(c.out[0], c.out[1], c.out[2]).transformDirection(this.links[hosts[i]].matrix);
      else n = a.clone().add(b).multiplyScalar(0.5).sub(new THREE.Vector3().setFromMatrixPosition(this.links[hosts[i + 1]].matrix));
      n.addScaledVector(ch, -n.dot(ch) / L2);
      if (n.length() < 1e-6) n.set(0, 1, 0).addScaledVector(ch, -ch.y / L2);
      n.normalize();
      if (hosts[i] !== hosts[i + 1] && !c.out) { n.z -= 0.25; n.normalize(); }
      dirs.push(n); chord.push(Math.sqrt(L2));
    }
    const sum = Math.max(chord.reduce((s, v) => s + v, 0), 1e-9), wts = chord.map(v => v / sum * spans.length);
    const build = amp => {
      const ctrl = [];
      W.forEach((p, i) => { ctrl.push(p); const k = spans.indexOf(i); if (k >= 0) ctrl.push(W[i].clone().add(W[i + 1]).multiplyScalar(0.5).addScaledVector(dirs[k], amp * wts[k])); });
      const pts = smooth(ctrl, 2.0); return [pts, lengthOf(pts)];
    };
    let [pts, L0] = build(0);
    const info = { path: L0, length: c.length_mm, taut: false, slack: 0 };
    if (c.length_mm == null) return { pts, info };
    if (L0 >= c.length_mm) { info.taut = true; info.short = L0 - c.length_mm; return { pts, info }; }
    let lo = 0, hi = 4;
    while (build(hi)[1] < c.length_mm && hi < 400) hi *= 2;
    for (let k = 0; k < 22; k++) { const mid = (lo + hi) / 2; if (build(mid)[1] < c.length_mm) lo = mid; else hi = mid; }
    pts = build(hi)[0]; info.slack = c.length_mm - L0;
    return { pts, info };
  }
  // call after the links' matrices have been set for the pose; returns the cables that are too short in this pose
  update() {
    const taut = [];
    for (const it of this.items) {
      const { pts, info } = this.centerline(it.c);
      it.mesh.geometry.dispose();
      it.mesh.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(8, pts.length), it.c.d / 2, 8, false);
      it.mat.color.copy(info.taut ? RED : it.base);
      if (info.taut) taut.push({ name: it.c.name, short: info.short });
    }
    return taut;
  }
}
