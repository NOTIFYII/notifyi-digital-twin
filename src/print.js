// Print tab, mech_M11_wiring (round 27; was mech_M10_PLA in round 26): every printed part as its own PLA print for the Cubicon Single Plus (bed 240 x 190 mm).
// Each STL is already turned to its print orientation and centred on the bed (scripts/make_m9_print_pack.py), print aids included;
// this page shows it on the bed outline with its settings, slicer estimate, what changed for PLA, whether it needs support, its print
// aids and how to take them off. Data: assets/mech_M11_wiring/print/print_table.json (+ print_physics.json).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

const REV = 'mech_M11_wiring', ROOT = `assets/${REV}/print`;
const BED = [240, 190];
const GROUPS = { all: '전체', base: '베이스', body: '몸통', head: '머리' };
// every part is printed in white PLA and painted afterwards in RC3's colours (owner, 2026-10-27); 'unpainted' parts stay white
const HEX = { cream: 0xdcd2b4, dark: 0x4a5050, olive: 0x6f8452, black: 0x161616, unpainted: 0xf4f4f0 };
const KO_COL = { cream: '크림 (RC3 외피 · 머리 · 요크)', dark: '다크 그레이 (RC3 프레임)', olive: '올리브 (RC3 잎 · 귀)', black: '검정 (RC3 앞 패널)',
                 unpainted: '칠하지 않음 — 흰 PLA 그대로 (빛이 퍼짐)' };
const swatch = c => `<i class="sw" style="background:#${(HEX[c] ?? 0xcccccc).toString(16).padStart(6, '0')}"></i>`;
const $ = s => document.querySelector(s);

const el = $('#view'), status = $('#status');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x16181c);
el.prepend(renderer.domElement);
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, 1, 1, 5000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
scene.add(new THREE.HemisphereLight(0xffffff, 0x404650, 2.1));
const sun = new THREE.DirectionalLight(0xffffff, 3.0); sun.position.set(-120, 260, 160); scene.add(sun);
// the Cubicon bed: 240 x 190 mm plate with a 10 mm grid (three.js Y up; STL Z up -> Y)
const bed = new THREE.Group(); scene.add(bed);
const plate = new THREE.Mesh(new THREE.BoxGeometry(BED[0], 2, BED[1]), new THREE.MeshStandardMaterial({ color: 0x23272e, roughness: 0.9 }));
plate.position.set(BED[0] / 2, -1.05, -BED[1] / 2); bed.add(plate);
const g = new THREE.GridHelper(240, 24, 0x4b5562, 0x2f353d); g.scale.set(1, 1, BED[1] / BED[0]); g.position.set(BED[0] / 2, 0.02, -BED[1] / 2); bed.add(g);
const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(BED[0], 0.01, BED[1])), new THREE.LineBasicMaterial({ color: 0xe8e8e8 }));
edge.position.set(BED[0] / 2, 0.05, -BED[1] / 2); bed.add(edge);

let mesh = null, row = null, ticket = 0, centre = new THREE.Vector3(120, 20, -95), span = 120;
const DIRS = { three_quarter: [0.55, 0.75, 0.9], top: [0, 1, 0.001], side: [1, 0.25, 0] };
function view(name) {
  camera.position.copy(centre).addScaledVector(new THREE.Vector3(...DIRS[name]).normalize(), Math.max(span, 70) * 2.6);
  controls.target.copy(centre); controls.update();
}
const hms = s => !s ? "–" : s < 3600 ? `${Math.max(1, Math.round(s / 60))}분` : `${Math.floor(s / 3600)}시간 ${Math.round((s % 3600) / 60)}분`;
const loader = new STLLoader();

async function show(r) {
  row = r; const my = ++ticket;
  document.querySelectorAll('#plist button').forEach(b => b.classList.toggle('on', b.dataset.file === r.file));
  $('#pname').textContent = `${r.nameKo}${r.qty > 1 ? ` × ${r.qty}` : ''}`;
  const sl = r.slicer || {};
  const facts = [
    ['필라멘트', 'PLA 흰색'], ['칠할 색', swatch(r.colour) + (KO_COL[r.colour] || r.colour)],
    ['벽 · 채움 · 레이어', `${r.perimeters}겹 · ${r.infill_pct}% · ${r.layer_mm} mm`],
    ['지지대', r.supports ? `<em class="need">${r.supportKo || '필요'}</em>` : (r.supportKo || '필요 없음')],
    ['출력 보조물', r.aidKo || '없음'], ['브림', r.brim_mm ? r.brim_mm + ' mm' : '없음'],
    ['베드 위 크기', `${r.on_bed_mm.join(' × ')} mm ${r.fits_bed ? '✓ 들어감' : '✗ 안 들어감'}`],
    ['예상 (1개)', sl.seconds ? `${hms(sl.seconds)} · ${sl.filament_g} g` : '–'], ['출력 방향', r.orientKo || r.orientation]];
  $('#facts').innerHTML = facts.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
  $('#change').innerHTML = (r.changeKo ? `<b>PLA로 바꾼 점</b> ${r.changeKo}` : '')
    + (r.removeKo ? `<br><b>떼는 법</b> ${r.removeKo}` : '');
  $('#stl').href = `${ROOT}/${r.file}`; $('#stl').download = r.file.split('/').pop();
  status.hidden = false; status.textContent = `${r.file.split('/').pop()} 불러오는 중…`;
  const geo = await loader.loadAsync(`${ROOT}/${r.file}`);
  if (my !== ticket) return;
  geo.rotateX(-Math.PI / 2); geo.computeVertexNormals();
  if (mesh) { scene.remove(mesh); mesh.geometry.dispose(); }
  const col = HEX[r.colour] ?? 0xcccccc, nat = r.colour === 'unpainted';
  mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, roughness: 0.6, metalness: 0.0, transparent: nat, opacity: nat ? 0.78 : 1 }));
  scene.add(mesh);
  geo.computeBoundingBox(); const bb = geo.boundingBox;
  centre = bb.getCenter(new THREE.Vector3()); span = bb.getSize(new THREE.Vector3()).length();
  view('three_quarter'); status.hidden = true;
}

