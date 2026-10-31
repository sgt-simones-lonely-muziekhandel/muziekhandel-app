// Shared parts for the short films (the prologue before the game, and the time-travel story):
// painted shots in screen space that drift and zoom slowly, dissolve into each other (or, with
// `wipe`, slide into each other behind a seam of golden light, like the time travel), with
// captions on a strip of old paper, rain and floating dust. A film is a scene: subclass `Film`,
// give it a list of shots, and write one method per shot with the shot's `key` as its name,
// called as `this[key](ctx, t, vw, live)`: `t` is the story time inside the shot, `live` a clock
// that never stops (for rain, dust, breathing, swaying).
//
// Made for young kids: when a caption has come in, the story waits until the player clicks or
// taps (a pulsing ▶ on the caption shows it after a moment); then the caption fades and the story
// goes on. While it waits only the story time stops, so the picture keeps living. Keys and clicks
// without a caption don't skip anything.
import { rain, loadThunder } from './sfx.js';

export const H = 720;
const XF = 2.2;        // seconds two shots dissolve into each other
const WIPE = 2.6;      // seconds a wipe takes to cross the screen
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
const SWIRL = load('public/art/intro/swirl.webp');
// what streams across the screen with a wipe: the flying notes of the story
const FLYING = [1, 2, 3, 4, 5, 6].map(n => load(`public/art/intro/flying/note-${n}.webp`));

export class Film {
  // shots: [{ key, dur, captions: [[from, text], …] }], `from` in seconds within the shot; leave
  // CAP_IN + CAP_OUT between one caption's `from` and the next. At the end the last picture
  // dissolves over `out` seconds into the scene `next`. With `wipe` the shots don't dissolve but
  // slide in behind a moving seam of light, from the right or the left in turn (or as a shot's
  // `from: 'left' | 'right'` says); captions then wait until the wipe is over.
  constructor(game, { shots, place, next, out = 3.5, seed = 1, wipe = false }) {
    this.game = game;
    this.width = 1; // drawn in screen space; the camera doesn't move
    this.shots = shots;
    this.place = place;
    this.next = next;
    this.out = out;
    this.wipe = wipe;
    const overlap = wipe ? WIPE : XF;
    let at = 0;
    shots.forEach((s, i) => {
      s.start = at; at += s.dur - overlap;
      s.dir = s.from === 'left' ? 1 : s.from === 'right' ? -1 : i % 2 ? -1 : 1;
      if (wipe && i > 0) s.captions = s.captions.map(([from, text]) => [Math.max(from, WIPE + 0.2), text]);
    });
    const last = shots[shots.length - 1];
    this.total = last.start + last.dur;
    this.captions = shots.flatMap(s => s.captions.map(([from, text]) => ({ text, from: s.start + from, hold: s.start + from + CAP_IN })));
    this.T = 0;
    this.clock = 0;
    this.done = false;
    const r = mulberry(seed);
    this.rain = Array.from({ length: 160 }, () => [r(), r(), 12 + r() * 20, 0.9 + r() * 0.6]);
    this.motes = Array.from({ length: 40 }, () => [r(), r(), 1 + r() * 2.2, r() * 7, 0.3 + r() * 0.7]);
    // the cascade that streams across with a wipe: height, lag, size, kind (note picture or spark), spin
    this.cascade = Array.from({ length: 46 }, (_, i) => [(i + r() * 0.8) / 46, r(), 0.7 + r() * 0.8, r() < 0.55 ? Math.floor(r() * 6) : -1, r() * 6]);
  }

  enter() {
    this.T = 0;
    this.clock = 0;
    this.done = false;
    this.holding = null; // the caption the story is waiting on
    this.rainSeen = 0;   // how hard it rained on screen in the last frame (see drawRain)
    loadThunder();
    for (const c of this.captions) { c.released = null; c.since = null; c.shown = null; }
    this.game.setPlace(this.place);
  }

