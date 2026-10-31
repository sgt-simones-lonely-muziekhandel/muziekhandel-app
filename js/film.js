// Shared parts for the short films (the prologue before the game, and the time-travel story):
// painted shots in screen space that drift and zoom slowly, dissolve into each other, with
// captions on a strip of old paper, rain and floating dust. A film is a scene: subclass `Film`,
// give it a list of shots, and write one method per shot with the shot's `key` as its name,
// called as `this[key](ctx, t, vw, live)`: `t` is the story time inside the shot, `live` a clock
// that never stops (for rain, dust, breathing, swaying).
//
// Made for young kids: when a caption has come in, the story waits until the player clicks or
// taps (a pulsing ▶ on the caption shows it after a moment); then the caption fades and the story
// goes on. While it waits only the story time stops, so the picture keeps living. Keys and clicks
// without a caption don't skip anything.

export const H = 720;
const XF = 2.2;        // seconds two shots dissolve into each other
const EDGE = 2;        // fade in from black at the start
const CAP_IN = 0.9;    // a caption fades in over this long, then the story waits for a click
const CAP_OUT = 0.7;   // and fades out over this long after the click
const HINT = 1.5;      // seconds of waiting before the ▶ appears
const INK = '#2a1d12';

export const load = path => { const i = new Image(); i.src = path; return i; };
export const ready = img => !!img && img.complete && img.naturalWidth > 0;
export const clamp = p => Math.max(0, Math.min(1, p));
export const smooth = p => { p = clamp(p); return p * p * (3 - 2 * p); };
export const ease = p => { p = clamp(p); return p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2; };
// 0 → 1 → 0: rises from a to b, stays, falls from c to d
export const bump = (t, a, b, c, d) => (t < b ? smooth((t - a) / (b - a)) : t < c ? 1 : 1 - smooth((t - c) / (d - c)));

const STRIP = load('public/art/ui/paper-strip.webp');

export class Film {
  // shots: [{ key, dur, captions: [[from, text], …] }], `from` in seconds within the shot; leave
  // CAP_IN + CAP_OUT between one caption's `from` and the next. At the end the last picture
  // dissolves over `out` seconds into the scene `next`.
  constructor(game, { shots, place, next, out = 3.5, seed = 1 }) {
    this.game = game;
    this.width = 1; // drawn in screen space; the camera doesn't move
    this.shots = shots;
    this.place = place;
    this.next = next;
    this.out = out;
    let at = 0;
    for (const s of shots) { s.start = at; at += s.dur - XF; }
    const last = shots[shots.length - 1];
    this.total = last.start + last.dur;
    this.captions = shots.flatMap(s => s.captions.map(([from, text]) => ({ text, from: s.start + from, hold: s.start + from + CAP_IN })));
    this.T = 0;
    this.clock = 0;
    this.done = false;
    const r = mulberry(seed);
    this.rain = Array.from({ length: 160 }, () => [r(), r(), 12 + r() * 20, 0.9 + r() * 0.6]);
    this.motes = Array.from({ length: 40 }, () => [r(), r(), 1 + r() * 2.2, r() * 7, 0.3 + r() * 0.7]);
  }

  enter() {
    this.T = 0;
    this.clock = 0;
    this.done = false;
    this.holding = null; // the caption the story is waiting on
    for (const c of this.captions) { c.released = null; c.since = null; }
    this.game.setPlace(this.place);
  }

  // Only a click or tap goes on, and only while a caption waits; keys don't skip.
  interact() {}
  click() {
    if (!this.holding) return;
    this.holding.released = this.clock;
    this.holding = null;
  }
  hover() { return !!this.holding; }

  // Seconds into the shot with this key (negative before it starts).
  timeIn(key) { return this.T - this.shots.find(s => s.key === key).start; }

  update(dt) {
    this.clock += dt;
    if (!this.holding) {
      const next = this.captions.find(c => c.released == null);
      if (next && this.T + dt >= next.hold) { this.T = next.hold; this.holding = next; next.since = this.clock; }
      else this.T += dt;
    }
    this.tick?.(this.holding ? 0 : dt);
    if (this.T >= this.total && !this.done) { this.done = true; this.game.goTo(this.next, { dissolve: this.out }); }
  }

