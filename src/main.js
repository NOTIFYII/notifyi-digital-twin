// Notifyi digital twin viewer.
// Geometry: /assets/<rev>/<rev>_parts.glb  (tessellated from the ORIGINAL 2XL430 STEP + our CAD parts)
// Kinematics: /assets/<rev>/joint_config.json (written by the same CAD build). Nothing is re-modelled here.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { fk, matFromRows, rowsFromMat, sampleMotion, motionDuration } from './kinematics.js';
import { buildBoxes, checkBoxes } from './collision.js';
import { FaceEngine, EXPRESSIONS, STYLES } from './face.js';
import { Cables } from './cables.js';

const $ = s => document.querySelector(s);
const params = new URLSearchParams(location.search);
const JOINT_COLORS = [0xe8843c, 0x4fa3e8, 0x8bd450, 0xe85fa3, 0xe8d23c, 0x9b7fe8, 0x4fd6c7, 0xcccccc];

const S = { cfg: null, rev: null, q: {}, links: {}, byKind: {}, boxes: [], boxHelpers: [], axes: null, com: null,
            motion: { schema: 'notifyi.motion/1', name: 'untitled', revision: '', loop: false, keyframes: [] },
            t: 0, playing: false, sel: -1, hits: [], lastTick: 0 };

// ------------------------------------------------------------------ three setup
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc4c8ce);
const camera = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.01, 20);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.screenSpacePanning = true;   // right-drag / Shift-drag / two fingers move the model up, down and sideways on the screen
controls.zoomToCursor = true;         // the wheel zooms toward the pointer, so any part can be brought close
controls.minDistance = 0.04;
controls.maxDistance = 4;
scene.add(new THREE.HemisphereLight(0xffffff, 0x7c828c, 1.6));
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(0.5, 0.9, 0.7);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -0.35, right: 0.35, top: 0.45, bottom: -0.1, near: 0.1, far: 3 });
scene.add(key);
const fill = new THREE.DirectionalLight(0xbfd4ff, 0.7);
fill.position.set(-0.8, 0.4, -0.3);
scene.add(fill);
const ground = new THREE.Mesh(new THREE.CircleGeometry(0.6, 96), new THREE.MeshStandardMaterial({ color: 0xb4b8bf, roughness: 0.95 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
const grid = new THREE.GridHelper(0.6, 12, 0x8a9099, 0xa3a8b0); // 50 mm cells
grid.position.y = 0.0002;
scene.add(grid);

// CAD (mm, Z up, front = -Y)  ->  three (m, Y up):  x'=x, y'=z, z'=-y
const cad = new THREE.Group();
cad.rotation.x = -Math.PI / 2;
cad.scale.setScalar(0.001);
scene.add(cad);

const VIEWS = { front: [0, 0.02, 1], side: [1, 0.02, 0], rear: [0, 0.02, -1], three_quarter: [0.72, 0.42, 0.72], top: [0, 1, 0.001],
                left: [-1, 0.02, 0], three_quarter_left: [-0.72, 0.42, 0.72], rear_left: [-0.72, 0.42, -0.72] };
let viewTarget = new THREE.Vector3(0, 0.13, -0.012), viewDist = 0.72;
function setView(name) {
  const d = new THREE.Vector3(...VIEWS[name]).normalize();
  camera.position.copy(viewTarget).addScaledVector(d, viewDist);
  controls.target.copy(viewTarget);
  controls.update();
  frameFree();
  document.querySelectorAll('#views button').forEach(b => b.classList.toggle('on', b.dataset.v === name));
}

// ------------------------------------------------------------------ free camera: move / turn / zoom from the buttons and the keys; the model's
// place on screen is the middle of the canvas the panels leave free (the projection centre is shifted there with a view offset)
const _sph = new THREE.Spherical(), _off = new THREE.Vector3();
function camPan(dx, dy) {            // moves the MODEL on screen by dx, dy (fractions of the view height; +dy = up)
  camera.updateMatrixWorld();
  const h = 2 * camera.position.distanceTo(controls.target) * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const v = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(-dx * h)
    .addScaledVector(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1), -dy * h);
  camera.position.add(v); controls.target.add(v); controls.update();
}
function camOrbit(dAz, dEl) {        // radians: turn about the vertical through the target; +dEl looks more from above, -dEl from below
  _off.copy(camera.position).sub(controls.target); _sph.setFromVector3(_off);
  _sph.theta += dAz; _sph.phi = THREE.MathUtils.clamp(_sph.phi - dEl, 0.02, Math.PI - 0.02);
  camera.position.copy(controls.target).add(_off.setFromSpherical(_sph)); controls.update();
}
function camZoom(f) { _off.copy(camera.position).sub(controls.target).multiplyScalar(f); camera.position.copy(controls.target).add(_off); controls.update(); }
function freeRect() {                // the part of the window no panel covers (a wide panel is a band, a tall one a side; a small pad is ignored)
  const W = innerWidth, H = innerHeight;
  let x0 = 0, x1 = W, y0 = 0, y1 = H;
  const shown = e => e && !e.classList.contains('hidden') && getComputedStyle(e).display !== 'none';
  const tb = document.querySelector('.nfy-topbar');
  if (shown(tb)) y0 = tb.getBoundingClientRect().bottom;
  for (const id of ['#left', '#right', '#bottom']) {
    const e = $(id);
    if (!shown(e)) continue;
    const r = e.getBoundingClientRect();
    if (r.width > 0.6 * W) { if (r.top > H / 2) y1 = Math.min(y1, r.top); else y0 = Math.max(y0, r.bottom); }
    else if (r.height > 0.35 * H) { if (r.left < W / 2) x0 = Math.max(x0, r.right); else x1 = Math.min(x1, r.left); }
  }
  if (x1 - x0 < 0.3 * W) { x0 = 0; x1 = W; }
  if (y1 - y0 < 0.3 * H) { y0 = 0; y1 = H; }
  return { x0, x1, y0, y1 };
}
function frameFree() {
  const W = innerWidth, H = innerHeight, f = freeRect(), cx = (f.x0 + f.x1) / 2, cy = (f.y0 + f.y1) / 2;
  if (Math.abs(cx - W / 2) < 1 && Math.abs(cy - H / 2) < 1) camera.clearViewOffset();
  else camera.setViewOffset(W, H, W / 2 - cx, H / 2 - cy, W, H);
  camera.updateProjectionMatrix();
  return f;
}
function camFit() {                  // the whole model in the free part of the window, seen from the same direction
  const f = frameFree();
  scene.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(cad);
  if (!Number.isFinite(bb.min.x)) return;
  const c = bb.getCenter(new THREE.Vector3()), r = 0.5 * bb.getSize(new THREE.Vector3()).length();
  const t = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const dist = 0.92 * r / Math.min(t * (f.y1 - f.y0) / innerHeight, t * camera.aspect * (f.x1 - f.x0) / innerWidth);
  const dir = camera.position.clone().sub(controls.target).normalize();
  controls.target.copy(c); camera.position.copy(c).addScaledVector(dir, dist); controls.update();
}
function setUiHidden(on) {
  document.querySelectorAll('.ui').forEach(e => e.classList.toggle('hidden', on));
  $('#showUi').classList.toggle('hidden', !on);
  frameFree();
}
function camAct(d, k = 1) {
  if (d.cam === 'pan') camPan(+d.dx * 0.04 * k, +d.dy * 0.04 * k);
  else if (d.cam === 'orbit') camOrbit(+d.da * 0.105 * k, +d.de * 0.105 * k);
  else if (d.cam === 'zoom') camZoom(Math.pow(+d.f, k));
  else if (d.cam === 'fit') camFit();
}
document.querySelectorAll('#campad [data-cam]').forEach(b => {
  let hold = null, rep = null;
  const stop = () => { clearTimeout(hold); clearInterval(rep); hold = rep = null; };
  b.addEventListener('pointerdown', e => {           // press: one step; keep pressing: it keeps going
    e.preventDefault(); stop(); camAct(b.dataset);
    if (b.dataset.cam !== 'fit') hold = setTimeout(() => { rep = setInterval(() => camAct(b.dataset, 0.35), 40); }, 320);
  });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, stop);
});
$('#hideUi').onclick = () => setUiHidden(true);
$('#showUi').onclick = () => setUiHidden(false);
addEventListener('keydown', e => {
  const tg = e.target;
  if (e.ctrlKey || e.metaKey || e.altKey || (tg && tg.closest && tg.closest('input, select, textarea'))) return;
  const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }, a = arrows[e.key];
  if (a) { e.preventDefault(); if (e.shiftKey) camOrbit(a[0] * 0.105, a[1] * 0.105); else camPan(a[0] * 0.04, a[1] * 0.04); return; }
  if (e.key === '+' || e.key === '=') camZoom(0.88);
  else if (e.key === '-' || e.key === '_') camZoom(1.14);
  else if (e.key === 'f' || e.key === 'F') camFit();
  else if ((e.key === 'h' || e.key === 'H') && params.get('ui') !== '0') setUiHidden($('#showUi').classList.contains('hidden'));
});
for (const id of ['#left', '#right', '#bottom']) if ($(id) && window.ResizeObserver) new ResizeObserver(() => frameFree()).observe($(id));