  // Only a click or tap goes on, and only while a caption waits; keys don't skip.
  interact() {}
  // The Overslaan button (or Esc): straight on to the scene after the film.
  skip() {
    if (this.done) return;
    this.done = true;
    this.holding = null;
    this.game.goTo(this.next);
  }
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
    // the rain sounds as hard as it rains on screen (0.3 is a downpour); none in the past
    rain(Math.min(1, this.rainSeen / 0.3));
    if (this.T >= this.total && !this.done) { this.done = true; this.game.goTo(this.next, { dissolve: this.out }); }
  }

  draw(ctx, view) {
    const vw = view.viewW, T = this.T;
    ctx.save();
    ctx.setTransform(view.base);
    this.rainSeen = 0;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, vw, H);
    if (this.wipe) this.drawWiped(ctx, vw, T);
    // every shot that is on screen, the later one dissolving in over the earlier
    else this.shots.forEach((s, i) => {
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
      c.shown ??= this.clock;
      caption(ctx, c.text, a, vw, hint, this.clock, this.clock - c.shown);
    }
    // soft fade in from black at the start
    const black = 1 - smooth(T / EDGE);
    if (black > 0) { ctx.fillStyle = `rgba(0,0,0,${black})`; ctx.fillRect(0, 0, vw, H); }
    ctx.restore();
  }

  // The shot on screen, or two while one slides in over the other: a seam of light crosses the
  // screen, the new picture behind it. Both pictures move with it (the old one a little, the new
  // one more, sliding into place), so it feels like the camera swings on to the next place.
  drawWiped(ctx, vw, T) {
    const k = this.shots.findIndex((s, i) => i > 0 && T - s.start >= 0 && T - s.start < WIPE);
    const shot = (s, dx) => {
      ctx.save();
      ctx.translate(dx, 0);
      this[s.key](ctx, T - s.start, vw, this.clock);
      ctx.restore();
    };
    if (k < 0) {
      const s = [...this.shots].reverse().find(s => T >= s.start) || this.shots[0];
      return shot(s, 0);
    }
    const from = this.shots[k - 1], to = this.shots[k], d = to.dir;
    const p = ease((T - to.start) / WIPE);
    // d = -1: the new picture comes in from the right, the seam runs right to left
    const sx = d < 0 ? vw * (1 - p) : vw * p;
    shot(from, d * 0.15 * p * vw);
    ctx.save();
    ctx.beginPath();
    if (d < 0) ctx.rect(sx, 0, vw - sx, H); else ctx.rect(0, 0, sx, H);
    ctx.clip();
    shot(to, -d * 0.3 * (1 - p) * vw);
    ctx.restore();
    seam(ctx, sx, this.clock, Math.sin(Math.PI * p));
    this.drawCascade(ctx, vw, (T - to.start) / WIPE, d);
  }

  // A cascade of music notes and golden sparks streaming across the screen with the wipe, in the
  // same direction: they set off one after the other from top to bottom, like a waterfall tipped
  // on its side, each on its own gentle wave, turning, fading in and out.
  drawCascade(ctx, vw, p, d) {
    ctx.save();
    for (const [y, lag, size, kind, spin] of this.cascade) {
      // the higher ones go first; each crosses in about two thirds of the wipe
      const q = (p * 1.5 - y * 0.35 - lag * 0.15) / 0.75;
      if (q <= 0 || q >= 1) continue;
      const travel = -0.1 + 1.2 * ease(q);
      const x = (d < 0 ? 1 - travel : travel) * vw;
      const py = (0.06 + y * 0.88) * H + Math.sin(q * 6 + spin) * 26;
      const a = Math.sin(Math.PI * q);
      ctx.save();
      ctx.translate(x, py);
      ctx.rotate(Math.sin(this.clock * 2 + spin) * 0.35 + d * q * 0.6);
      ctx.globalAlpha = a * 0.9;
      const img = FLYING[kind];
      if (kind >= 0 && ready(img)) {
        const h = 64 * size, w = h * img.naturalWidth / img.naturalHeight;
        // a warm halo behind each note, so it shows on light and dark pictures alike
        const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, h * 0.8);
        halo.addColorStop(0, 'rgba(255,226,150,0.55)'); halo.addColorStop(1, 'rgba(255,210,120,0)');
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(0, 0, h * 0.8, 0, Math.PI * 2); ctx.fill();
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      } else {
        // a four-pointed spark of light
        ctx.globalCompositeOperation = 'lighter';
        const r = 14 * size;
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.6);
        g.addColorStop(0, 'rgba(255,240,190,0.9)'); g.addColorStop(1, 'rgba(255,200,110,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,248,220,0.95)';
        ctx.beginPath();
        ctx.moveTo(0, -r); ctx.quadraticCurveTo(0, 0, r, 0); ctx.quadraticCurveTo(0, 0, 0, r);
        ctx.quadraticCurveTo(0, 0, -r, 0); ctx.quadraticCurveTo(0, 0, 0, -r); ctx.fill();
      }
      ctx.restore();
    }
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
    this.rainSeen = Math.max(this.rainSeen, alpha * ctx.globalAlpha);
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

