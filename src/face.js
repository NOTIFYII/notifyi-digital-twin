// Notifyi face engine (round 21): the display's picture, drawn live at the display's REAL pixel count.
//
// ONE source for the face: this file draws it in the viewer (on the robot's display quad), exports the still pictures the CAD build
// and the Blender renders use (06_Viewer/faces/<set>/*.png, via the viewer's "export faces"), and is written as a small parametric
// model (a dozen numbers per eye) so that the same model can be ported to the display's own firmware later. That firmware is NOT
// written; frame rate and timing on the real panel are NOT tested.
//
// Units: millimetres on the picture area, origin at its centre, x to the picture's right, z up. "L" is the eye on the picture's
// left (the robot's own right eye), "R" the one on the picture's right.

export const STYLES = ['sparkle', 'iris', 'pill'];

// eye body: position, size, corner radius; open / wide scale height / width; top = upper lid (0..1 of the height), tilt = how much
// lower the lid is at the OUTER corner (mm, worried when positive); bot = lower lid pushed up as an arch (0..1, a smile);
// gx, gz = gaze (-1..1). All numbers blend linearly between expressions.
const BASE = { x: 13.8, z: 0, w: 12.8, h: 17.0, r: 6.4, open: 1, wide: 1, top: 0, tilt: 0, bot: 0, gx: 0, gz: 0 };

export const EXPRESSIONS = {
  neutral: { info: 'awake, nothing to say' },
  blink: { open: 0.1, wide: 1.06, info: 'every few seconds, about 0.13 s' },
  wink: { bot: 0.22, blush: 0.7, R: { open: 0.1, wide: 1.06, bot: 0 }, info: 'greeting' },
  happy: { bot: 0.6, blush: 1, info: 'the person sat up; greeting; being patted' },
  sleepy: { top: 0.56, z: -1.2, info: 'idle for a long time; going to rest' },
  surprised: { open: 1.1, wide: 1.06, info: 'someone appears; perk-up; being poked' },
  curious: { L: { open: 0.8, wide: 0.92 }, R: { open: 1.1, wide: 1.05 }, info: 'peeking, looking at something new' },
  concerned: { top: 0.2, tilt: 4.6, z: -0.6, info: 'the posture cue: the robot sags with the person' },
  look_left: { gx: -1, info: "glance toward the picture's left (the robot's own right)" },
  look_right: { gx: 1, info: "glance toward the picture's right (the robot's own left)" },
  off: { off: 1, info: 'display dark: the face plate is one black sheet' },
};

// eye colours: deeper at the top (under the lid), pale at the bottom. mint = RC3; the others belong to the character studies (round 24)
export const PALETTES = {
  mint: { top: '#58c9ac', bottom: '#dbfff1', glint: '#ffffff', pupil: '#134a44', pill: '#d6f0ff', blush: '#ff6880' },
  leaf: { top: '#6fbf5a', bottom: '#eaffd8', glint: '#ffffff', pupil: '#1f4a1c', pill: '#e3ffd0', blush: '#ff8c7a' },
  amber: { top: '#f08a1c', bottom: '#ffe9b8', glint: '#ffffff', pupil: '#5a3208', pill: '#ffaa33', blush: '#ff6a4d' },
  peach: { top: '#f07e98', bottom: '#ffe6ee', glint: '#ffffff', pupil: '#5c1d31', pill: '#ffd6e2', blush: '#ff5f86' },
  ice: { top: '#7aa8f0', bottom: '#eef5ff', glint: '#ffffff', pupil: '#16305c', pill: '#dfeaff', blush: '#ff7a90' },    // P1 technical skin
};
let PALETTE = PALETTES.mint;

export function resolve(name) {
  const e = EXPRESSIONS[name] || EXPRESSIONS.neutral;
  const common = {};
  for (const k of Object.keys(BASE)) if (k in e) common[k] = e[k];
  const L = { ...BASE, ...common, ...(e.L || {}) }, R = { ...BASE, ...common, ...(e.R || {}) };
  L.x = -Math.abs(L.x); R.x = Math.abs(R.x);
  return { L, R, blush: e.blush || 0, off: e.off || 0 };
}