// ------------------------------------------------------------------ the face on the display (drawn live by face.js)
function setFace(name) {            // an expression by name; '' or 'auto' gives the face back to itself (it then follows the pointer)
  if (!S.fe) return;
  const n = (!name || name === 'auto') ? null : name;
  S.fe.set(n);
  if ($('#face').value !== (n || 'auto')) $('#face').value = n || 'auto';
}
// a motion may carry a face track: faces: [{t, face}, ...] - the face named by the last entry at or before t
function faceAt(t) {
  let name = null;
  for (const e of (S.motion.faces || [])) if (e.t <= t + 1e-9) name = e.face;
  return name;
}
function applyTrack() { const f = faceAt(S.t); if (f && S.fe) { S.fe.set(f); if ($('#face').value !== f) $('#face').value = f; } }
// where the pointer is as seen from the face: -1..1 for about 60 mm either side of the display's centre, in the display's own plane
function faceGaze() {
  const m = S.faceMesh; if (!m || !S.pointer) return null;
  m.updateWorldMatrix(true, false);
  const c = S.faceCentre, W = m.matrixWorld;                                  // c: the mesh's own CAD coordinates (mm)
  const c0 = c.clone().applyMatrix4(W);
  const n = new THREE.Vector3(0, -1, 0).transformDirection(W);                // the display faces -Y in CAD
  if (n.dot(camera.position.clone().sub(c0)) <= 0) return [0, 0];            // seen from behind
  const p0 = c0.clone().project(camera);
  const pr = new THREE.Vector3(c.x + 60, c.y, c.z).applyMatrix4(W).project(camera);
  const pu = new THREE.Vector3(c.x, c.y, c.z + 60).applyMatrix4(W).project(camera);
  const a = camera.aspect, d = [(S.pointer.x - p0.x) * a, S.pointer.y - p0.y];
  const r = [(pr.x - p0.x) * a, pr.y - p0.y], u = [(pu.x - p0.x) * a, pu.y - p0.y];
  const dot = (v, w) => v[0] * w[0] + v[1] * w[1];
  return [dot(d, r) / Math.max(dot(r, r), 1e-9), dot(d, u) / Math.max(dot(u, u), 1e-9)];
}
// write the still pictures (one per expression, at the display's pixel count) that the CAD build and the Blender renders use
async function exportFaces() {
  if (!S.fe) return null;
  const fd = S.cfg.face_display, faces = {};
  for (const n of Object.keys(EXPRESSIONS)) {
    await fetch(`/api/faces/${fd.set}/${n}`, { method: 'PUT', body: S.fe.still(n).toDataURL('image/png') });
    faces[n] = EXPRESSIONS[n].info;
  }
  const meta = { set: fd.set, display: fd.display, pixels: fd.pixels, picture_mm: fd.picture_mm, pixel_pitch_mm: +(fd.picture_mm[0] / fd.pixels[0]).toFixed(4),
    pixels_per_inch: Math.round(fd.pixels[0] / fd.picture_mm[0] * 25.4), eye_style: S.fe.style, palette: S.fe.palette,
    note: "pictures at the display's real pixel size, drawn by 06_Viewer/src/face.js and exported from the viewer; the display's firmware is NOT written", faces };
  await fetch(`/api/faces/${fd.set}/faces.json`, { method: 'PUT', body: JSON.stringify(meta, null, 1) });
  return { exported: Object.keys(faces).length, set: fd.set, style: S.fe.style };
}
// every expression in every eye style on one sheet (half size), saved next to the viewer captures
async function styleSheet(name = 'eye_styles') {
  if (!S.fe) return null;
  const names = Object.keys(EXPRESSIONS).filter(n => n !== 'off'), k = 0.5, w = S.fe.W * k, h = S.fe.H * k, pad = 10, lab = 150;
  const c = document.createElement('canvas'); c.width = lab + STYLES.length * (w + pad) + pad; c.height = 40 + names.length * (h + pad);
  const x = c.getContext('2d'); x.fillStyle = '#1e1e20'; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = '#eee'; x.font = 'bold 16px sans-serif';
  STYLES.forEach((st, i) => x.fillText(st, lab + i * (w + pad) + 6, 26));
  names.forEach((n, r) => {
    x.fillStyle = '#eee'; x.font = '15px sans-serif'; x.fillText(n, 12, 40 + r * (h + pad) + h / 2 + 5);
    STYLES.forEach((st, i) => x.drawImage(S.fe.still(n, st), lab + i * (w + pad), 40 + r * (h + pad), w, h));
  });
  return (await fetch(`/api/screenshot/${S.rev}/${name}`, { method: 'PUT', body: c.toDataURL('image/png') })).json();
}

