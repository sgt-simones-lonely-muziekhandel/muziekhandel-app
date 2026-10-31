// The story between the future and the past, played after the boy opens the crate on the
// future street. Three painted shots from public/art/intro, like a slow anime opening: every
// shot drifts and zooms a little, shots dissolve into each other, and small things keep moving
// (rain, dust in the light, the boy breathing, sheet music and notes flying).
//   1. crate   the crate in the rubble, closed; a golden flash and it is open
//   2. tube    the boy's hands lift a cylinder tube, the lid pops off, light and music pour out
//   3. travel  the flooded street; a swirl of light sweeps across and the past appears behind it,
//              then the camera drifts towards the sunset and the picture dissolves into the street
// The boy is seen from behind here and has no walk for that, so he only stands and breathes.
// A click, tap or ↑ / Enter / Space jumps to the next shot. The shared parts (timeline,
// dissolves, captions, rain, dust) are in js/film.js.
import { Film, H, load as loadImg, ready, smooth, ease, bump, cover, glow, sunBeams, boyFromBehind } from './film.js';
import { loadTimeTravel, timeTravel } from './sfx.js';

const load = name => loadImg(`public/art/intro/${name}.webp`);
const IMG = {
  crateClosed: load('crate-closed'), crateOpen: load('crate-open'),
  tubeBg: load('tube-background'), hands: load('hands-tube'), lid: load('tube-lid'),
  burst: load('light-burst'), swirl: load('swirl'),
  future: load('future-street'), futureFrame: load('future-frame'), past: load('past-street'),
  kidFuture: load('kid-back/future'), kidPast: load('kid-back/past'),
};
const PAPERS = [1, 2, 3, 4, 5, 6, 7].map(n => load(`flying/paper-${n}`));
const NOTES = [1, 2, 3, 4, 5, 6].map(n => load(`flying/note-${n}`));

// The opening of the tube in hands-tube.webp, in its own pixels: the centre, the tube's width,
// and the inner rim as an ellipse (half-width, half-height, tilt) where the light comes out.
const TUBE_TOP = [566, 82], TUBE_W = 265;
const OPENING = { rx: 120, ry: 40, tilt: 0.12 };
// Where the boy stands in the two street paintings (0–1 of the picture): on the quay bottom left,
// solid ground in both the future and the past. His height as a part of the picture's height.
const KID_AT = [0.3, 0.985], KID_H = 0.42;
// The setting sun in past-street.webp, where the camera drifts to at the end.
const SUN = [0.62, 0.56];

// Shots, in order. `captions` are [from, text]: the caption comes in at `from` seconds into the
// shot and the story waits there until the player clicks (see js/film.js).
const SHOTS = [
  { key: 'crate', dur: 9, captions: [[1.2, 'Tussen de puinhopen staat een oude kist…']] },
  { key: 'tube', dur: 9.5, captions: [[1.4, 'Hij maakt een rol open… en de muziek begint.']] },
  { key: 'travel', dur: 16.5, captions: [[3, '…en de wereld verandert…'], [11, '…naar het verleden.']] },
];
const CRATE_FLASH = 3.2;  // after the caption: the crate opens in a golden flash
const LID_POP = 3.4;      // after the caption: the lid pops off the tube
const SWIRL = [4.4, 6];   // after the first caption: the swirl starts and takes this long
const AHEAD = 12.1;       // after the second caption: the camera drifts towards the sunset

export class Story extends Film {
  constructor(game) {
    super(game, { shots: SHOTS, place: 'De tijdreis', next: 'street', seed: 11 });
    this.particles = [];
    this.spawn = 0;
  }

  enter() {
    super.enter();
    this.particles = [];
    this.spawn = 0;
    this.heard = 0; // the story time sounds were played up to
    loadTimeTravel();
  }

  tick(dt) {
    if (this.timeIn('travel') > SHOTS[2].dur) this.swirlX = null;
    this.updateParticles(dt);
    this.sounds();
  }

