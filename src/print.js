// Print-drawing tab: RC3's six connected print files (A-F), each shown as the real sprue mesh with its cut tabs, its part list,
// slicer estimate, cut map and STL. Data: assets/<RC3>/print/pack_manifest.json (written by the RC3 release) + print_info.json.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ROOT = 'assets/mech_M8_RC3_sprue_20261016';
const COL = { cream: 0xdcd8c4, dark: 0x4a5252, olive: 0x7e915b, clear: 0xa0ced2 };
const KO = { cream: '크림', dark: '다크', olive: '올리브', clear: '반투명' };
const STOCK = { cream: 'PETG White 또는 Matte White', dark: 'PETG Black', olive: 'PETG Olive Green', clear: 'PETG Transparent' };
// parts whose shape follows the power decision (battery size, adapter, charge jack)
const POWER = new Set(['base_cover', 'base_chassis', 'battery_tray', 'port_plate', 'base_front_panel', 'pi_bridge_front', 'pi_bridge_rear']);
const $ = s => document.querySelector(s);

const el = $('#view'), status = $('#status');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x16181c);
el.prepend(renderer.domElement);
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(34, 1, 0.001, 20);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
scene.add(new THREE.HemisphereLight(0xffffff, 0x404650, 2.0));
const sun = new THREE.DirectionalLight(0xffffff, 3.2); sun.position.set(-0.3, 0.5, 0.3); scene.add(sun);
const grid = new THREE.GridHelper(0.256, 16, 0x5b6470, 0x30363e); grid.position.set(0.128, -0.0002, -0.128); scene.add(grid);

let model = null, row = null, centre = new THREE.Vector3(), span = 0.3, ticket = 0;
const DIRS = { three_quarter: [0.65, 0.8, 0.8], top: [0, 1, 0.001], side: [1, 0.05, 0] };
function view(name) {
  camera.position.copy(centre).addScaledVector(new THREE.Vector3(...DIRS[name]).normalize(), span * 2.8);
  controls.target.copy(centre); controls.update();
}
function packColour(r) { return r.material === 'TPU' ? 0x3a3f46 : COL[r.color]; }
function paint() {
  if (!model) return;
  model.traverse(o => { if (o.isMesh) o.material.color.set(o.userData.isTab && $('#tabs').checked ? 0xf27e31 : packColour(row)); });
}
function stockName(r) { return r.material === 'TPU' ? 'TPU White (3DFARM 재고에 검정 TPU 없음)' : STOCK[r.color]; }

async function load(r, info) {
  const my = ++ticket;
  status.textContent = '불러오는 중…';
  const gltf = await new GLTFLoader().loadAsync(`${ROOT}/sprues/${r.file.replace('.stl', '.glb')}`);
  if (my !== ticket) return;
  if (model) { scene.remove(model); model.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } }); }
  model = gltf.scene; row = r;
  model.traverse(o => {
    if (!o.isMesh) return;
    o.userData.isTab = o.name.startsWith('TAB_') || (o.parent && o.parent.name.startsWith('TAB_'));
    o.material = new THREE.MeshStandardMaterial({ color: packColour(r), metalness: 0, roughness: 0.75 });
  });
  scene.add(model);
  const box = new THREE.Box3().setFromObject(model); box.getCenter(centre);
  const size = box.getSize(new THREE.Vector3()); span = Math.max(size.x, size.y, size.z, 0.04);
  view('three_quarter'); paint();
  const slice = info[r.file] || {};
  $('#packname').textContent = `${r.file[0]} 판 · ${r.material === 'TPU' ? 'TPU 95A' : r.material} ${r.material === 'TPU' ? '' : KO[r.color]}`;
  $('#facts').innerHTML = `
    <div><span>부품</span><b>${r.part_count}개, 연결형 1개 파일</b></div>
    <div><span>크기</span><b>${r.size_mm.map(v => v.toFixed(1)).join(' × ')} mm</b></div>
    <div><span>인필</span><b>${r.infill_percent}%</b></div>
    <div><span>예상 출력</span><b>${slice.estimated_time || '–'} · ${slice.filament_g ? slice.filament_g.toFixed(1) + ' g' : '–'}</b></div>
    <div><span>절단 탭</span><b>${r.tabs.length}개</b></div>
    <div><span>3DFARM 재고 색 제안</span><b>${stockName(r)}</b></div>`;
  $('#parts').replaceChildren(...r.items.map(i => {
    const li = document.createElement('li');
    li.innerHTML = `<code>${i.part_label}</code> ${i.name}` + (POWER.has(i.name) ? ' <span class="pw" title="배터리·전원 결정에 따라 형상이 바뀔 수 있음">전원 결정에 따라 변경</span>' : '');
    return li;
  }));
  $('#stl').href = `${ROOT}/print/${r.file}`;
  $('#stl').setAttribute('download', r.file);
  $('#cutmap').href = `${ROOT}/print/cutmaps/${r.file[0]}_cutmap.png`;
  document.querySelectorAll('#packs button').forEach(b => b.classList.toggle('on', b.dataset.file === r.file));
  status.textContent = `${r.file} · 탭 ${r.tabs.length}개 · 격자 256 × 256 mm(해석용 베드) · 실물 출력·절단 미검증`;
}

document.querySelectorAll('[data-view]').forEach(b => { b.onclick = () => view(b.dataset.view); });
$('#tabs').onchange = paint;
new ResizeObserver(() => {
  const w = el.clientWidth, h = el.clientHeight;
  renderer.setSize(w, h); camera.aspect = w / Math.max(h, 1); camera.updateProjectionMatrix();
}).observe(el);
renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });

try {
  const [m, info] = await Promise.all([
    fetch(`${ROOT}/print/pack_manifest.json`).then(r => r.json()),
    fetch(`${ROOT}/print/print_info.json`).then(r => r.json()),
  ]);
  const secs = m.plates.reduce((s, r) => s + ((info[r.file] || {}).seconds || 0), 0);
  const grams = m.plates.reduce((s, r) => s + ((info[r.file] || {}).filament_g || 0), 0);
  $('#summary').textContent = `기능 부품 ${m.plates.reduce((s, r) => s + r.part_count, 0)}개 · 연결형 STL ${m.plates.length}개 · 합계 약 ${Math.floor(secs / 3600)}시간 ${Math.round(secs % 3600 / 60)}분, ${grams.toFixed(0)} g (슬라이서 해석값, 견적 아님)`;
  for (const r of m.plates) {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.file = r.file;
    b.innerHTML = `<i style="background:#${packColour(r).toString(16).padStart(6, '0')}"></i>${r.file[0]} · ${r.part_count}개`;
    b.onclick = () => load(r, info).catch(e => { status.textContent = '로드 오류: ' + e.message; });
    $('#packs').append(b);
  }
  await load(m.plates[0], info);
} catch (e) {
  status.textContent = '로드 오류: ' + e.message;
  console.error(e);
}