// ------------------------------------------------------------------ loading
// published copy: the CAD assembly arrives as base64 JSON chunks (the host serves no .glb); decode and parse in the page
async function loadParts(rev) {
  const man = await (await fetch(`assets/${rev}/parts_manifest.json`)).json();
  const bytes = new Uint8Array(man.bytes);
  let at = 0;
  for (const c of man.chunks) {
    const s = atob((await (await fetch(`assets/${rev}/${c}`)).json()).b64);
    for (let i = 0; i < s.length; i++) bytes[at + i] = s.charCodeAt(i);
    at += s.length;
  }
  return new GLTFLoader().parseAsync(bytes.buffer, '');
}
async function loadRevision(rev) {
  S.rev = rev; S.faceMesh = null;
  $('#loading').classList.remove('hidden');
  const cfg = await (await fetch(`assets/${rev}/joint_config.json`)).json();
  const gltf = await loadParts(rev);
  const lib = {};
  gltf.scene.traverse(o => { if (o.isMesh) lib[(o.name || o.parent.name)] = o; });
  S.cfg = cfg;
  while (cad.children.length) cad.remove(cad.children[0]);
  S.links = {}; S.byKind = {};
  for (const l of cfg.links) {
    const g = new THREE.Group();
    g.name = l.name; g.matrixAutoUpdate = false;
    cad.add(g); S.links[l.name] = g;
  }
  const missing = new Set();
  for (const v of cfg.visuals) {
    if (cfg.cable_defs && v.kind === 'cable') continue;      // rigid per-link cable pieces: replaced by cables solved for the pose (cables.js)
    const src = lib[v.mesh.replace('/', '__')];
    if (!src) { missing.add(v.mesh); continue; }
    const m = new THREE.Mesh(src.geometry, src.material);
    m.name = v.name; m.matrixAutoUpdate = false; m.matrix.copy(matFromRows(v.T));
    if (cfg.face_display && v.mesh === cfg.face_display.mesh) {
      // the display's picture. It lies BEHIND the smoked plate; drawn after it and added to it, i.e. at the brightness it has after the plate
      m.material = new THREE.MeshBasicMaterial({ color: 0xffffff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false });
      m.renderOrder = 5; S.faceMesh = m;
    }
    m.castShadow = true; m.receiveShadow = true;
    if (src.material.transparent || v.kind === 'envelope') { m.castShadow = false; }
    S.links[v.link].add(m);
    const kind = v.kind === 'envelope' ? 'electronics' : v.kind;
    (S.byKind[kind] ||= []).push(m);
  }
  if (missing.size) console.warn('meshes missing from parts GLB:', [...missing]);
  S.cables = cfg.cable_defs ? new Cables(cfg.cable_defs, cad, S.links) : null; S.cableTaut = [];
  if (S.cables) (S.byKind.electronics ||= []).push(...S.cables.meshes);
  S.fe = null;
  if (cfg.face_display && S.faceMesh) {
    const fd = cfg.face_display;
    S.fe = new FaceEngine(fd.pixels, fd.picture_mm, params.get('eyes') || fd.eye_style || 'sparkle', fd.palette || 'mint');
    const tex = new THREE.CanvasTexture(S.fe.canvas); tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace;
    S.faceMesh.material.map = tex; S.faceMesh.material.needsUpdate = true; S.faceTex = tex;
    S.faceMesh.geometry.computeBoundingBox(); S.faceCentre = S.faceMesh.geometry.boundingBox.getCenter(new THREE.Vector3());
    $('#face').innerHTML = '<option value="auto">face: alive</option>' + Object.keys(EXPRESSIONS).map(n => `<option>${n}</option>`).join('');
    $('#eyes').innerHTML = STYLES.map(n => `<option>${n}</option>`).join(''); $('#eyes').value = S.fe.style;
  } else { S.faceMesh = null; $('#face').innerHTML = '<option value="">— no display —</option>'; $('#eyes').innerHTML = ''; }
  // joint axes
  S.axes = [];
  cfg.joints.forEach((j, i) => {
    if (j.passive) return;
    const col = JOINT_COLORS[i % JOINT_COLORS.length];
    const a = new THREE.Vector3(...j.axis).normalize(), o = new THREE.Vector3(...j.origin_mm);
    const L = 42;
    const g = new THREE.Group();
    const geo = new THREE.BufferGeometry().setFromPoints([o.clone().addScaledVector(a, -L), o.clone().addScaledVector(a, L)]);
    g.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: col, depthTest: false })));
    const cone = new THREE.Mesh(new THREE.ConeGeometry(3.2, 10, 16), new THREE.MeshBasicMaterial({ color: col, depthTest: false }));
    cone.position.copy(o).addScaledVector(a, L);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), a);
    g.add(cone);
    const lab = textSprite(`${j.name} ${j.module}.${j.module_axis}`, col);
    lab.position.copy(o).addScaledVector(a, L + 14);
    g.add(lab);
    g.renderOrder = 10;
    S.links[j.parent].add(g); S.axes.push(g);
  });
  // collision boxes
  S.boxes = buildBoxes(cfg); S.boxHelpers = [];
  for (const b of S.boxes) {
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2 * b.half.x, 2 * b.half.y, 2 * b.half.z)),
      new THREE.LineBasicMaterial({ color: 0x58c48a }));
    e.matrixAutoUpdate = false; e.matrix.copy(b.local);
    S.links[b.link].add(e); S.boxHelpers.push(e); b.helper = e;
  }
  // centre of mass marker (world CAD frame)
  S.com = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(4, 20, 12), new THREE.MeshBasicMaterial({ color: 0x1463c9, depthTest: false }));
  const drop = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]),
    new THREE.LineDashedMaterial({ color: 0x1463c9, dashSize: 4, gapSize: 3, depthTest: false }));
  S.com.add(ball, drop); S.com.userData = { ball, drop }; S.com.renderOrder = 11;
  cad.add(S.com);
  if (cfg.support_polygon_mm) {
    const pts = cfg.support_polygon_mm.map(p => new THREE.Vector3(p[0], p[1], 0.6));
    cad.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x4fa3e8 })));
  }
  S.q = Object.fromEntries(cfg.joints.map(j => [j.name, j.home_deg || 0]));
  S.motion.revision = rev;
  buildJointUI(); buildWarnings();
  $('#revname').textContent = rev; $('#gen').textContent = 'CAD export ' + cfg.generated;
  applyVisibility(); update();
  $('#loading').classList.add('hidden');
}