function lerp(a, b, t) { return a + (b - a) * t; }
function mixEye(a, b, t) { const o = {}; for (const k of Object.keys(BASE)) o[k] = lerp(a[k], b[k], t); return o; }
export function mix(a, b, t) { return { L: mixEye(a.L, b.L, t), R: mixEye(a.R, b.R, t), blush: lerp(a.blush, b.blush, t), off: lerp(a.off, b.off, t) }; }
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function drawEye(ctx, e, W, H, ppm, style) {
  const lead = Math.sign(e.gx) === Math.sign(e.x) ? 1 : 0;                 // the eye on the side being looked toward narrows a little
  const w = e.w * e.wide * (1 - 0.14 * Math.abs(e.gx) * lead), h = Math.max(e.h * e.open, 1.5);
  const r = Math.min(e.r, w / 2, h / 2);
  const cx = W / 2 + (e.x + e.gx * 2.4) * ppm, cy = H / 2 - (e.z + e.gz * 1.2) * ppm;     // 2.4 mm keeps the leading eye inside the picture
  const pw = w * ppm, ph = h * ppm, x0 = cx - pw / 2, y0 = cy - ph / 2;
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x0, y0, pw, ph, r * ppm); ctx.clip();
  if (style === 'pill') { ctx.fillStyle = PALETTE.pill; } else {
    const g = ctx.createLinearGradient(0, y0, 0, y0 + ph);
    g.addColorStop(0, PALETTE.top); g.addColorStop(1, PALETTE.bottom); ctx.fillStyle = g;
  }
  ctx.fillRect(x0 - 2, y0 - 2, pw + 4, ph + 4);
  const lively = clamp((e.open - 0.35) / 0.4, 0, 1);                           // details fade as the eye closes; a lid simply covers them
  if (style === 'iris' && lively > 0) {
    ctx.globalAlpha *= lively; ctx.fillStyle = PALETTE.pupil;
    ctx.beginPath(); ctx.ellipse(cx + e.gx * 1.5 * ppm, cy - e.gz * 1.0 * ppm, 0.30 * pw, 0.30 * ph, 0, 0, 7); ctx.fill();
    ctx.globalAlpha /= lively;
  }
  if (style !== 'pill' && lively > 0) {                                        // two catchlights, light from the upper left
    ctx.globalAlpha *= lively; ctx.fillStyle = PALETTE.glint;
    ctx.beginPath(); ctx.arc(cx - 0.20 * pw - e.gx * 0.5 * ppm, cy - 0.22 * ph, 0.17 * pw, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 0.21 * pw - e.gx * 0.3 * ppm, cy + 0.25 * ph, 0.075 * pw, 0, 7); ctx.fill();
    ctx.globalAlpha /= lively;
  }
  ctx.fillStyle = '#000';
  if (e.top > 0.001 || Math.abs(e.tilt) > 0.001) {                             // upper lid: straight, lower at the outer corner by tilt
    const s = Math.sign(e.x) || 1, d = e.top * ph, t = e.tilt * ppm / 2;
    const yl = y0 + d + (s < 0 ? t : -t), yr = y0 + d + (s < 0 ? -t : t);
    ctx.beginPath(); ctx.moveTo(x0 - 4, y0 - 40); ctx.lineTo(x0 + pw + 4, y0 - 40); ctx.lineTo(x0 + pw + 4, yr); ctx.lineTo(x0 - 4, yl); ctx.closePath(); ctx.fill();
  }
  if (e.bot > 0.001) {                                                         // lower lid: an arch pushed up from below - a smiling eye
    const ry = e.bot * ph * 1.3;
    ctx.beginPath(); ctx.ellipse(cx, y0 + ph - e.bot * ph + ry, 0.62 * pw, ry, 0, 0, 7); ctx.fill();
  }
  ctx.restore();
}

