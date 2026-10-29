// 조립 설명서 (assembly guide), LEGO-book style, on the site's newest CAD assembly (mech_M13_solderless since 2026-10-29) (the same meshes and joint frames as the 3D
// tab, home pose). Each step adds the visuals scripts/make_assembly_steps.py lists: they fly in along an arrow from where they
// come from, the callout shows the parts (rendered from the same meshes) and the screws / inserts with their counts.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { fk, matFromRows } from './kinematics.js';
import { Cables } from './cables.js';
import { FaceEngine } from './face.js';

const $ = s => document.querySelector(s);
const DUR = 1300;                                       // ms for parts to fly in
const view = $('#asmView'), status = $('#asmStatus');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
view.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf2f5f8);
const camera = new THREE.PerspectiveCamera(30, 1, 0.005, 20);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
const lights = () => {
  const g = new THREE.Group();
  g.add(new THREE.HemisphereLight(0xffffff, 0xaeb6c2, 2.3));
  const k = new THREE.DirectionalLight(0xffffff, 1.9); k.position.set(-0.6, 1.0, 0.9); g.add(k);
  const f = new THREE.DirectionalLight(0xdfe8ff, 0.7); f.position.set(0.8, 0.3, -0.6); g.add(f);
  return g;
};
scene.add(lights());
const floor = new THREE.Mesh(new THREE.CircleGeometry(0.32, 72), new THREE.MeshStandardMaterial({ color: 0xe3e8ee, roughness: 1 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -0.0005; scene.add(floor);
// CAD (mm, Z up, front = -Y) -> three (m, Y up)
const cad = new THREE.Group(); cad.rotation.x = -Math.PI / 2; cad.scale.setScalar(0.001); scene.add(cad);
const toWorld = v => cad.localToWorld(v.clone());

let STEPS = [], items = {}, stepOf = {}, cur = -1, anim = null, arrows = [], tween = null, fe = null, faceTex = null, faceMesh = null;
const edgeMat = new THREE.LineBasicMaterial({ color: 0x2b3038, transparent: true, opacity: 0.38 });
const edgeCache = new Map();

async function loadParts(rev) {                         // the site serves the GLB as base64 JSON chunks
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

function register(name, obj, M) {
  const it = (items[name] ||= { objs: [], base: [], box: new THREE.Box3() });
  obj.matrixAutoUpdate = false; obj.matrix.copy(M);
  it.objs.push(obj); it.base.push(M.clone());
  if (obj.isMesh) {
    obj.geometry.computeBoundingBox();
    it.box.union(obj.geometry.boundingBox.clone().applyMatrix4(M));
  }
}
function addEdges(name, mesh, M) {
  const g = mesh.geometry;
  if (!edgeCache.has(g.uuid)) edgeCache.set(g.uuid, new THREE.EdgesGeometry(g, 30));
  const l = new THREE.LineSegments(edgeCache.get(g.uuid), edgeMat);
  cad.add(l); register(name, l, M);
}

// ---------------------------------------------------------------- the parts callout: thumbnails from the same meshes
const thumbR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
thumbR.setPixelRatio(1); thumbR.setSize(132, 132); thumbR.toneMapping = THREE.ACESFilmicToneMapping;
const thumbCache = new Map();
function thumb(names) {
  const key = names.join('|');
  if (thumbCache.has(key)) return thumbCache.get(key);
  const sc = new THREE.Scene(); sc.add(lights());
  const g = new THREE.Group(); g.rotation.x = -Math.PI / 2; g.scale.setScalar(0.001); sc.add(g);
  const box = new THREE.Box3();
  for (const n of names) {
    const it = items[n]; if (!it) continue;
    it.objs.forEach((o, i) => {
      const c = o.isMesh ? new THREE.Mesh(o.geometry, o.userData.mat0 || o.material) : new THREE.LineSegments(o.geometry, edgeMat);
      c.matrixAutoUpdate = false; c.matrix.copy(it.base[i]); g.add(c);
    });
    box.union(it.box);
  }
  sc.updateMatrixWorld(true);
  const wb = new THREE.Box3().setFromObject(g);
  const ctr = wb.getCenter(new THREE.Vector3()), r = Math.max(wb.getSize(new THREE.Vector3()).length() / 2, 0.004);
  const cam = new THREE.PerspectiveCamera(28, 1, 0.001, 10);
  cam.position.copy(ctr).add(new THREE.Vector3(-0.55, 0.55, 0.75).normalize().multiplyScalar(r / Math.sin(THREE.MathUtils.degToRad(14)) * 1.05));
  cam.lookAt(ctr);
  thumbR.render(sc, cam);
  const url = thumbR.domElement.toDataURL('image/png');
  thumbCache.set(key, url);
  return url;
}

// screws / inserts drawn to scale against each other (not 1:1 on screen)
function hwIcon(h) {
  const k = 4.2, L = (h.len || 6) * k, D = (h.d || 3) * k;
  if (h.kind === 'screw') {
    const hh = h.head === 'button' ? 0.55 * D : 0.95 * D, hw = 1.8 * D, w = Math.max(hw, 34), H = hh + L + 6, x0 = (w - D) / 2;
    const head = h.head === 'button'
      ? `<path d="M${(w - hw) / 2} ${hh + 2} Q${w / 2} ${-hh * 0.4} ${(w + hw) / 2} ${hh + 2} Z" fill="#9aa4b1" stroke="#39414c"/>`
      : `<rect x="${(w - hw) / 2}" y="2" width="${hw}" height="${hh}" rx="2" fill="#9aa4b1" stroke="#39414c"/>`;
    let th = '';
    for (let y = hh + 5; y < hh + L; y += 3.2) th += `<line x1="${x0}" y1="${y}" x2="${x0 + D}" y2="${y + 1.6}" stroke="#39414c" stroke-width=".8"/>`;
    return `<svg viewBox="0 0 ${w} ${H}" width="${w}" height="${H}"><rect x="${x0}" y="${hh + 2}" width="${D}" height="${L}" fill="#c3cad3" stroke="#39414c"/>${th}${head}</svg>`;
  }
  if (h.kind === 'insert') {
    const w = Math.max(D * 1.4, 26), H = L + 6, x0 = (w - D * 1.25) / 2;
    let kn = '';
    for (let y = 4; y < L + 2; y += 3) kn += `<line x1="${x0}" y1="${y}" x2="${x0 + D * 1.25}" y2="${y + 2.4}" stroke="#7a5a1c" stroke-width=".9"/>`;
    return `<svg viewBox="0 0 ${w} ${H}" width="${w}" height="${H}"><rect x="${x0}" y="3" width="${D * 1.25}" height="${L}" rx="1.5" fill="#d9b25a" stroke="#7a5a1c"/>${kn}<rect x="${w / 2 - D * 0.35}" y="3" width="${D * 0.7}" height="${L}" fill="#8a6a2a" opacity=".45"/></svg>`;
  }
  return '<svg viewBox="0 0 26 26" width="26" height="26"><rect x="3" y="5" width="20" height="16" rx="3" fill="#e6edf5" stroke="#6b7a8c"/><path d="M7 13h12" stroke="#6b7a8c"/></svg>';
}

// ---------------------------------------------------------------- one step
function framing(names, all, off, whole) {
  const b = new THREE.Box3();
  for (const n of names) if (items[n]) {
    b.union(items[n].box);
    if (off && off[n]) b.union(items[n].box.clone().translate(off[n]));    // keep where it comes from (the arrow) in view
  }
  const ctx = new THREE.Box3();
  for (const n of all) if (items[n]) ctx.union(items[n].box);
  if (b.isEmpty()) b.copy(ctx);
  const c = b.getCenter(new THREE.Vector3()), r = b.getSize(new THREE.Vector3()).length() / 2, rc = ctx.getSize(new THREE.Vector3()).length() / 2;
  return { c, r: whole ? r * 1.12 : Math.max(r * 1.55, rc * 0.42, 55) };
}
function aim(st, names, all, instant, off) {
  const { c, r } = framing(names, all, off, st.cover || st.finale);
  const dirCad = new THREE.Vector3(...(st.view || [-0.55, -0.9, 0.62])).normalize();
  const tgt = toWorld(c);
  const dirW = toWorld(c.clone().add(dirCad)).sub(tgt).normalize();
  const dist = r * 0.001 / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * (view.clientWidth < view.clientHeight ? 1.35 : 1.0);
  const pos = tgt.clone().addScaledVector(dirW, dist);
  if (instant) { camera.position.copy(pos); controls.target.copy(tgt); controls.update(); return; }
  tween = { t0: performance.now(), p0: camera.position.clone(), q0: controls.target.clone(), p1: pos, q1: tgt };
}
function clearArrows() { for (const a of arrows) cad.remove(a); arrows = []; }
function offsets(st) {
  const names = st.add.filter(n => items[n]);
  const ctr = new THREE.Vector3(); let k = 0;
  for (const n of names) { ctr.add(items[n].box.getCenter(new THREE.Vector3())); k++; }
  if (k) ctr.multiplyScalar(1 / k);
  const out = {};
  for (const n of names) {
    const d = st.radial && st.radial[n];
    if (d) {                                             // straight out sideways from the step's centre
      const c = items[n].box.getCenter(new THREE.Vector3()).sub(ctr); c.z = 0; c.y = 0;
      out[n] = c.lengthSq() > 1e-6 ? c.normalize().multiplyScalar(d) : new THREE.Vector3(...st.from);
    } else out[n] = new THREE.Vector3(...st.from);
  }
  return out;
}
function drawArrows(off) {
  clearArrows();
  const groups = new Map();
  for (const [n, o] of Object.entries(off)) {
    const key = o.toArray().map(v => v.toFixed(0)).join(',');
    if (!groups.has(key)) groups.set(key, { o, box: new THREE.Box3() });
    groups.get(key).box.union(items[n].box);
  }
  for (const { o, box } of groups.values()) {
    const end = box.getCenter(new THREE.Vector3()), len = o.length();
    if (len < 1) continue;
    const dir = o.clone().negate().normalize(), start = end.clone().add(o).addScaledVector(dir, -len * 0.05);
    const a = new THREE.ArrowHelper(dir, start, len * 0.82, 0xff7a00, Math.min(9, len * 0.3), Math.min(6, len * 0.2));
    a.line.material.linewidth = 2; cad.add(a); arrows.push(a);
  }
}
function setVisible(k) {
  for (const [n, it] of Object.entries(items)) {
    const s = stepOf[n] ?? 999, on = STEPS[k].cover || STEPS[k].finale ? true : s <= k;
    it.objs.forEach((o, i) => { o.visible = on; o.matrix.copy(it.base[i]); if (o.isMesh && o.userData.mat0) o.material = o.userData.mat0; });
  }
}
function show(k, replay = false) {
  k = Math.max(0, Math.min(STEPS.length - 1, k));
  if (k === cur && !replay) return;
  cur = k;
  const st = STEPS[k], all = Object.keys(items).filter(n => (stepOf[n] ?? 999) <= k);
  setVisible(k); clearArrows();
  controls.autoRotate = !!(st.cover || st.finale); controls.autoRotateSpeed = 1.2;
  if (fe) fe.set(st.finale ? 'happy' : null);
  if (!st.cover && !st.finale) {
    const off = offsets(st);
    drawArrows(off);
    for (const n of Object.keys(off)) for (const o of items[n].objs) if (o.isMesh) {
      o.userData.mat0 ||= o.material;
      const m = o.userData.mat0.clone(); if (m.emissive) { m.emissive.setHex(0xff8a1c); m.emissiveIntensity = 0.0; }
      o.material = m;
    }
    anim = { t0: performance.now(), off };
    aim(st, st.add, all, false, off);
  } else { anim = null; aim(st, Object.keys(items), Object.keys(items), false); }
  renderSide(st, k);
  document.querySelectorAll('#strip button').forEach(b => b.classList.toggle('on', +b.dataset.k === k));
  const on = document.querySelector('#strip button.on'); if (on) on.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  $('#pos').textContent = st.cover ? '표지' : `${k} / ${STEPS.length - 1}`;
  $('#bignum').textContent = st.cover ? '' : k;
  $('#prev').disabled = k === 0; $('#next').disabled = k === STEPS.length - 1;
  try { history.replaceState(null, '', `#step-${k}`); } catch (e) {}
}
function totals() {                                     // every screw / insert of the whole build, for the cover
  const t = new Map();
  for (const s of STEPS) for (const h of s.hw) if (h.kind !== 'misc') {
    const key = h.label.replace(/\s*\(.*\)$/, '');
    const e = t.get(key) || { ...h, label: key, qty: 0 }; e.qty += h.qty; t.set(key, e);
  }
  return [...t.values()].sort((a, b) => (a.kind === b.kind ? (b.d || 0) - (a.d || 0) : a.kind === 'insert' ? -1 : 1));
}
function renderSide(st, k) {
  $('#snum').textContent = st.cover ? '★' : k;
  $('#skick').textContent = st.cover ? 'Notifyi M13 · 조립 설명서' : `${st.kicker} · ${k} / ${STEPS.length - 1}단계`;
  $('#stitle').textContent = st.title;
  $('#stext').textContent = st.text;
  const parts = st.cover ? [] : st.parts;
  $('#cparts').hidden = !parts.length;
  $('#sparts').innerHTML = parts.map(p => `<figure class="pc"><img alt="" src="${thumb(p.items)}"><figcaption><b>× ${p.qty}</b><span>${p.label}</span></figcaption></figure>`).join('');
  const hw = st.cover ? totals() : st.hw;
  $('#chw').hidden = !hw.length;
  $('#chw .cap').textContent = st.cover ? '전체 나사 · 인서트 (단계별 합계)' : '나사 · 인서트 · 소모품';
  $('#shw').innerHTML = hw.map(h => `<figure class="hw ${h.kind}">${hwIcon(h)}<figcaption><b>× ${h.qty}</b><span>${h.label}</span></figcaption></figure>`).join('');
  $('#snotes').innerHTML = st.notes.map(n => `<li>${n}</li>`).join('');
}

// ---------------------------------------------------------------- loop
function resize() {
  const w = view.clientWidth, h = view.clientHeight;
  renderer.setSize(w, h, false); renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px';
  camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(view); resize();
const ease = t => 1 - Math.pow(1 - t, 3);
const tmp = new THREE.Matrix4();
(function tick(now) {
  if (anim) {
    const t = Math.min(1, (now - anim.t0) / DUR), e = ease(t);
    for (const [n, o] of Object.entries(anim.off)) {
      const it = items[n];
      tmp.makeTranslation(o.x * (1 - e), o.y * (1 - e), o.z * (1 - e));
      it.objs.forEach((ob, i) => {
        ob.matrix.multiplyMatrices(tmp, it.base[i]);
        if (ob.isMesh && ob.material.emissive && ob.material !== ob.userData.mat0) ob.material.emissiveIntensity = 0.45 * Math.sin(Math.PI * Math.min(1, t * 1.25));
      });
    }
    if (t >= 1) {
      for (const n of Object.keys(anim.off)) for (const ob of items[n].objs) if (ob.isMesh && ob.userData.mat0) ob.material = ob.userData.mat0;
      anim = null;
    }
  }
  if (tween) {
    const t = Math.min(1, (now - tween.t0) / 700), e = ease(t);
    camera.position.lerpVectors(tween.p0, tween.p1, e); controls.target.lerpVectors(tween.q0, tween.q1, e);
    if (t >= 1) tween = null;
  }
  if (fe && faceTex && faceMesh && faceMesh.visible && fe.update(now)) faceTex.needsUpdate = true;
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
})(performance.now());

// ---------------------------------------------------------------- boot
(async () => {
  const data = await (await fetch('assets/assembly/assembly_steps.json', { cache: 'no-cache' })).json();
  const rev = data.revision, skip = new Set(data.skip);
  STEPS = data.steps;
  STEPS.forEach((s, k) => s.add.forEach(n => { stepOf[n] = k; }));
  status.textContent = 'CAD 조립체 불러오는 중…';
  const cfg = await (await fetch(`assets/${rev}/joint_config.json`)).json();
  const gltf = await loadParts(rev);
  const lib = {};
  gltf.scene.traverse(o => { if (o.isMesh) lib[o.name || o.parent.name] = o; });
  const T = fk(cfg, {});
  for (const v of cfg.visuals) {
    if ((cfg.cable_defs && v.kind === 'cable') || skip.has(v.name)) continue;
    const src = lib[v.mesh.replace('/', '__')];
    if (!src) continue;
    const M = T[v.link].clone().multiply(matFromRows(v.T));
    const m = new THREE.Mesh(src.geometry, src.material);
    if (cfg.face_display && v.mesh === cfg.face_display.mesh) {
      const fd = cfg.face_display;
      fe = new FaceEngine(fd.pixels, fd.picture_mm, fd.eye_style || 'sparkle', fd.palette || 'mint');
      faceTex = new THREE.CanvasTexture(fe.canvas); faceTex.flipY = false; faceTex.colorSpace = THREE.SRGBColorSpace;
      m.material = new THREE.MeshBasicMaterial({ map: faceTex, color: 0xffffff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false });
      m.renderOrder = 5; faceMesh = m;
    }
    cad.add(m); register(v.name, m, M);
    if (v.kind !== 'cable' && !src.material.transparent && m !== faceMesh) addEdges(v.name, m, M);
  }
  if (cfg.cable_defs) {
    const links = {};
    for (const l of cfg.links) { const g = new THREE.Group(); g.matrixAutoUpdate = false; g.matrix.copy(T[l.name]); links[l.name] = g; }
    const cab = new Cables(cfg.cable_defs, cad, links); cab.update();
    for (const it of cab.items) { it.mesh.geometry.computeBoundingBox(); register('cable:' + it.c.name, it.mesh, new THREE.Matrix4()); }
  }
  scene.updateMatrixWorld(true);
  const strip = $('#strip');
  strip.innerHTML = STEPS.map((s, k) => `<button type="button" data-k="${k}" title="${s.title}"><b>${s.cover ? '★' : k}</b><span>${s.title}</span></button>`).join('');
  strip.querySelectorAll('button').forEach(b => b.onclick = () => show(+b.dataset.k));
  $('#prev').onclick = () => show(cur - 1);
  $('#next').onclick = () => show(cur + 1);
  $('#replay').onclick = () => show(cur, true);
  addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input, select, textarea')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); show(cur + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); show(cur - 1); }
  });
  status.hidden = true;
  const m = /#step-(\d+)/.exec(location.hash);
  const k0 = m ? +m[1] : 0;
  const st = STEPS[Math.min(k0, STEPS.length - 1)];
  aim(st, st.cover || st.finale ? Object.keys(items) : st.add, Object.keys(items), true);
  show(k0);
})().catch(e => { status.hidden = false; status.textContent = '불러오기 실패: ' + e.message; console.error(e); });