function textSprite(text, color) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const x = c.getContext('2d');
  x.font = '600 34px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = 'rgba(15,17,20,.88)'; x.fillRect(0, 8, 256, 48);
  x.fillStyle = '#' + color.toString(16).padStart(6, '0'); x.fillText(text, 128, 33);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false }));
  s.scale.set(44, 11, 1); s.renderOrder = 12;
  return s;
}

// ------------------------------------------------------------------ joints UI
const lim = j => j.soft_limit_deg || j.hard_limit_deg;
function toNorm(j, deg) { const [lo, hi] = lim(j), h = j.home_deg || 0; return deg >= h ? (deg - h) / Math.max(1e-9, hi - h) : (deg - h) / Math.max(1e-9, h - lo); }
function fromNorm(j, n) { const [lo, hi] = lim(j), h = j.home_deg || 0; return n >= 0 ? h + n * (hi - h) : h + n * (h - lo); }

function buildJointUI() {
  const box = $('#joints'); box.innerHTML = '';
  S.cfg.joints.forEach((j, i) => {
    if (j.passive) {     // no motor, no slider: it follows gravity
      const el = document.createElement('div'); el.className = 'joint';
      el.innerHTML = `<div class="hd"><span class="nm">${j.name} · passive</span><span class="badge">no motor</span></div>
        <div class="role">${j.role}</div><div class="sub">follows gravity: <span data-jp="${j.name}">0</span>° (ideal, friction ignored)</div>`;
      box.appendChild(el);
      return;
    }
    const [lo, hi] = lim(j);
    const idv = j.dxl_id.value ?? j.dxl_id.hypothesis;
    const verified = j.dxl_id.value != null;
    const el = document.createElement('div'); el.className = 'joint';
    el.innerHTML = `
      <div class="hd"><span class="nm" style="color:#${JOINT_COLORS[i].toString(16).padStart(6, '0')}">${j.name} · ${j.module}.${j.module_axis}</span>
        <span><span class="badge ${verified ? 'ok' : 'warn'}" title="${j.dxl_id.status || ''}">ID ${idv}${verified ? '' : ' ?'}</span>
        <span class="badge" title="axis in parent link frame at home">axis [${j.axis.join(' ')}]</span></span></div>
      <div class="role">${j.role}</div>
      <div class="row"><input type="range" data-j="${j.name}" min="${lo}" max="${hi}" step="0.5" value="0">
        <input type="number" data-jn="${j.name}" step="1" value="0"><span class="sub" data-ju="${j.name}">°</span></div>
      <div class="sub">soft ${lo}…${hi}° <span class="badge ${j.soft_limit_deg ? 'warn' : 'bad'}" title="${j.soft_limit_provenance || ''}">${j.soft_limit_deg ? 'CAD estimate' : 'NO SOFT LIMIT'}</span>
        hard ${j.hard_limit_deg[0]}…${j.hard_limit_deg[1]}° · ≤ ${j.max_speed_deg_s}°/s</div>`;
    box.appendChild(el);
  });
  box.querySelectorAll('input[type=range]').forEach(r => r.addEventListener('input', () => {
    const j = S.cfg.joints.find(x => x.name === r.dataset.j);
    S.q[j.name] = $('#norm').checked ? fromNorm(j, parseFloat(r.value)) : parseFloat(r.value);
    update();
  }));
  box.querySelectorAll('input[type=number]').forEach(n => n.addEventListener('change', () => {
    const j = S.cfg.joints.find(x => x.name === n.dataset.jn);
    const [lo, hi] = lim(j);
    const v = $('#norm').checked ? fromNorm(j, THREE.MathUtils.clamp(parseFloat(n.value), -1, 1)) : parseFloat(n.value);
    S.q[j.name] = THREE.MathUtils.clamp(v, lo, hi); update();
  }));
  $('#inactive').innerHTML = (S.cfg.notes || []).filter(n => n.startsWith('Inactive')).join('<br>');
  // named poses exported by the CAD build (special poses are outside the everyday limits and flagged)
  const np = S.cfg.named_poses || {}, sp = S.cfg.special_poses || {};
  $('#poses').innerHTML = Object.keys(np).map(k => `<button data-pose="${k}" title="${sp[k] ? sp[k].status : ''}">${k}${sp[k] ? ' ⚠' : ''}</button>`).join('');
  $('#poses').querySelectorAll('button').forEach(b => b.onclick = () => {
    for (const j of S.cfg.joints) S.q[j.name] = np[b.dataset.pose][j.name] ?? 0;
    update();
  });
  syncJointUI(true);
}

