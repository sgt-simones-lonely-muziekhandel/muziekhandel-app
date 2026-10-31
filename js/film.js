// Shared parts for the short films (the prologue before the game, and the time-travel story):
// painted shots in screen space that drift and zoom slowly, dissolve into each other, with
// captions on a strip of old paper, rain and floating dust. A film is a scene: subclass `Film`,
// give it a list of shots, and write one method per shot with the shot's `key` as its name,
// called as `this[key](ctx, t, vw)` with the time inside the shot.

export const H = 720;
const XF = 1.6;        // seconds two shots dissolve into each other
const EDGE = 1.6;      // fade in from black at the start
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
  // shots: [{ key, dur, captions: [[from, to, text], …] }]. At the end the last picture dissolves
  // over `out` seconds into the scene `next`.
  constructor(game, { shots, place, next, out = 2.8, seed = 1 }) {
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
    this.T = 0;
    this.done = false;
    const r = mulberry(seed);
    this.rain = Array.from({ length: 160 }, () => [r(), r(), 12 + r() * 20, 0.9 + r() * 0.6]);
    this.motes = Array.from({ length: 40 }, () => [r(), r(), 1 + r() * 2.2, r() * 7, 0.3 + r() * 0.7]);
  }

  enter() {
    this.T = 0;
    this.done = false;
    this.game.setPlace(this.place);
  }

  // skip ahead: start dissolving into the next shot now
  interact() {
    const i = this.shotAt(this.T);
    if (i < this.shots.length - 1) this.T = Math.max(this.T, this.shots[i + 1].start);
    else this.T = Math.max(this.T, this.total);
  }
  click() { this.interact(); }
  hover() { return true; }

  shotAt(T) {
    let i = 0;
    while (i < this.shots.length - 1 && T >= this.shots[i + 1].start + XF) i++;
    return i;
  }

  // Seconds into the shot with this key (negative before it starts).
  timeIn(key) { return this.T - this.shots.find(s => s.key === key).start; }

  update(dt) {
    this.T += dt;
    this.tick?.(dt);
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
      this[s.key](ctx, t, vw);
      ctx.restore();
    });
    this.overlay?.(ctx, vw);
    for (const s of this.shots) {
      const t = T - s.start;
      for (const [from, to, text] of s.captions) {
        const a = bump(t, from, from + 0.8, to - 0.8, to);
        if (a > 0) caption(ctx, text, a, vw);
      }
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
// sentences wrap onto more lines and the strip grows with them.
function caption(ctx, text, a, vw) {
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
