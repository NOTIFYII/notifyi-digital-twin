// Live collision proxy check: oriented boxes exported from CAD (joint_config.collision_boxes).
// This is a fast, approximate screen. The authoritative sampled triangle-mesh check is
// scripts/verify_design.py -> 07_Verification/<rev>/verify_report.json.
import * as THREE from 'three';
import { matFromRows } from './kinematics.js';

export function buildBoxes(cfg) {
  const out = [];
  for (const [link, boxes] of Object.entries(cfg.collision_boxes || {})) {
    for (const b of boxes) out.push({ link, name: b.name, local: matFromRows(b.T), half: new THREE.Vector3(...b.half), world: new THREE.Matrix4() });
  }
  return out;
}

function axesOf(m) {
  const e = m.elements;
  return [new THREE.Vector3(e[0], e[1], e[2]), new THREE.Vector3(e[4], e[5], e[6]), new THREE.Vector3(e[8], e[9], e[10])];
}

// Separating Axis Theorem for two OBBs. margin > 0 shrinks both boxes (ignore grazing contact).
export function obbOverlap(a, b, margin = 0.05) {
  const A = axesOf(a.world), B = axesOf(b.world);
  const ca = new THREE.Vector3().setFromMatrixPosition(a.world), cb = new THREE.Vector3().setFromMatrixPosition(b.world);
  const ha = [a.half.x - margin, a.half.y - margin, a.half.z - margin];
  const hb = [b.half.x - margin, b.half.y - margin, b.half.z - margin];
  const t = cb.clone().sub(ca);
  const R = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], AbsR = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { R[i][j] = A[i].dot(B[j]); AbsR[i][j] = Math.abs(R[i][j]) + 1e-9; }
  const T = [t.dot(A[0]), t.dot(A[1]), t.dot(A[2])];
  for (let i = 0; i < 3; i++) if (Math.abs(T[i]) > ha[i] + hb[0] * AbsR[i][0] + hb[1] * AbsR[i][1] + hb[2] * AbsR[i][2]) return false;
  for (let j = 0; j < 3; j++) if (Math.abs(T[0] * R[0][j] + T[1] * R[1][j] + T[2] * R[2][j]) > ha[0] * AbsR[0][j] + ha[1] * AbsR[1][j] + ha[2] * AbsR[2][j] + hb[j]) return false;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const i1 = (i + 1) % 3, i2 = (i + 2) % 3, j1 = (j + 1) % 3, j2 = (j + 2) % 3;
    const ra = ha[i1] * AbsR[i2][j] + ha[i2] * AbsR[i1][j];
    const rb = hb[j1] * AbsR[i][j2] + hb[j2] * AbsR[i][j1];
    if (Math.abs(T[i2] * R[i1][j] - T[i1] * R[i2][j]) > ra + rb) return false;
  }
  return true;
}

// Returns [{a, b}] for boxes on DIFFERENT links that overlap. linkWorld: {link: Matrix4 (CAD mm)}
export function checkBoxes(boxes, linkWorld, groundZ = null) {
  for (const b of boxes) b.world.copy(linkWorld[b.link]).multiply(b.local);
  const hits = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (boxes[i].link === boxes[j].link) continue;
      if (obbOverlap(boxes[i], boxes[j])) hits.push({ a: boxes[i], b: boxes[j] });
    }
    if (groundZ !== null && boxes[i].link !== 'base') {
      const A = axesOf(boxes[i].world), c = new THREE.Vector3().setFromMatrixPosition(boxes[i].world), h = boxes[i].half;
      const reach = Math.abs(A[0].z) * h.x + Math.abs(A[1].z) * h.y + Math.abs(A[2].z) * h.z;
      if (c.z - reach < groundZ) hits.push({ a: boxes[i], b: { name: 'desk plane', link: 'world' } });
    }
  }
  return hits;
}