function syncJointUI(rebuildScale = false) {
  const norm = $('#norm').checked;
  for (const j of S.cfg.joints) {
    if (j.passive) continue;
    const r = document.querySelector(`input[data-j="${j.name}"]`), n = document.querySelector(`input[data-jn="${j.name}"]`);
    if (rebuildScale) {
      const [lo, hi] = lim(j);
      if (norm) { r.min = -1; r.max = 1; r.step = 0.01; n.step = 0.05; }
      else { r.min = lo; r.max = hi; r.step = 0.5; n.step = 1; }
      document.querySelector(`[data-ju="${j.name}"]`).textContent = norm ? 'n' : '°';
    }
    const v = norm ? toNorm(j, S.q[j.name]) : S.q[j.name];
    r.value = v;
    if (document.activeElement !== n) n.value = (+v).toFixed(norm ? 2 : 1);
  }
}

function buildWarnings() {
  const w = [];
  const c = S.cfg;
  if (c.joints.some(j => j.dxl_id.value == null)) w.push('DYNAMIXEL ID ↔ axis map is a HYPOTHESIS (photo stickers conflict). Do not use these IDs on hardware until confirmed.');
  if (c.joints.some(j => j.home_ticks?.value == null)) w.push('Home/zero offsets are UNMEASURED: 0° here = the photographed straight stack, not a known encoder count.');
  w.push('Soft limits are CAD collision estimates, not hardware-measured stops. Cable twist, plugs and screw heads are NOT in the collision model.');
  if (c.collision_boxes?.length) w.push('Live collision = oriented-box proxies (approximate). Sampled mesh check: 07_Verification/' + S.rev + '/verify_report.json.');
  else w.push('This revision has no live collision proxies. Movement is visual exploration only; collision and cable clearance are UNVERIFIED.');
  for (const n of (c.notes || [])) if (/UNMEASURED|PRELIMINARY|ASSUM|UNVERIFIED|NOT revalidated/i.test(n)) w.push(n);
  $('#warnings').innerHTML = w.map(x => `<li>${x}</li>`).join('');
}

// ------------------------------------------------------------------ pose update
function comWorld(T) {
  let M = 0; const c = new THREE.Vector3();
  for (const m of S.cfg.masses || []) {
    const p = new THREE.Vector3(...m.p).applyMatrix4(T[m.link]);
    c.addScaledVector(p, m.mass_g); M += m.mass_g;
  }
  return { c: M ? c.multiplyScalar(1 / M) : c, M };
}

function violatedConstraints(q) {
  return (S.cfg.constraints || []).filter(c => c.type === 'sum_min' && c.joints.reduce((a, j) => a + (q[j] || 0), 0) < c.min - 1e-9);
}

function update() {
  const T = fk(S.cfg, S.q);
  for (const [name, g] of Object.entries(S.links)) g.matrix.copy(T[name]);
  if (S.cables) S.cableTaut = S.cables.update();
  for (const [jn, ang] of Object.entries(T.__passive || {})) { const e = document.querySelector(`[data-jp="${jn}"]`); if (e) e.textContent = ang.toFixed(0); }
  S.hits = checkBoxes(S.boxes, T, S.cfg.desk_plane_check === false ? null : 0);
  const bad = new Set();
  for (const h of S.hits) { if (h.a.helper) bad.add(h.a.helper); if (h.b.helper) bad.add(h.b.helper); }
  for (const e of S.boxHelpers) e.material.color.setHex(bad.has(e) ? 0xf0625d : 0x58c48a);
  const { c, M } = comWorld(T);
  S.com.position.set(c.x, c.y, c.z);
  S.com.userData.drop.scale.set(1, 1, Math.max(1, c.z));
  S.com.userData.drop.computeLineDistances();
  const out = [];
  out.push(`<div class="line">Pose: ${S.cfg.joints.filter(j => !j.passive).map(j => `${j.name} ${S.q[j.name].toFixed(0)}°`).join(' · ')}</div>`);
  if (S.cfg.collision_boxes?.length) out.push(`<div class="line">Box collisions: <span class="badge ${S.hits.length ? 'bad' : 'ok'}">${S.hits.length ? S.hits.length + ' overlap' : 'none'}</span></div>`);
  else out.push('<div class="line">충돌: <span class="badge warn">미검증 · 모델 데이터 없음</span></div>');
  if (S.cables && S.cfg.cable_defs?.length) out.push(`<div class="line">Cables: <span class="badge ${S.cableTaut.length ? 'bad' : 'ok'}">${S.cableTaut.length ? S.cableTaut.map(c => `${c.name} ${c.short.toFixed(0)} mm short`).join(', ') : 'all reach in this pose'}</span></div>`);
  else out.push('<div class="line">배선: <span class="badge warn">미검증 · 경로 미확정</span></div>');
  for (const h of S.hits.slice(0, 4)) out.push(`<div class="line sub">✕ ${h.a.name} ↔ ${h.b.name}</div>`);
  if (S.cfg.live_check_excluded) out.push(`<div class="line sub">Not in this live check (mesh-sampled offline instead): ${S.cfg.live_check_excluded.join(', ')}</div>`);
  if (S.cfg.verification_status?.mass_model === 'STALE_NOT_FOR_TORQUE') out.push('<div class="line sub">질량·무게중심: 이전 모델 추정치 · 하중 계산 미검증</div>');
  else out.push(`<div class="line sub">Mass ${M.toFixed(0)} g · COM x ${c.x.toFixed(0)} y ${c.y.toFixed(0)} z ${c.z.toFixed(0)} mm</div>`);
  for (const c of violatedConstraints(S.q)) out.push(`<div class="line"><span class="badge bad">coupled limit: ${c.joints.join(' + ')} &lt; ${c.min}°</span> <span class="sub">${c.why}</span></div>`);
  const outLim = S.cfg.joints.filter(j => !j.passive && (S.q[j.name] < lim(j)[0] - 1e-6 || S.q[j.name] > lim(j)[1] + 1e-6));
  if (outLim.length) out.push(`<div class="line"><span class="badge bad">outside soft limit: ${outLim.map(j => j.name).join(', ')}</span></div>`);
  $('#status').innerHTML = out.join('');
  syncJointUI();
}

