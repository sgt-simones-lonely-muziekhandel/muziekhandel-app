// The prologue, played before the game starts: where and when the player is, and why the city is
// flooded. Three painted shots from public/art/intro, in the same slow anime style as the story
// (shared parts in js/film.js):
//   1. today   Amsterdam in 2026: the canal on a fresh morning, bikes, boats, birds
//   2. map     an old map of the Netherlands; the year counts up to 2126 while the sea creeps in
//   3. future  the same street in 2126, flooded and quiet under smoky air; the camera tilts down
//              from the storm to the boy on the quay, then dissolves into the future street
// The shots slide into each other behind a seam of light (`wipe`), like the time travel in the
// story. Each caption waits until the player clicks or taps (see js/film.js); Overslaan skips it all.
import { Film, H, load as loadImg, ready, smooth, ease, bump, cover, glow, sunBeams, boyFromBehind, mulberry } from './film.js';

const load = name => loadImg(`public/art/intro/${name}.webp`);
const IMG = {
  today: load('today-street'), mapNow: load('map-now'), mapFlooded: load('map-flooded'),
  future: load('future-street'), futureFrame: load('future-frame'), kid: load('kid-back/future'),
};
const STRIP = loadImg('public/art/ui/paper-strip.webp');

const INK = '#2a1d12';
const YEAR_FROM = 2026, YEAR_TO = 2126;
// Where the sea comes from on the maps (0–1 of the picture): the North Sea, left of the coast.
const SEA = [0.1, 0.35];
// The boy on the quay in future-street.webp, as in the story.
const KID_AT = [0.3, 0.985], KID_H = 0.42;

// Shots, in order. `captions` are [from, text]: the caption comes in at `from` seconds into the
// shot and the prologue waits there until the player clicks.
const SHOTS = [
  { key: 'today', dur: 9, captions: [[1.4, 'Amsterdam, 2026. Een stad vol water, fietsen… en muziek.']] },
  { key: 'map', dur: 15, from: 'right', captions: [
    [2.8, 'De aarde werd steeds warmer. Het ijs smolt en de zee steeg.'],
    [11.6, 'Het water kwam steeds verder het land in.'],
  ] },
  { key: 'future', dur: 17, from: 'left', captions: [
    [6.8, 'Het jaar 2126. De mensen zijn vertrokken naar hoger land.'],
    [8.6, 'De lucht is vies van stormen en branden. Wie naar buiten gaat, draagt een masker.'],
    [12.4, 'De stad is stil — er klinkt geen muziek meer. Maar één jongen is nog op zoek…'],
  ] },
];
const FLOOD = [4.4, 7];   // after the first map caption the sea rises, taking this long
const TILT = 7;           // the camera comes down from the storm to the street over this long
const BOY = 10.2;         // after the smoke caption the boy appears on the quay

export class Prologue extends Film {
  constructor(game) {
    super(game, { shots: SHOTS, place: 'Amsterdam', next: 'future', seed: 5, wipe: true });
    const r = mulberry(23);
    // birds over the canal: start x, height, speed, flap phase
    this.birds = Array.from({ length: 5 }, () => [r(), 0.08 + r() * 0.2, 0.6 + r() * 0.5, r() * 6]);
    // smoke drifting through the future street: x, y, size, speed
    this.smoke = Array.from({ length: 9 }, () => [r(), 0.15 + r() * 0.7, 0.25 + r() * 0.3, 0.3 + r() * 0.6]);
    this.flood = null; // canvas for the flooded map, masked to how far the sea has come
  }