// Draw one state onto a 2D context of W x H pixels showing mmW millimetres across.
export function draw(ctx, st, style, W, H, mmW, pal = PALETTES.mint) {
  PALETTE = pal;
  const ppm = W / mmW;
  ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (st.off > 0.995) return;
  ctx.globalAlpha = 1 - st.off;
  drawEye(ctx, st.L, W, H, ppm, style); drawEye(ctx, st.R, W, H, ppm, style);
  if (st.blush > 0.01) {
    ctx.globalAlpha = (1 - st.off) * st.blush * 0.9; ctx.fillStyle = PALETTE.blush;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(W / 2 + s * 19.1 * ppm, H / 2 + 7.8 * ppm, 2.5 * ppm, 1.3 * ppm, 0, 0, 7); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
}

// The living face: blends toward a target expression, blinks, follows a gaze point, plays short reactions, dozes off when ignored.
export class FaceEngine {
  constructor(px, mm, style = 'sparkle', palette = 'mint') {
    [this.W, this.H] = px; this.mmW = mm[0]; this.style = style; this.pal = PALETTES[palette] || PALETTES.mint; this.palette = palette;
    this.canvas = document.createElement('canvas'); this.canvas.width = this.W; this.canvas.height = this.H;
    this.ctx = this.canvas.getContext('2d');
    this.opt = { follow: true, blink: true, doze: true };
    this.manual = null;            // an expression chosen by hand or by a motion's face track; null = the face lives on its own
    this.queue = [];               // reactions: [[name, ms], ...]
    this.cur = resolve('neutral'); this.name = 'neutral';
    this.gaze = [0, 0]; this.gazeTarget = [0, 0];
    this.last = 0; this.nextBlink = 2500; this.blinkT = -1; this.lastTouch = 0; this.dozing = false;
    this.dirty = true; draw(this.ctx, this.cur, this.style, this.W, this.H, this.mmW, this.pal);
  }
  set(name) { this.manual = name || null; this.queue = []; this.dirty = true; }              // name or null (back to living on its own)
  react(seq) { this.queue = seq.map(([n, ms]) => [n, ms]); this.dirty = true; }
  lookAt(gx, gz, now) { this.gazeTarget = [clamp(gx, -1, 1), clamp(gz, -1, 1)]; this.touch(now); }
  touch(now) { if (this.dozing && !this.manual) this.react([['surprised', 420]]); this.dozing = false; this.lastTouch = now ?? this.last; }
  target() {
    if (this.queue.length) return this.queue[0][0];
    if (this.manual) return this.manual;
    return this.dozing ? 'sleepy' : 'neutral';
  }
  // advance to time `now` (ms); returns true if the picture changed
  update(now) {
    const dt = Math.min(Math.max(now - this.last, 0), 100); this.last = now;
    if (this.queue.length) { this.queue[0][1] -= dt; if (this.queue[0][1] <= 0) this.queue.shift(); }
    if (this.opt.doze && !this.manual && !this.dozing && now - this.lastTouch > 25000) this.dozing = true;
    const name = this.target(); this.name = name;
    const k = 1 - Math.exp(-dt / 55);                                          // about 0.15 s to settle
    const before = JSON.stringify(this.cur);
    this.cur = mix(this.cur, resolve(name), k);
    const g = this.opt.follow && !this.dozing && (!this.manual || !/look_|off|blink/.test(this.manual)) ? this.gazeTarget : [0, 0];
    const kg = 1 - Math.exp(-dt / 90);
    this.gaze = [lerp(this.gaze[0], g[0], kg), lerp(this.gaze[1], g[1], kg)];
    const st = { L: { ...this.cur.L }, R: { ...this.cur.R }, blush: this.cur.blush, off: this.cur.off };
    for (const e of [st.L, st.R]) { e.gx = clamp(e.gx + this.gaze[0], -1, 1); e.gz = clamp(e.gz + this.gaze[1], -1, 1); }
    if (this.opt.blink && name !== 'off') {                                    // a blink is laid over whatever the face is doing
      if (this.blinkT < 0 && now > this.nextBlink) this.blinkT = 0;
      if (this.blinkT >= 0) {
        this.blinkT += dt;
        const p = this.blinkT / 150, c = p < 0.4 ? p / 0.4 : Math.max(0, 1 - (p - 0.4) / 0.6);   // down fast, up slower
        for (const e of [st.L, st.R]) { e.open = lerp(e.open, Math.min(e.open, 0.1), c); e.wide = lerp(e.wide, 1.06, c); }
        if (p >= 1) { this.blinkT = -1; this.nextBlink = now + 2200 + Math.random() * 3800; }
      }
    }
    const sig = JSON.stringify(st);
    if (sig === this.sig && before === JSON.stringify(this.cur) && !this.dirty) return false;
    this.sig = sig; this.dirty = false;
    draw(this.ctx, st, this.style, this.W, this.H, this.mmW, this.pal);
    return true;
  }
  // a still picture of one expression (no gaze, no blink) - what the CAD build and the renders use
  still(name, style = this.style) {
    const c = document.createElement('canvas'); c.width = this.W; c.height = this.H;
    draw(c.getContext('2d'), resolve(name), style, this.W, this.H, this.mmW, this.pal);
    return c;
  }
}