  // The sound of the time travel (js/sfx.js): one short gust of wind with a little chime as the
  // swirl starts, about 2.5 seconds, so it is quiet again long before the past has fully come.
  // It follows the story time, so it waits with it while a caption is up.
  sounds() {
    const swirl = this.shots.find(s => s.key === 'travel').start + SWIRL[0];
    if (this.heard < swirl && this.T >= swirl) timeTravel();
    this.heard = this.T;
  }

  // over the shots: the flying music, and a gold bloom between the tube and the time travel,
  // like a white-out in a film
  overlay(ctx, vw) {
    this.drawParticles(ctx);
    const s2 = SHOTS[2].start;
    const bloom = bump(this.T, s2 - 1.2, s2 + 0.8, s2 + 1.2, s2 + 3.2);
    if (bloom > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255,214,140,${0.85 * bloom})`;
      ctx.fillRect(0, 0, vw, H);
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  // ---- the shots -------------------------------------------------------------------------
  // `t` moves the story on (and stops while a caption waits); `live` keeps things breathing.

  // 1. The crate, seen from above. It sits closed, glowing through the cracks; a slow push in;
  // a golden flash and it lies open (the two paintings don't line up exactly, the flash hides it).
  crate(ctx, t, vw, live) {
    const zoom = 1.04 + 0.1 * ease(t / 9);
    const flash = bump(t, CRATE_FLASH, CRATE_FLASH + 0.5, CRATE_FLASH + 0.6, CRATE_FLASH + 1.8);
    const open = t >= CRATE_FLASH + 0.55;
    cover(ctx, open ? IMG.crateOpen : IMG.crateClosed, vw, zoom, 0.5 + 0.02 * Math.sin(live * 0.3), 0.48);
    const cx = vw / 2, cy = H * 0.5;
    const pulse = 0.7 + 0.3 * Math.sin(live * 2.1);
    glow(ctx, cx, cy, 160 + 60 * pulse + 220 * flash, `rgba(255,200,110,${0.25 * pulse + (open ? 0.25 : 0)})`);
    this.drawMotes(ctx, live, vw, cx, cy, 'rgba(255,215,140,', 0.5 + (open ? 0.5 : 0));
    this.drawRain(ctx, live, vw, 0.18);
    if (flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,220,150,${0.9 * flash})`; ctx.fillRect(0, 0, vw, H); ctx.globalCompositeOperation = 'source-over'; }
  }

  // 2. The hands lift the tube into view, it rests a moment, the lid pops off and light pours out
  // with notes and sheets of music spiralling up.
  tube(ctx, t, vw, live) {
    cover(ctx, IMG.tubeBg, vw, 1.06 + 0.06 * ease(t / 9.5), 0.5, 0.6);
    ctx.fillStyle = 'rgba(8,10,18,0.25)'; ctx.fillRect(0, 0, vw, H);
    if (!ready(IMG.hands)) return;
    // the hands come in from the bottom-left corner: the left sleeve runs off the left edge,
    // the right one off the bottom, as if we look through the boy's eyes
    const hw = Math.min(vw * 0.62, 820), k = hw / IMG.hands.naturalWidth, hh = IMG.hands.naturalHeight * k;
    const rise = (1 - ease(t / 2.2)) * 300;
    const bob = Math.sin(live * 1.5) * 5 + Math.sin(live * 0.7) * 3;
    const hx = -hw * 0.04, hy = H - hh + 150 + rise + bob;
    const top = [hx + TUBE_TOP[0] * k, hy + TUBE_TOP[1] * k];
    this.tubeTop = top;
    const open = t - LID_POP; // seconds since the lid came off
    glow(ctx, top[0], top[1], 120 + (open > 0 ? 160 * ease(open / 1.2) : 0), `rgba(255,205,120,${open > 0 ? 0.3 : 0.15})`);
    ctx.drawImage(IMG.hands, hx, hy, hw, hh);
    if (open > 0) this.tubeLight(ctx, top, k, ease(open / 1.5), live);
    // the lid: on the tube, wobbling a little while we wait; then it pops up and tumbles away
    if (ready(IMG.lid)) {
      const lw = TUBE_W * k * 1.05, lh = lw * IMG.lid.naturalHeight / IMG.lid.naturalWidth;
      let x = top[0], y = top[1] - lh * 0.25, r = 0, a = 1;
      if (open < 0) r = Math.sin(live * 9) * 0.03 * smooth((t - 2) / 0.6);
      else { x += 280 * open; y += -440 * open + 330 * open * open; r = 2.2 * open; a = 1 - smooth((open - 0.8) / 0.7); }
      if (a > 0) {
        ctx.save();
        ctx.globalAlpha *= a;
        ctx.translate(x, y); ctx.rotate(r);
        ctx.drawImage(IMG.lid, -lw / 2, -lh / 2, lw, lh);
        ctx.restore();
      }
    }
    this.drawMotes(ctx, live, vw, top[0], top[1] - 100, 'rgba(255,220,150,', open > 0 ? 1 : 0.3);
  }

  // The light pouring out of the open tube: the inside of the opening glows, and the rays rise
  // out of it (only above the rim's front edge, so they come from inside the tube, not behind it).
  tubeLight(ctx, top, k, s, live) {
    const rx = OPENING.rx * k, ry = OPENING.ry * k;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(top[0], top[1]);
    ctx.rotate(OPENING.tilt);
    ctx.save();
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, rx);
    g.addColorStop(0, `rgba(255,246,210,${0.95 * s})`); g.addColorStop(1, `rgba(255,190,90,${0.35 * s})`);
    ctx.fillStyle = g;
    ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
    ctx.restore();
    if (ready(IMG.burst)) {
      const bw = rx * 2 * 2.4 * (0.6 + 0.4 * s) * (1 + 0.03 * Math.sin(live * 3));
      const bh = bw * IMG.burst.naturalHeight / IMG.burst.naturalWidth;
      ctx.beginPath();
      ctx.rect(-bw, -bh * 1.2, bw * 2, bh * 1.2);           // everything above the middle of the opening
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);          // and the opening itself
      ctx.clip();
      ctx.globalAlpha *= 0.9 * s;
      ctx.drawImage(IMG.burst, -bw / 2, -bh * 0.97, bw, bh);
    }
    ctx.restore();
  }

  // 3. The flooded street, the boy from behind on the quay. A swirl of light sweeps across from
  // right to left; behind it the same street appears in the past, and the boy's grey jacket turns
  // brown. Then the camera drifts slowly towards the setting sun while the light grows warmer.
  travel(ctx, t, vw, live) {
    const p = ease((t - SWIRL[0]) / SWIRL[1]);
    const sx = vw * 1.2 - p * vw * 1.45; // the swirl's x
    this.swirlX = p > 0 && p < 1 ? sx : null;
    const ahead = ease((t - AHEAD) / (SHOTS[2].dur - AHEAD)); // looking ahead, after the swirl
    const zoom = 1.06 + 0.04 * ease(t / 8) + 0.22 * ahead;
    const fx = 0.5 + 0.03 * Math.sin(live * 0.2) + (SUN[0] - 0.5) * ahead, fy = 0.45 + (SUN[1] - 0.45) * ahead;
    const kid = (img, at) => boyFromBehind(ctx, img, at, KID_AT[0], KID_AT[1], KID_H, live);
    // the future, left of the swirl
    if (sx > 0) {
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, sx, H); ctx.clip();
      kid(IMG.kidFuture, cover(ctx, IMG.future, vw, zoom, fx, fy));
      if (ready(IMG.futureFrame)) {
        // dark vines in front, drifting a little more than the street for depth
        ctx.drawImage(IMG.futureFrame, -vw * 0.06 + Math.sin(live * 0.25) * 10, -H * 0.06, vw * 1.12, H * 1.12);
      }
      this.drawRain(ctx, live, vw, 0.3);
      ctx.restore();
    }
    // the past, right of the swirl
    if (sx < vw) {
      ctx.save();
      ctx.beginPath(); ctx.rect(sx, 0, vw - sx, H); ctx.clip();
      const at = cover(ctx, IMG.past, vw, zoom, fx, fy);
      sunBeams(ctx, vw, live, 0.5 + 0.5 * ahead);
      kid(IMG.kidPast, at);
      this.drawMotes(ctx, live, vw, vw * 0.6, H * 0.4, 'rgba(255,236,170,', 0.8 + 0.4 * ahead);
      // the sunset grows warmer and brighter, as if looking ahead to a better time
      if (ahead > 0 && at) glow(ctx, at.x + SUN[0] * at.w, at.y + SUN[1] * at.h, 200 + 500 * ahead, `rgba(255,214,150,${0.45 * ahead})`);
      ctx.restore();
    }
    // the swirl itself, glowing over the seam
    if (this.swirlX != null && ready(IMG.swirl)) {
      const h = H * 1.25, w = h * IMG.swirl.naturalWidth / IMG.swirl.naturalHeight;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const col = ctx.createLinearGradient(sx - 260, 0, sx + 260, 0);
      col.addColorStop(0, 'rgba(255,220,150,0)'); col.addColorStop(0.5, 'rgba(255,225,160,0.32)'); col.addColorStop(1, 'rgba(255,220,150,0)');
      ctx.fillStyle = col; ctx.fillRect(sx - 260, 0, 520, H);
      for (let i = 0; i < 2; i++) {
        ctx.save();
        ctx.translate(sx + Math.sin(live * 2 + i) * 18, H / 2);
        ctx.rotate(Math.sin(live * 1.3 + i * 2) * 0.06 + (i ? 0.25 : -0.1));
        ctx.scale(i ? -1 : 1, 1);
        ctx.globalAlpha *= i ? 0.4 : 0.8;
        ctx.drawImage(IMG.swirl, -w / 2, -h / 2 - 20, w, h);
        ctx.restore();
      }
      ctx.restore();
    }
  }

  // ---- living details --------------------------------------------------------------------

  // Sheets of music and notes: out of the tube in shot 2, along the swirl in shot 3.
  updateParticles(dt) {
    const T = this.T, tube = T - SHOTS[1].start, travel = T - SHOTS[2].start;
    this.spawn -= dt;
    if (this.spawn <= 0) {
      if (tube > LID_POP + 0.2 && tube < SHOTS[1].dur - 1.5 && this.tubeTop) {
        const [x, y] = this.tubeTop;
        this.add(x + (Math.random() - 0.5) * 40, y - 20, (Math.random() - 0.5) * 160, -260 - Math.random() * 200, 0.22);
        this.spawn = 0.13;
      } else if (this.swirlX != null && travel > SWIRL[0] && travel < SWIRL[0] + SWIRL[1] - 0.6) {
        this.add(this.swirlX + (Math.random() - 0.5) * 200, H * (0.2 + Math.random() * 0.8), -320 - Math.random() * 200, -160 - Math.random() * 160, 0.3);
        this.spawn = 0.09;
      }
    }
    for (const q of this.particles) {
      q.age += dt;
      q.x += (q.vx + Math.sin(q.age * 3 + q.ph) * 70) * dt;
      q.y += q.vy * dt;
      q.vy *= 1 - 0.25 * dt;
      q.r += q.vr * dt;
    }
    this.particles = this.particles.filter(q => q.age < q.life);
  }

  add(x, y, vx, vy, size) {
    const paper = Math.random() < 0.55;
    const list = paper ? PAPERS : NOTES;
    this.particles.push({
      img: list[Math.floor(Math.random() * list.length)], x, y, vx, vy,
      r: (Math.random() - 0.5) * 1.2, vr: (Math.random() - 0.5) * 2.4, ph: Math.random() * 6,
      s: size * (paper ? 1 : 0.9) * (0.7 + Math.random() * 0.6), age: 0, life: 2.6 + Math.random() * 1.2,
    });
  }

  drawParticles(ctx) {
    for (const q of this.particles) {
      if (!ready(q.img)) continue;
      const a = smooth(q.age / 0.3) * (1 - smooth((q.age - q.life + 0.8) / 0.8));
      const w = q.img.naturalWidth * q.s, h = q.img.naturalHeight * q.s;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(q.x, q.y);
      ctx.rotate(q.r);
      // a paper turning in the air: squeeze it now and then
      ctx.scale(0.55 + 0.45 * Math.abs(Math.cos(q.age * 2 + q.ph)), 1);
      ctx.drawImage(q.img, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
  }
}