// The moving edge of a wipe: a soft band of warm light with the golden swirl of the time travel
// turning in it, `a` (0–1) strong; it hides the hard edge between the two pictures.
function seam(ctx, sx, clock, a) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const band = ctx.createLinearGradient(sx - 220, 0, sx + 220, 0);
  band.addColorStop(0, 'rgba(255,220,150,0)'); band.addColorStop(0.5, `rgba(255,228,170,${0.28 * a})`); band.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = band; ctx.fillRect(sx - 220, 0, 440, H);
  if (ready(SWIRL)) {
    const h = H * 1.25, w = h * SWIRL.naturalWidth / SWIRL.naturalHeight;
    for (let i = 0; i < 2; i++) {
      ctx.save();
      ctx.translate(sx + Math.sin(clock * 2 + i) * 16, H / 2);
      ctx.rotate(Math.sin(clock * 1.3 + i * 2) * 0.06 + (i ? 0.25 : -0.1));
      ctx.scale(i ? -1 : 1, 1);
      ctx.globalAlpha = a * (i ? 0.25 : 0.5);
      ctx.drawImage(SWIRL, -w / 2, -h / 2 - 20, w, h);
      ctx.restore();
    }
  }
  ctx.restore();
}

// A caption on a strip of old paper, bottom right (clear of the boy and his hands). Long
// sentences wrap onto more lines and the strip grows with them. The strip slides in from the
// right, and its words follow in a cascade from left to right, each dropping into place.
// `since`: seconds since it appeared. `hint` (0–1) shows a pulsing brass ▶ on its right end:
// click to go on.
const WORD_GAP = 0.07, WORD_IN = 0.45;
function caption(ctx, text, a, vw, hint, clock, since) {
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
  const x = vw - w - Math.max(24, vw * 0.06) + (1 - a) * 60, y = H - h - 34 - (1 - a) * 8;
  if (ready(STRIP)) ctx.drawImage(STRIP, x, y, w, h);
  else { ctx.fillStyle = '#f4e9d7'; ctx.fillRect(x, y, w, h); }
  ctx.fillStyle = INK; ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const space = ctx.measureText(' ').width;
  let k = 0;
  lines.forEach((l, i) => {
    let wx = x + w / 2 - ctx.measureText(l).width / 2;
    const wy = y + 20 + 22 + i * 44 + 2;
    for (const word of l.split(' ')) {
      const wa = smooth((since - k++ * WORD_GAP) / WORD_IN);
      if (wa > 0) {
        ctx.globalAlpha = a * wa;
        ctx.fillText(word, wx - (1 - wa) * 16, wy - (1 - wa) * 10);
      }
      wx += ctx.measureText(word).width + space;
    }
  });
  ctx.globalAlpha = a;
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