function list(rows, grp) {
  const ul = $('#plist'); ul.innerHTML = '';
  for (const r of rows.filter(q => grp === 'all' || q.group === grp)) {
    const li = document.createElement('li'), b = document.createElement('button');
    b.type = 'button'; b.dataset.file = r.file;
    const sl = r.slicer || {};
    const tag = r.supports ? ' <u class="tg sup">지지대</u>' : r.aidKo ? ' <u class="tg aid">보조물</u>' : '';
    b.innerHTML = `<i style="background:#${(HEX[r.colour] ?? 0xcccccc).toString(16).padStart(6, '0')}"></i><span class="nm">${r.nameKo}${r.qty > 1 ? ` <em>× ${r.qty}</em>` : ''}${tag}</span>`
      + `<span class="mt">${sl.seconds ? hms(sl.seconds * r.qty) + ' · ' + Math.round(sl.filament_g * r.qty) + ' g' : ''}${r.fits_bed ? '' : ' ✗'}</span>`;
    b.onclick = () => show(r);
    li.append(b); ul.append(li);
  }
  if (row) document.querySelectorAll('#plist button').forEach(b => b.classList.toggle('on', b.dataset.file === row.file));
}

function resize() {
  const w = el.clientWidth, h = el.clientHeight;
  renderer.setSize(w, h, false); renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px';
  camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(el); resize();
(function tick() { controls.update(); renderer.render(scene, camera); requestAnimationFrame(tick); })();
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => view(b.dataset.view)));

(async () => {
  const T = await (await fetch(`${ROOT}/print_table.json`, { cache: 'no-cache' })).json();
  const rows = T.parts;
  const tot = T.slicer || {};
  const nSup = rows.filter(q => q.supports).reduce((n, q) => n + q.qty, 0), nAid = rows.filter(q => q.aidKo).length;
  $('#summary').innerHTML = `파일 <b>${rows.length}개</b> · 조각 <b>${T.pieces_to_print}개</b> · 모두 베드에 ${T.all_fit_bed ? '<b>들어감 ✓</b>' : '<b>안 들어가는 부품 있음</b>'}`
    + `<br>지지대가 필요한 조각 <b>${nSup}개</b> (나머지는 지지대 없이) · 떼어 낼 출력 보조물이 있는 부품 <b>${nAid}개</b>`
    + (tot.total_time_h ? `<br>합계 약 <b>${tot.total_time_h}시간 · ${tot.total_filament_g} g</b> PLA (슬라이서 해석값)` : '');
  $('#zip').href = `${ROOT}/${REV}_stl_all.zip`; $('#zip').download = `${REV}_stl_all.zip`;
  fetch(`${ROOT}/print_physics.json`, { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(P => {
    if (!P || !$('#physics')) return;
    const rowsP = P.checks.map(c => `<tr><td>${c.item}</td><td>${c.check}</td><td class="${c.result === 'PASS' ? 'ok' : 'bad'}">${c.safety_factor}</td></tr>`).join('');
    const rowsS = P.screws.map(c => `<tr><td>${c.joint}</td><td>${c.screw}</td><td class="${c.result === 'PASS' ? 'ok' : 'bad'}">${c.engaged_mm} mm</td></tr>`).join('');
    $('#physics').innerHTML = `<table><tr><th>부품</th><th>검토 (영문 원문)</th><th>안전율</th></tr>${rowsP}</table>`
      + `<table><tr><th>체결</th><th>나사</th><th>물림</th></tr>${rowsS}</table>`;
  }).catch(() => {});
  $('#tablejson').href = `${ROOT}/print_table.json`;
  const gl = $('#groups'); let grp = 'all';
  for (const [k, v] of Object.entries(GROUPS)) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = v; b.dataset.g = k; b.classList.toggle('on', k === grp);
    b.onclick = () => { grp = k; gl.querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.g === k)); list(rows, grp); };
    gl.append(b);
  }
  list(rows, grp);
  show(rows[0]);
})().catch(e => { status.hidden = false; status.textContent = '불러오기 실패: ' + e.message; console.error(e); });