  draw(ctx, view) {
    const vw = view.viewW, T = this.T;
    ctx.save();
    ctx.setTransform(view.base);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, vw, H);
    // every shot that is on screen, the later one dissolving in over the earlier
    this.shots.forEach((s, i) => {
      const t = T - s.start;
      if (t < 0 || t > s.dur) return;
      const a = i === 0 ? 1 : smooth(t / XF);
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      this[s.key](ctx, t, vw, this.clock);
      ctx.restore();
    });
    this.overlay?.(ctx, vw);
    for (const c of this.captions) {
      const a = smooth((T - c.from) / CAP_IN) * (c.released == null ? 1 : 1 - smooth((this.clock - c.released) / CAP_OUT));
      if (a <= 0) continue;
      const hint = c === this.holding ? smooth((this.clock - c.since - HINT) / 0.6) : 0;
      caption(ctx, c.text, a, vw, hint, this.clock);
    }
    // soft fade in from black at the start
    const black = 1 - smooth(T / EDGE);
    if (black > 0) { ctx.fillStyle = `rgba(0,0,0,${black})`; ctx.fillRect(0, 0, vw, H); }
    ctx.restore();
  }

  // Specks of dust floating slowly in the light around (cx, cy). `rgb` is like 'rgba(255,220,150,'.
  drawMotes(ctx, t, vw, cx, cy, rgb, strength) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const [x, y, s, ph, sp] of this.motes) {
      const px = cx + (x - 0.5) * vw * 0.8 + Math.sin(t * sp + ph) * 20;
      // drifting slowly upwards, wrapping round; faded out near the ends so none pops
      const e = (((y - t * 0.03 * sp) % 1) + 1) % 1;
      const py = cy + (e - 0.5) * H * 0.7;
      const a = strength * 0.5 * (0.5 + 0.5 * Math.sin(t * 1.7 * sp + ph)) * Math.sin(Math.PI * e);
      ctx.fillStyle = `${rgb}${a})`;
      ctx.beginPath(); ctx.arc(px, py, s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  drawRain(ctx, t, vw, alpha) {
    ctx.save();
    ctx.strokeStyle = `rgba(190,205,225,${alpha})`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (const [x, y, len, sp] of this.rain) {
      const py = ((y + t * sp * 1.1) % 1) * (H + 40) - 20;
      const px = ((x + t * sp * 0.1) % 1) * (vw + 60) - 30;
      ctx.moveTo(px, py); ctx.lineTo(px - len * 0.22, py + len);
    }
    ctx.stroke();
    ctx.restore();
  }
}

// A caption on a strip of old paper, bottom right (clear of the boy and his hands). Long
// sentences wrap onto more lines and the strip grows with them. `hint` (0–1) shows a pulsing
// brass ▶ on its right end: click to go on.
function caption(ctx, text, a, vw, hint, clock) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.font = '600 38px Caveat, "Comic Sans MS", cursive';
  const max = Math.min(vw * 0.5, 680);
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const tryLine = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(tryLine).width > max) { lines.push(line); line = word; } else line = tryLine;
  }
  lines.push(line);
  const tw = Math.max(...lines.map(l => ctx.measureText(l).width));
  const w = tw + 115, h = 40 + lines.length * 44;
  const x = vw - w - Math.max(24, vw * 0.06), y = H - h - 34 - (1 - a) * 8;
  if (ready(STRIP)) ctx.drawImage(STRIP, x, y, w, h);
  else { ctx.fillStyle = '#f4e9d7'; ctx.fillRect(x, y, w, h); }
  ctx.fillStyle = INK; ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  lines.forEach((l, i) => ctx.fillText(l, x + w / 2, y + 20 + 22 + i * 44 + 2));
  if (hint > 0) {
    const r = 22 * (1 + 0.08 * Math.sin(clock * 4)), cx = x + w - 6, cy = y + h - 6;
    ctx.globalAlpha = a * hint;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#f2c76b'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 6, cy - 10); ctx.lineTo(cx + 11, cy); ctx.lineTo(cx - 6, cy + 10); ctx.closePath();
    ctx.fillStyle = INK; ctx.fill();
  }
  ctx.restore();
}

// Draw a 16:9 painting so it covers the screen, zoomed around (fx, fy) (0–1 of the picture).
// Returns where it went, to pin things to the painting.
export function cover(ctx, img, vw, zoom, fx, fy) {
  if (!ready(img)) return null;
  const s = Math.max(vw / img.naturalWidth, H / img.naturalHeight) * zoom;
  const w = img.naturalWidth * s, h = img.naturalHeight * s;
  const x = Math.min(0, Math.max(vw - w, vw / 2 - fx * w));
  const y = Math.min(0, Math.max(H - h, H / 2 - fy * h));
  ctx.drawImage(img, x, y, w, h);
  return { x, y, w, h };
}

export function glow(ctx, x, y, r, rgba) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 4, x, y, r);
  g.addColorStop(0, rgba); g.addColorStop(1, 'rgba(255,200,110,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

// Soft slanting beams of sunlight, slowly breathing.
export function sunBeams(ctx, vw, t, strength) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    const a = strength * 0.07 * (0.6 + 0.4 * Math.sin(t * 0.5 + i * 1.7));
    const x = vw * (0.15 + i * 0.22) + Math.sin(t * 0.15 + i) * 30;
    const g = ctx.createLinearGradient(x, 0, x - 160, H);
    g.addColorStop(0, `rgba(255,236,180,${a})`); g.addColorStop(1, 'rgba(255,236,180,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 30, 0); ctx.lineTo(x + 50, 0); ctx.lineTo(x - 120, H); ctx.lineTo(x - 260, H);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

// The boy seen from behind, standing on a painting at (fx, fy) (0–1 of the picture, his feet),
// `kh` of the picture high. Pinned to the painting, so he stays put while the camera moves; he
// has no walk from behind, so he only breathes.
export function boyFromBehind(ctx, img, at, fx, fy, kh, t) {
  if (!ready(img) || !at) return;
  const h = at.h * kh, w = h * img.naturalWidth / img.naturalHeight;
  const x = at.x + fx * at.w, y = Math.min(H - 6, at.y + fy * at.h);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, 1 + 0.008 * Math.sin(t * 2.2)); // breathing
  ctx.fillStyle = 'rgba(10,8,6,0.3)';
  ctx.beginPath(); ctx.ellipse(0, -4, w * 0.45, h * 0.025, 0, 0, Math.PI * 2); ctx.fill();
  ctx.drawImage(img, -w / 2, -h, w, h);
  ctx.restore();
}

export function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