  // 1. Amsterdam today: a slow pan along the canal on a fresh morning, birds flying over.
  today(ctx, t, vw, live) {
    const p = ease(t / 9);
    cover(ctx, IMG.today, vw, 1.04 + 0.08 * p, 0.4 + 0.15 * p + 0.01 * Math.sin(live * 0.25), 0.5);
    sunBeams(ctx, vw, live, 0.35);
    this.drawMotes(ctx, live, vw, vw * 0.55, H * 0.35, 'rgba(255,250,230,', 0.4);
    ctx.save();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    for (const [x, y, sp, ph] of this.birds) {
      const bx = ((x + live * 0.025 * sp) % 1.2) * vw - vw * 0.1, by = H * y + Math.sin(live * sp + ph) * 6;
      const flap = Math.sin(live * 9 * sp + ph) * 5, s = 9;
      ctx.beginPath();
      ctx.moveTo(bx - s, by - flap); ctx.quadraticCurveTo(bx - s / 2, by - 3, bx, by);
      ctx.quadraticCurveTo(bx + s / 2, by - 3, bx + s, by - flap);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 2. The map: the year counts up from 2026 to 2126 while the sea creeps inland from the coast.
  // The flooded map is the same picture with water, revealed by a soft growing circle from the sea.
  map(ctx, t, vw, live) {
    const p = ease((t - FLOOD[0]) / FLOOD[1]);
    const at = cover(ctx, IMG.mapNow, vw, 1.03 + 0.07 * ease(t / 15), 0.5 + 0.008 * Math.sin(live * 0.3), 0.45);
    if (at && ready(IMG.mapFlooded) && p > 0) {
      const m = ctx.getTransform(), k = m.a;
      const c = this.flood || (this.flood = document.createElement('canvas'));
      c.width = Math.ceil(vw * k); c.height = Math.ceil(H * k);
      const g = c.getContext('2d');
      g.drawImage(IMG.mapFlooded, at.x * k, at.y * k, at.w * k, at.h * k);
      // the sea's front: fully flooded inside, fading out over a soft edge
      const cx = (at.x + SEA[0] * at.w) * k, cy = (at.y + SEA[1] * at.h) * k;
      const r = (0.12 + 1.05 * p) * at.w * k, edge = 0.16 * at.w * k;
      const mask = g.createRadialGradient(cx, cy, Math.max(0, r - edge), cx, cy, r);
      mask.addColorStop(0, 'rgba(0,0,0,1)'); mask.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalCompositeOperation = 'destination-in';
      g.fillStyle = mask;
      g.fillRect(0, 0, c.width, c.height);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, m.e, m.f);
      ctx.drawImage(c, 0, 0);
      ctx.restore();
    }
    // the weather gets darker and wetter as the years go by
    ctx.fillStyle = `rgba(20,26,38,${0.28 * p})`;
    ctx.fillRect(0, 0, vw, H);
    this.drawRain(ctx, live, vw, 0.25 * p);
    this.yearPlaque(ctx, vw, Math.round(YEAR_FROM + (YEAR_TO - YEAR_FROM) * p), smooth((t - 0.6) / 1));
  }

  // The year, big, on a strip of old paper top right.
  yearPlaque(ctx, vw, year, a) {
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.font = '700 58px "EB Garamond", Georgia, serif';
    const w = ctx.measureText(String(year)).width + 90, h = 96;
    const x = vw - w - Math.max(24, vw * 0.05), y = 34;
    if (ready(STRIP)) ctx.drawImage(STRIP, x, y, w, h);
    else { ctx.fillStyle = '#f4e9d7'; ctx.fillRect(x, y, w, h); }
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(year), x + w / 2, y + h / 2 + 3);
    ctx.restore();
  }

  // 3. The year 2126: the camera tilts down from the storm to the flooded street. Smoke drifts
  // through, now and then lightning, and at last the boy appears on the quay.
  future(ctx, t, vw, live) {
    const p = ease(t / TILT);
    const at = cover(ctx, IMG.future, vw, 1.28 - 0.2 * p, 0.45 + 0.05 * p + 0.01 * Math.sin(live * 0.2), 0.12 + 0.5 * p);
    // the boy fades in after the camera has come down
    const kid = smooth((t - BOY) / 1.8);
    if (kid > 0) {
      ctx.save();
      ctx.globalAlpha *= kid;
      boyFromBehind(ctx, IMG.kid, at, KID_AT[0], KID_AT[1], KID_H, live);
      ctx.restore();
    }
    if (ready(IMG.futureFrame)) {
      // dark vines in front, drifting a little more than the street for depth
      ctx.drawImage(IMG.futureFrame, -vw * 0.06 + Math.sin(live * 0.25) * 10, -H * 0.06, vw * 1.12, H * 1.12);
    }
    this.drawSmoke(ctx, live, vw, 0.6 + 0.4 * smooth((t - 8.6) / 2));
    this.drawRain(ctx, live, vw, 0.3);
    // distant lightning, twice
    const flash = Math.max(bump(t, 3.1, 3.2, 3.3, 4), 0.7 * bump(t, 15.2, 15.3, 15.4, 16.1));
    if (flash > 0) glow(ctx, vw * 0.6, H * 0.2, vw, `rgba(190,200,230,${0.3 * flash})`);
  }

  // Grey smoke drifting slowly through the street: big soft clouds, a little see-through.
  drawSmoke(ctx, t, vw, strength) {
    ctx.save();
    for (const [x, y, s, sp] of this.smoke) {
      const r = s * vw;
      const cx = ((x + t * 0.012 * sp) % 1.4) * vw * 1.2 - vw * 0.3, cy = y * H + Math.sin(t * 0.3 * sp + x * 9) * 20;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(120,118,112,${0.22 * strength})`); g.addColorStop(1, 'rgba(120,118,112,0)');
      ctx.fillStyle = g;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    ctx.restore();
  }
}
