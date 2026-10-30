// Print tab, mech_M11_face since 2026-10-30 (owner: "m12 m13 다 지우고 출력도면도 m11로"; built 2026-10-29 for M13 after "출력도면은
// hfb 기준으로 보여주도록"): the page is built round the nine Cubicon
// Single Plus plates whose .hfb files Cubicreator4 saved (the only files the printer prints). Each plate: its .hfb to download, the
// settings read back from inside that file (hfb_check.json), Cubicreator's own time / weight, the pieces laid out on the 240 x 190
// bed exactly as in the file (one STL per piece, in its paint colour), and per piece how it is oriented, what to take off and what
// changed. The per-part STLs stay available below. Data: assets/mech_M11_face/print/{cubicon_plates/plates.json,
// hfb/hfb_check.json, print_table.json, print_physics.json} (old part-by-part page: print_m12_20261029.js).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

const REV = 'mech_M11_face', ROOT = `assets/${REV}/print`;
const BED = [240, 190];
// every part is printed in white PLA and painted afterwards in RC3's colours (owner, 2026-10-27); 'unpainted' parts stay white
const HEX = { cream: 0xdcd2b4, dark: 0x4a5050, olive: 0x6f8452, black: 0x161616, unpainted: 0xf4f4f0 };
const KO_COL = { cream: '크림', dark: '다크 그레이', olive: '올리브', black: '검정', unpainted: '칠하지 않음 (흰 PLA)' };
const KO_PLATE = { P1_base_shell: '베이스 외피', P2_base_floor: '바닥 트레이', P3_servo_deck: '서보 데크', P4_head_face: '얼굴 상자',
  P5_camera_cradle: '카메라 · 디스플레이 받침', P6_yokes: '요크 3개', P7_sled_strap: '배터리 슬레드 + 머리 윗판',
  P8_flat_parts: '얼굴 테 · 앞 패널 · 턴테이블 링 · 어깨판 · 귀 · 라이트 띠', P9_small_parts: '디스플레이 프레임 · 피벗 캡 6 · 안테나 · 작은 부품' };
const swatch = c => `<i class="sw" style="background:#${(HEX[c] ?? 0xcccccc).toString(16).padStart(6, '0')}"></i>`;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

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
const plateMesh = new THREE.Mesh(new THREE.BoxGeometry(BED[0], 2, BED[1]), new THREE.MeshStandardMaterial({ color: 0x23272e, roughness: 0.9 }));
plateMesh.position.set(BED[0] / 2, -1.05, -BED[1] / 2); bed.add(plateMesh);
const g = new THREE.GridHelper(240, 24, 0x4b5562, 0x2f353d); g.scale.set(1, 1, BED[1] / BED[0]); g.position.set(BED[0] / 2, 0.02, -BED[1] / 2); bed.add(g);
const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(BED[0], 0.01, BED[1])), new THREE.LineBasicMaterial({ color: 0xe8e8e8 }));
edge.position.set(BED[0] / 2, 0.05, -BED[1] / 2); bed.add(edge);

let group = null, ticket = 0, centre = new THREE.Vector3(120, 20, -95), span = 200, current = null;
const DIRS = { three_quarter: [0.55, 0.75, 0.9], top: [0, 1, 0.001], side: [1, 0.25, 0] };
function view(name) {
  camera.position.copy(centre).addScaledVector(new THREE.Vector3(...DIRS[name]).normalize(), Math.max(span, 90) * 1.9);
  controls.target.copy(centre); controls.update();
}
const loader = new STLLoader();
const hm = t => { const [h, m] = String(t).split(':').map(Number); return `${h}시간 ${m}분`; };

let PLATES = null, CHECK = {}, ROWS = {}, NOTES = {};
function pieceRow(pc) { return ROWS[pc.part] || ROWS[pc.part.replace(/_[LR]$/, '')] || {}; }