function applyVisibility() {
  document.querySelectorAll('input[data-kind]').forEach(cb => (S.byKind[cb.dataset.kind] || []).forEach(m => { m.visible = cb.checked; }));
  (S.axes || []).forEach(a => { a.visible = $('#showAxes').checked; });
  S.boxHelpers.forEach(b => { b.visible = $('#showBoxes').checked; });
  if (S.com) S.com.visible = $('#showCom').checked;
}

// ------------------------------------------------------------------ timeline
const names = () => S.cfg.joints.filter(j => !j.passive).map(j => j.name);
function refreshTimeline() {
  const kf = S.motion.keyframes, dur = Math.max(motionDuration(S.motion), 0.001);
  const track = $('#track');
  track.querySelectorAll('.kf,.hit').forEach(e => e.remove());
  (S.motion._hits || []).forEach(([a, b]) => {
    const d = document.createElement('div'); d.className = 'hit';
    d.style.left = (100 * a / dur) + '%'; d.style.width = Math.max(0.4, 100 * (b - a) / dur) + '%'; track.appendChild(d);
  });
  kf.forEach((k, i) => {
    const d = document.createElement('div'); d.className = 'kf' + (i === S.sel ? ' sel' : '');
    d.style.left = (100 * k.t / dur) + '%'; d.title = `key ${i} @ ${k.t.toFixed(2)} s (${k.ease || 'minjerk'})`;
    d.addEventListener('click', ev => { ev.stopPropagation(); S.sel = i; setTime(k.t); refreshTimeline(); });
    track.appendChild(d);
  });
  $('#head').style.left = (100 * Math.min(S.t, dur) / dur) + '%';
  $('#tnow').textContent = S.t.toFixed(2); $('#tdur').textContent = motionDuration(S.motion).toFixed(2);
  $('#mname').value = S.motion.name; $('#loop').checked = !!S.motion.loop;
  if (S.sel >= 0 && kf[S.sel]) { if (document.activeElement !== $('#kft')) $('#kft').value = kf[S.sel].t.toFixed(2); $('#kfease').value = kf[S.sel].ease || 'minjerk'; }
}
function setTime(t) {
  S.t = Math.max(0, t);
  if (S.motion.keyframes.length) { Object.assign(S.q, sampleMotion(S.motion, S.t, names())); update(); }
  applyTrack();
  refreshTimeline();
}
function addKey() {
  const kf = S.motion.keyframes, q = Object.fromEntries(names().map(n => [n, +S.q[n].toFixed(2)]));
  const i = kf.findIndex(k => Math.abs(k.t - S.t) < 0.02);
  if (i >= 0) { kf[i].q = q; S.sel = i; }
  else { kf.push({ t: +S.t.toFixed(3), q, ease: 'minjerk' }); kf.sort((a, b) => a.t - b.t); S.sel = kf.findIndex(k => Math.abs(k.t - S.t) < 1e-6); }
  S.motion._hits = null; refreshTimeline();
}
function checkMotion(quiet = false) {
  const kf = S.motion.keyframes; if (kf.length < 2) { if (!quiet) $('#report').textContent = 'Need at least two keyframes.'; return null; }
  const dur = motionDuration(S.motion), dt = 0.02, js = S.cfg.joints.filter(j => !j.passive);
  const vmax = Object.fromEntries(js.map(j => [j.name, 0])), over = new Set(), lims = new Set();
  const hitSpans = []; let hitStart = null, firstHit = null; let prev = null;
  // same exemption rule as check_motion() in 09_Control/notifyi_control.py: a motion that goes to (or leaves) a special
  // pose may leave the everyday limits on the joints that pose names, and is not held to the coupled limits
  const special = new Set(), specialNames = [];
  for (const [name, sp] of Object.entries(S.cfg.special_poses || {})) {
    if ([name, 'un' + name].includes(S.motion.name) || (S.motion.meta || {}).special_pose === name) {
      specialNames.push(name); for (const j of sp.outside_soft_limits || []) special.add(j);
    }
  }
  for (let t = 0; t <= dur + 1e-9; t += dt) {
    const q = sampleMotion(S.motion, t, names());
    for (const j of js) {
      if (prev) { const v = Math.abs(q[j.name] - prev[j.name]) / dt; if (v > vmax[j.name]) vmax[j.name] = v; if (v > j.max_speed_deg_s + 1e-6) over.add(j.name); }
      if ((q[j.name] < lim(j)[0] - 1e-6 || q[j.name] > lim(j)[1] + 1e-6) && !special.has(j.name)) lims.add(j.name);
    }
    if (!special.size) for (const c of violatedConstraints(q)) lims.add(c.joints.join('+'));
    const hits = checkBoxes(S.boxes, fk(S.cfg, q), 0);
    if (hits.length) { if (hitStart === null) hitStart = t; firstHit ??= { t, pair: `${hits[0].a.name} ↔ ${hits[0].b.name}` }; }
    else if (hitStart !== null) { hitSpans.push([hitStart, t]); hitStart = null; }
    prev = q;
  }
  if (hitStart !== null) hitSpans.push([hitStart, dur]);
  S.motion._hits = hitSpans;
  const hasCollisionData = Boolean(S.cfg.collision_boxes?.length);
  const res = { duration: dur, vmax, over: [...over], limit_violations: [...lims], collisions: hasCollisionData ? hitSpans : null, collision_status: hasCollisionData ? 'PROXY_ONLY' : 'UNVERIFIED_NO_DATA', firstHit, special_pose_exemption: specialNames };
  if (!quiet) {
    $('#report').textContent =
      `Checked ${dur.toFixed(2)} s @50 Hz · peak speed ${js.map(j => `${j.name} ${vmax[j.name].toFixed(0)}`).join(', ')} °/s` +
      (over.size ? `  ✕ over speed limit: ${[...over].join(', ')}` : '  ✓ speed') +
      (lims.size ? `  ✕ outside soft limit: ${[...lims].join(', ')}` : '  ✓ limits') +
      (specialNames.length ? ` (special pose "${specialNames.join(', ')}": ${[...special].join(', ')} and the coupled limit exempt)` : '') +
      (!hasCollisionData ? '  ⚠ 충돌 미검증 · 데이터 없음' : hitSpans.length ? `  ✕ box collision first at ${firstHit.t.toFixed(2)} s (${firstHit.pair})` : '  ✓ no box collision') +
      '\nUnknown/not modelled: cable twist & snagging, connector plugs, screw heads, compliance, real motor tracking.';
    refreshTimeline();
  }
  return res;
}
function retime() {
  const kf = S.motion.keyframes; if (kf.length < 2) return;
  const js = S.cfg.joints.filter(j => !j.passive); let shift = 0; const orig = kf.map(k => k.t);
  for (let i = 1; i < kf.length; i++) {
    const seg = orig[i] - orig[i - 1];
    // peak speed of a min-jerk segment is 1.875 * delta / T (linear: 1.0)
    const k = (kf[i].ease === 'linear') ? 1.0 : 1.875;
    let need = 0;
    for (const j of js) need = Math.max(need, k * Math.abs((kf[i].q[j.name] ?? 0) - (kf[i - 1].q[j.name] ?? 0)) / j.max_speed_deg_s);
    if (kf[i].ease !== 'hold' && need > seg) shift += need - seg;
    kf[i].t = +(orig[i] + shift).toFixed(3);
  }
  checkMotion();
}
function loadMotion(m) {
  S.motion = { schema: 'notifyi.motion/1', name: m.name || 'untitled', revision: m.revision || S.rev, loop: !!m.loop, meta: m.meta || {},
               faces: (m.faces || []).map(e => ({ t: +e.t, face: e.face })).sort((a, b) => a.t - b.t),
               keyframes: (m.keyframes || []).map(k => ({ t: +k.t, q: { ...k.q }, ease: k.ease || 'minjerk' })).sort((a, b) => a.t - b.t) };
  S.sel = -1; S.playing = false; $('#play').textContent = '▶ Play';
  setTime(0);
  $('#report').textContent = (m.meta?.intent ? `Intent: ${m.meta.intent}. ` : '') + (m.meta?.notes || '') + (m.revision && m.revision !== S.rev ? `  ⚠ authored for ${m.revision}` : '');
  checkMotion(true); refreshTimeline();
}
const cleanMotion = () => ({ schema: 'notifyi.motion/1', name: S.motion.name, revision: S.rev, loop: S.motion.loop, meta: S.motion.meta || {},
  ...(S.motion.faces?.length ? { faces: S.motion.faces } : {}),
  keyframes: S.motion.keyframes.map(k => ({ t: k.t, q: k.q, ease: k.ease })) });
async function refreshPresets() {
  const list = await (await fetch('motions.json')).json();
  $('#presets').innerHTML = '<option value="">— presets —</option>' + list.map(f => `<option>${f}</option>`).join('');
}

// ------------------------------------------------------------------ events
$('#home').onclick = () => { for (const j of S.cfg.joints) S.q[j.name] = j.home_deg || 0; update(); };
$('#norm').onchange = () => syncJointUI(true);
$('#rev').onchange = e => loadRevision(e.target.value);
document.querySelectorAll('#views button').forEach(b => b.onclick = () => { setView(b.dataset.v); if ($('#showUi').classList.contains('hidden') && params.get('ui') !== '0') camFit(); });
document.querySelectorAll('#right input[type=checkbox]').forEach(cb => cb.addEventListener('change', applyVisibility));
$('#track').addEventListener('click', ev => { const r = $('#track').getBoundingClientRect(); S.sel = -1; setTime((ev.clientX - r.left) / r.width * Math.max(motionDuration(S.motion), S.t + 1, 2)); });
$('#addkf').onclick = addKey;
$('#delkf').onclick = () => { if (S.sel >= 0) { S.motion.keyframes.splice(S.sel, 1); S.sel = -1; S.motion._hits = null; refreshTimeline(); } };
$('#kft').onchange = e => { const k = S.motion.keyframes[S.sel]; if (!k) { S.t = Math.max(0, +e.target.value); refreshTimeline(); return; } k.t = Math.max(0, +e.target.value); S.motion.keyframes.sort((a, b) => a.t - b.t); S.sel = S.motion.keyframes.indexOf(k); S.t = k.t; refreshTimeline(); };
$('#kfease').onchange = e => { const k = S.motion.keyframes[S.sel]; if (k) k.ease = e.target.value; };
$('#mname').onchange = e => { S.motion.name = e.target.value.replace(/[^A-Za-z0-9_-]/g, '_') || 'untitled'; };
$('#loop').onchange = e => { S.motion.loop = e.target.checked; };
$('#play').onclick = () => { if (S.motion.keyframes.length < 2) return; S.playing = !S.playing; if (S.playing && S.t >= motionDuration(S.motion)) S.t = 0; S.lastTick = performance.now(); $('#play').textContent = S.playing ? '❚❚ Pause' : '▶ Play'; };
$('#stop').onclick = () => { S.playing = false; $('#play').textContent = '▶ Play'; setTime(0); };
$('#check').onclick = () => checkMotion();
$('#retime').onclick = retime;
$('#save').onclick = async () => { const r = await fetch('/api/motions/' + S.motion.name, { method: 'PUT', body: JSON.stringify(cleanMotion(), null, 1) }); $('#report').textContent = r.ok ? `Saved 06_Viewer/motions/${S.motion.name}.json` : 'Save failed: ' + await r.text(); refreshPresets(); };
$('#export').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(cleanMotion(), null, 1)], { type: 'application/json' })); a.download = S.motion.name + '.json'; a.click(); };
$('#import').onclick = () => $('#file').click();
$('#file').onchange = async e => { const f = e.target.files[0]; if (f) loadMotion(JSON.parse(await f.text())); e.target.value = ''; };
$('#presets').onchange = async e => { if (e.target.value) loadMotion(await (await fetch('motions/' + e.target.value)).json()); };
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; renderer.setSize(innerWidth, innerHeight); frameFree(); });