async function showPlate(p) {
  current = p; const my = ++ticket;
  document.querySelectorAll('#plates button').forEach(b => b.classList.toggle('on', b.dataset.p === p.plate));
  const ck = CHECK[p.plate] || {}, ce = p.cubicreator_estimate || {}, e = (p.cubicreator_basic || {}).expert_ko || {};
  $('#pname').textContent = `${p.plate} · ${KO_PLATE[p.plate] || ''}`;
  const facts = [
    ['Cubicreator 예상', ce.time_hm ? `${hm(ce.time_hm)} · ${ce.filament_g} g PLA` : '–'],
    ['조각', `${p.pieces.length}개`],
    ['레이어 · 벽 · 채움', `${e['레이어 높이']} mm · ${e['벽 라인 갯수']}줄 · ${e['내부 채우기 밀도 (0~100)']} %`],
    ['지지대 · 바닥 보조물', `${e['지지대 생성'] === '켬' ? '<em class="need">켬</em>' : '끔'} · ${e['바닥보조물'] || ''}`],
    ['장비 · 재료', 'Cubicon Single Plus (3DP-310F) · PLA 210 / 65 °C'],
    ['파일 확인', ck.result === 'PASS' ? '<b class="ok">PASS</b> — 파일 안의 설정 = 위 값, 끝까지 저장됨, 이 판만 들어 있음' : (ck.result || '–')],
    ['칠할 색', p.colours.map(c => swatch(c) + KO_COL[c]).join(' · ')]];
  $('#facts').innerHTML = facts.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
  $('#hfb').href = `${ROOT}/${p.hfb}`; $('#hfb').download = p.hfb.split('/').pop();
  $('#hfb').textContent = `${p.hfb.split('/').pop()} 받기${ck.bytes ? ` (${(ck.bytes / 1e6).toFixed(1)} MB)` : ''}`;
  $('#platestl').href = `${ROOT}/${p.stl}`; $('#platestl').download = p.stl.split('/').pop();
  const seen = new Set(), rows = [];
  for (const pc of (p.piece_files || [])) {
    const r = pieceRow(pc), key = r.cad_part || pc.part;
    const n = p.pieces.filter(x => (x === pc.part) || x.startsWith(pc.part + '_')).length;
    if (seen.has(key + r.part)) continue; seen.add(key + r.part);
    rows.push(`<li><b>${swatch(r.colour)}${esc(r.nameKo || pc.part)}${n > 1 ? ` × ${n}` : ''}</b>`
      + (r.orientKo ? `<br><small>출력 방향: ${esc(r.orientKo)}</small>` : '')
      + (r.supportKo && r.supports ? `<br><small class="need">지지대: ${esc(r.supportKo)}</small>` : '')
      + (r.aidKo ? `<br><small>보조물: ${esc(r.aidKo)}</small>` : '')
      + (r.removeKo ? `<br><small>떼기 · 마무리: ${esc(r.removeKo)}</small>` : '') + '</li>');
  }
  $('#pieces').innerHTML = rows.join('');
  status.hidden = false; status.textContent = `${p.plate} 불러오는 중…`;
  const meshes = await Promise.all((p.piece_files || []).map(async pc => {
    const geo = await loader.loadAsync(`${ROOT}/${pc.file}`);
    geo.rotateX(-Math.PI / 2); geo.computeVertexNormals();
    const r = pieceRow(pc), col = HEX[r.colour] ?? 0xcccccc, nat = r.colour === 'unpainted';
    return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, roughness: 0.6, transparent: nat, opacity: nat ? 0.8 : 1 }));
  }));
  if (my !== ticket) return;
  if (group) { scene.remove(group); group.traverse(o => o.geometry && o.geometry.dispose()); }
  group = new THREE.Group(); meshes.forEach(m => group.add(m)); scene.add(group);
  const bb = new THREE.Box3().setFromObject(group);
  centre = bb.getCenter(new THREE.Vector3()); centre.y = Math.max(centre.y, 10);
  span = Math.max(bb.getSize(new THREE.Vector3()).length(), 120);
  view('three_quarter'); status.hidden = true;
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
  const [P, C, T] = await Promise.all([
    fetch(`${ROOT}/cubicon_plates/plates.json`, { cache: 'no-cache' }).then(r => r.json()),
    fetch(`${ROOT}/hfb/hfb_check.json`, { cache: 'no-cache' }).then(r => r.ok ? r.json() : { plates: [] }),
    fetch(`${ROOT}/print_table.json`, { cache: 'no-cache' }).then(r => r.json())]);
  PLATES = P.plates; (C.plates || []).forEach(x => { CHECK[x.plate] = x; });
  T.parts.forEach(r => { ROWS[r.part] = r; if (!ROWS[r.cad_part]) ROWS[r.cad_part] = r; });
  const tot = P.cubicreator_total || {}, npass = (C.plates || []).filter(x => x.result === 'PASS').length;
  $('#summary').innerHTML = `<b>${PLATES.length}판</b> · 조각 <b>${PLATES.reduce((n, p) => n + p.pieces.length, 0)}개</b> · `
    + `Cubicreator 예상 합계 <b>${tot.time_h ?? '–'}시간 · ${tot.filament_g ?? '–'} g</b> PLA<br>`
    + `.hfb 파일 확인 <b>${npass} / ${PLATES.length} PASS</b> (설정값 · 저장 완결 · 판 하나만)`;
  const ul = $('#plates');
  for (const p of PLATES) {
    const ce = p.cubicreator_estimate || {}, e = (p.cubicreator_basic || {}).expert_ko || {}, ck = CHECK[p.plate] || {};
    const li = document.createElement('li'), b = document.createElement('button');
    b.type = 'button'; b.dataset.p = p.plate;
    b.innerHTML = `<span class="nm">${p.colours.map(c => swatch(c)).join('')}<b>${p.plate.split('_')[0]}</b> ${KO_PLATE[p.plate] || p.plate}`
      + `${e['지지대 생성'] === '켬' ? ' <u class="tg sup">지지대</u>' : ''}</span>`
      + `<span class="mt">${ce.time_hm ? hm(ce.time_hm) + ' · ' + Math.round(ce.filament_g) + ' g' : ''}${ck.result === 'PASS' ? ' ✓' : ''}</span>`;
    b.onclick = () => showPlate(p);
    const a = document.createElement('a'); a.className = 'btn dl'; a.href = `${ROOT}/${p.hfb}`; a.download = p.hfb.split('/').pop();
    a.textContent = '.hfb'; a.title = `${p.hfb.split('/').pop()} 받기`;
    li.append(b, a); ul.append(li);
  }
  $('#zip').href = `${ROOT}/${REV}_stl_all.zip`; $('#zip').download = `${REV}_stl_all.zip`;
  $('#tablejson').href = `${ROOT}/cubicon_plates/plates.json`;
  // the old part-by-part list, folded
  const pl = $('#plist');
  if (pl) for (const r of T.parts) {
    const li = document.createElement('li');
    li.innerHTML = `${swatch(r.colour)}<a href="${ROOT}/${r.file}" download>${esc(r.nameKo || r.part)}${r.qty > 1 ? ` × ${r.qty}` : ''}</a> <small>${r.on_bed_mm.join(' × ')} mm</small>`;
    pl.append(li);
  }
  fetch(`${ROOT}/print_physics.json`, { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(Ph => {
    if (!Ph || !$('#physics')) return;
    const rowsP = Ph.checks.map(c => `<tr><td>${c.item}</td><td>${c.check}</td><td class="${c.result === 'PASS' ? 'ok' : 'bad'}">${c.safety_factor}</td></tr>`).join('');
    const rowsS = Ph.screws.map(c => `<tr><td>${c.joint}</td><td>${c.screw}</td><td class="${c.result === 'PASS' ? 'ok' : 'bad'}">${c.engaged_mm} mm</td></tr>`).join('');
    $('#physics').innerHTML = `<table><tr><th>부품</th><th>검토 (영문 원문)</th><th>안전율</th></tr>${rowsP}</table>`
      + `<table><tr><th>체결</th><th>나사</th><th>물림</th></tr>${rowsS}</table>`;
  }).catch(() => {});
  const want = (location.hash || '').slice(1);
  showPlate(PLATES.find(p => p.plate === want) || PLATES[0]);
})().catch(e => { status.hidden = false; status.textContent = '불러오기 실패: ' + e.message; console.error(e); });