function tick(now) {
  if (S.playing) {
    S.t += (now - S.lastTick) / 1000; S.lastTick = now;
    const dur = motionDuration(S.motion);
    if (S.t >= dur) { if (S.motion.loop) S.t = S.t % dur; else { S.t = dur; S.playing = false; $('#play').textContent = '▶ Play'; } }
    Object.assign(S.q, sampleMotion(S.motion, S.t, names())); update(); applyTrack(); refreshTimeline();
    if (!S.playing && S.fe && S.motion.faces?.length) setTimeout(() => setFace('auto'), 1200);     // the motion is over: the face lives on its own again
  }
  if (S.fe) {
    const g = faceGaze();
    if (g && S.pointerMoved) { S.fe.lookAt(g[0], g[1], now); S.pointerMoved = false; }
    else if (g) S.fe.gazeTarget = [Math.max(-1, Math.min(1, g[0])), Math.max(-1, Math.min(1, g[1]))];
    if (S.fe.update(now)) S.faceTex.needsUpdate = true;
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

// ------------------------------------------------------------------ boot + test API
(async () => {
  const revs = await (await fetch('revisions.json')).json();
  $('#rev').innerHTML = revs.map(r => `<option>${r.name}</option>`).join('');
  const rev = params.get('rev') || revs[0].name; $('#rev').value = rev;
  await loadRevision(rev); await refreshPresets();
  if (params.get('motion')) { loadMotion(await (await fetch('motions/' + params.get('motion'))).json()); $('#presets').value = params.get('motion'); }
  if (params.get('t')) setTime(parseFloat(params.get('t')));
  if (params.get('pose')) { for (const kv of params.get('pose').split(',')) { const [k, v] = kv.split(':'); if (k in S.q) S.q[k] = parseFloat(v); } update(); }
  if (params.get('face')) setFace(params.get('face'));
  $('#face').onchange = e => setFace(e.target.value);
  $('#eyes').onchange = e => { if (S.fe) { S.fe.style = e.target.value; S.fe.dirty = true; } };
  $('#faceFollow').onchange = e => { if (S.fe) S.fe.opt.follow = e.target.checked; };
  $('#faceBlink').onchange = e => { if (S.fe) S.fe.opt.blink = e.target.checked; };
  $('#faceExport').onclick = async () => { const r = await exportFaces(); $('#report').textContent = r ? `Exported ${r.exported} faces (${r.style}) to 06_Viewer/faces/${r.set}/ - rebuild the revision to use them in renders.` : 'This revision has no display.'; };
  // the pointer: the eyes follow it; a click on the head is a poke, a double click a wink, press-and-hold a pat
  const el = renderer.domElement, ndc = e => { const r = el.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }; };
  let down = null, lastPoke = 0;
  el.addEventListener('pointermove', e => { S.pointer = ndc(e); S.pointerMoved = true; });
  el.addEventListener('pointerleave', () => { S.pointer = null; if (S.fe) S.fe.gazeTarget = [0, 0]; });
  el.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  el.addEventListener('pointerup', e => {
    if (!down || !S.fe) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), held = performance.now() - down.t; down = null;
    if (moved > 5) return;                                                  // a drag: the camera moved
    const p = ndc(e), ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(p.x, p.y), camera);
    if (!ray.intersectObjects(S.links.head ? S.links.head.children : [], true).length) return;
    const now = performance.now();
    if (S.fe.manual) setFace('auto');
    S.fe.touch(now);
    if (held > 450) S.fe.react([['happy', 2200]]);
    else if (now - lastPoke < 380) S.fe.react([['wink', 900], ['happy', 900]]);
    else S.fe.react([['surprised', 260], ['happy', 1500]]);
    lastPoke = now;
  });
  if (params.get('boxes') === '1') { $('#showBoxes').checked = true; }
  if (params.get('axes') === '0') { $('#showAxes').checked = false; }
  for (const k of (params.get('hide') || '').split(',').filter(Boolean)) { const cb = document.querySelector(`input[data-kind="${k}"]`); if (cb) cb.checked = false; }
  applyVisibility();
  if (params.get('ui') === '0') document.querySelectorAll('.ui').forEach(e => e.classList.add('hidden'));
  // R4 on is taller than the framing tuned for R0-R3: aim at the middle of the loaded model and step back
  scene.updateMatrixWorld(true);      // nothing has been rendered yet: without this the box comes back in millimetres
  const bb = new THREE.Box3().setFromObject(cad);
  if (Number.isFinite(bb.min.y) && bb.max.y - bb.min.y > 0.24 && bb.max.y - bb.min.y < 1.0) {
    const c = bb.getCenter(new THREE.Vector3());
    viewTarget.set(0, c.y, c.z);
    viewDist = 2.9 * (bb.max.y - bb.min.y);
  }
  if (params.get('dist')) viewDist = parseFloat(params.get('dist'));
  setView(params.get('view') || 'three_quarter');
  if (!params.get('dist') && params.get('ui') !== '0') camFit();      // with the panels shown: the whole model in the free part of the window
  refreshTimeline();
  requestAnimationFrame(tick);
  window.NFY = {
    state: S, setPose: q => { Object.assign(S.q, q); update(); }, getPose: () => ({ ...S.q }),
    linkWorldRows: (link, q) => rowsFromMat(fk(S.cfg, q || S.q)[link]), setView, loadMotion, setTime, checkMotion: () => checkMotion(true),
    boxHits: q => checkBoxes(S.boxes, fk(S.cfg, q || S.q), 0).map(h => [h.a.name, h.b.name]),
    constraints: q => violatedConstraints(q || S.q),
    meshCount: () => Object.values(S.byKind).reduce((n, a) => n + a.length, 0),
    setFace, face: () => (S.fe ? S.fe.name : null), faceEngine: () => S.fe, exportFaces, styleSheet,
    cables: () => ({ count: S.cables ? S.cables.items.length : 0, taut: S.cableTaut }),
    // save the viewer's own canvas into 05_Renders/viewer/<rev>/<name>.png (evidence of the running viewer)
    snap: async name => { controls.update(); renderer.render(scene, camera);
      const r = await fetch(`/api/screenshot/${S.rev}/${name}`, { method: 'PUT', body: renderer.domElement.toDataURL('image/png') }); return r.json(); },
    setToggle: (id, on) => { const e = document.querySelector(id); e.checked = on; applyVisibility(); },
    // aim the camera: target [x, y, z] in scene metres (Y up), distance in metres, a VIEWS name (review screenshots)
    aim: (t, dist, view) => { viewTarget.set(...t); viewDist = dist; setView(view || "three_quarter"); },
  };
})().catch(e => { $('#loading').textContent = 'Load failed: ' + e.message; console.error(e); });
