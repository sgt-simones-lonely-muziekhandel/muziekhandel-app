// The story between the future and the past, played after the boy opens the crate on the
// future street. Three painted shots from public/art/intro, like a slow anime opening: every
// shot drifts and zooms a little, shots dissolve into each other, and small things keep moving
// (rain, dust in the light, the boy breathing, sheet music and notes flying).
//   1. crate   the crate in the rubble, closed; a golden flash and it is open
//   2. tube    the boy's hands lift a cylinder tube, the lid pops off, light and music pour out
//   3. travel  the flooded street; a swirl of light sweeps across and the past appears behind it,
//              then the camera drifts towards the sunset and the picture dissolves into the street
// The boy is seen from behind here and has no walk for that, so he only stands and breathes.
// A click, tap or ↑ / Enter / Space jumps to the next shot.

const ART = 'public/art/intro/';
const load = name => { const i = new Image(); i.src = `${ART}${name}.webp`; return i; };
const IMG = {
  crateClosed: load('crate-closed'), crateOpen: load('crate-open'),
  tubeBg: load('tube-background'), hands: load('hands-tube'), lid: load('tube-lid'),
  burst: load('light-burst'), swirl: load('swirl'),
  future: load('future-street'), futureFrame: load('future-frame'), past: load('past-street'),
  kidFuture: load('kid-back/future'), kidPast: load('kid-back/past'),
};
const PAPERS = [1, 2, 3, 4, 5, 6, 7].map(n => load(`flying/paper-${n}`));
const NOTES = [1, 2, 3, 4, 5, 6].map(n => load(`flying/note-${n}`));
const STRIP = (() => { const i = new Image(); i.src = 'public/art/ui/paper-strip.webp'; return i; })();

const H = 720;
const XF = 1.6;        // seconds two shots dissolve into each other
const EDGE = 1.6;      // fade in from black at the start
const OUT = 2.8;       // the last picture dissolves into the street
const INK = '#2a1d12';
// The opening of the tube in hands-tube.webp, in its own pixels.
const TUBE_TOP = [560, 70], TUBE_W = 265;
// Where the boy stands in the two street paintings (0–1 of the picture): on the quay bottom left,
// solid ground in both the future and the past. His height as a part of the picture's height.
const KID_AT = [0.3, 0.985], KID_H = 0.42;
// The setting sun in past-street.webp, where the camera drifts to at the end.
const SUN = [0.62, 0.56];

// Shots, in order. `captions` are [from, to, text] in seconds within the shot.
const SHOTS = [
  { key: 'crate', dur: 7, captions: [[1, 6.2, 'Tussen de puinhopen staat een oude kist…']] },
  { key: 'tube', dur: 7.5, captions: [[1.2, 6.4, 'Hij maakt een rol open… en de muziek begint.']] },
  { key: 'travel', dur: 12, captions: [[1.4, 5, '…en de wereld verandert…'], [5.6, 10, '…naar het verleden.']] },
];
let at = 0;
for (const s of SHOTS) { s.start = at; at += s.dur - XF; }
const TOTAL = SHOTS[SHOTS.length - 1].start + SHOTS[SHOTS.length - 1].dur;

const ready = img => img.complete && img.naturalWidth > 0;
const clamp = p => Math.max(0, Math.min(1, p));
const smooth = p => { p = clamp(p); return p * p * (3 - 2 * p); };
const ease = p => { p = clamp(p); return p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2; };
// 0 → 1 → 0: rises from a to b, stays, falls from c to d
const bump = (t, a, b, c, d) => (t < b ? smooth((t - a) / (b - a)) : t < c ? 1 : 1 - smooth((t - c) / (d - c)));

export class Story {
  constructor(game) {
    this.game = game;
    this.width = 1; // drawn in screen space; the camera doesn't move
    this.T = 0;
    this.particles = [];
    this.spawn = 0;
    this.done = false;
    const r = mulberry(11);
    this.rain = Array.from({ length: 160 }, () => [r(), r(), 12 + r() * 20, 0.9 + r() * 0.6]);
    this.motes = Array.from({ length: 40 }, () => [r(), r(), 1 + r() * 2.2, r() * 7, 0.3 + r() * 0.7]);
  }

  enter() {
    this.T = 0;
    this.particles = [];
    this.spawn = 0;
    this.done = false;
    this.game.setPlace('De tijdreis');
  }

  // skip ahead: start dissolving into the next shot now
  interact() {
    const i = this.shotAt(this.T);
    if (i < SHOTS.length - 1) this.T = Math.max(this.T, SHOTS[i + 1].start);
    else this.T = Math.max(this.T, TOTAL);
  }
  click() { this.interact(); }
  hover() { return true; }

  shotAt(T) {
    let i = 0;
    while (i < SHOTS.length - 1 && T >= SHOTS[i + 1].start + XF) i++;
    return i;
  }

  update(dt) {
    this.T += dt;
    if (this.T > SHOTS[2].start + SHOTS[2].dur) this.swirlX = null;
    this.updateParticles(dt);
    // the last picture dissolves slowly into the street, as if looking ahead to a better time
    if (this.T >= TOTAL && !this.done) { this.done = true; this.game.goTo('street', { dissolve: OUT }); }
  }

  draw(ctx, view) {
    const vw = view.viewW, T = this.T;
    ctx.save();
    ctx.setTransform(view.base);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, vw, H);
    // every shot that is on screen, the later one dissolving in over the earlier
    SHOTS.forEach((s, i) => {
      const t = T - s.start;
      if (t < 0 || t > s.dur) return;
      const a = i === 0 ? 1 : smooth(t / XF);
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      this[s.key](ctx, t, vw, s);
      ctx.restore();
    });
    this.drawParticles(ctx);
    // gold bloom between the tube and the time travel, like a white-out in a film
    const bloom = bump(T, SHOTS[1].start + 5.6, SHOTS[2].start + 0.3, SHOTS[2].start + 0.6, SHOTS[2].start + 2.2);
    if (bloom > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255,214,140,${0.85 * bloom})`;
      ctx.fillRect(0, 0, vw, H);
      ctx.globalCompositeOperation = 'source-over';
    }
    SHOTS.forEach(s => this.drawCaptions(ctx, T - s.start, s, vw));
    // soft fade in from black at the start
    const black = 1 - smooth(T / EDGE);
    if (black > 0) { ctx.fillStyle = `rgba(0,0,0,${black})`; ctx.fillRect(0, 0, vw, H); }
    ctx.restore();
  }

  // ---- the shots -------------------------------------------------------------------------

  // 1. The crate, seen from above. It sits closed, glowing through the cracks; a slow push in;
  // a golden flash and it lies open (the two paintings don't line up exactly, the flash hides it).
  crate(ctx, t, vw) {
    const zoom = 1.04 + 0.1 * ease(t / 7);
    const flash = bump(t, 2.6, 3.1, 3.2, 4.4);
    const img = t < 3.15 ? IMG.crateClosed : IMG.crateOpen;
    cover(ctx, img, vw, zoom, 0.5 + 0.02 * Math.sin(t * 0.3), 0.48);
    const cx = vw / 2, cy = H * 0.5;
    const pulse = 0.7 + 0.3 * Math.sin(t * 2.1);
    glow(ctx, cx, cy, 160 + 60 * pulse + 220 * flash, `rgba(255,200,110,${0.25 * pulse + (t > 3.1 ? 0.25 : 0)})`);
    this.drawMotes(ctx, t, vw, cx, cy, 'rgba(255,215,140,', 0.5 + (t > 3.1 ? 0.5 : 0));
    this.drawRain(ctx, t, vw, 0.18);
    if (flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,220,150,${0.9 * flash})`; ctx.fillRect(0, 0, vw, H); ctx.globalCompositeOperation = 'source-over'; }
  }

  // 2. The hands lift the tube into view, it rests a moment, the lid pops off and light pours out
  // with notes and sheets of music spiralling up.
  tube(ctx, t, vw) {
    cover(ctx, IMG.tubeBg, vw, 1.06 + 0.06 * ease(t / 7.5), 0.5, 0.6);
    ctx.fillStyle = 'rgba(8,10,18,0.25)'; ctx.fillRect(0, 0, vw, H);
    if (!ready(IMG.hands)) return;
    // the hands come in from the bottom-left corner: the left sleeve runs off the left edge,
    // the right one off the bottom, as if we look through the boy's eyes
    const hw = Math.min(vw * 0.62, 820), k = hw / IMG.hands.naturalWidth, hh = IMG.hands.naturalHeight * k;
    const rise = (1 - ease(t / 1.8)) * 300;
    const bob = Math.sin(t * 1.5) * 5 + Math.sin(t * 0.7) * 3;
    const hx = -hw * 0.04, hy = H - hh + 150 + rise + bob;
    const top = [hx + TUBE_TOP[0] * k, hy + TUBE_TOP[1] * k];
    this.tubeTop = top;
    const open = t - 2.8; // seconds since the lid came off
    // the light first, behind the hands, rising out of the tube
    if (open > 0 && ready(IMG.burst)) {
      const s = ease(open / 1.2), bw = 560 * s * (1 + 0.04 * Math.sin(t * 3)), bh = bw * IMG.burst.naturalHeight / IMG.burst.naturalWidth;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha *= 0.85 * s;
      ctx.drawImage(IMG.burst, top[0] - bw / 2, top[1] - bh * 0.92, bw, bh);
      ctx.restore();
    }
    glow(ctx, top[0], top[1], 120 + (open > 0 ? 160 * ease(open / 1) : 0), `rgba(255,205,120,${open > 0 ? 0.45 : 0.15})`);
    ctx.drawImage(IMG.hands, hx, hy, hw, hh);
    // the lid: on the tube, wobbling a little; then it pops up and tumbles away
    if (ready(IMG.lid)) {
      const lw = TUBE_W * k * 1.05, lh = lw * IMG.lid.naturalHeight / IMG.lid.naturalWidth;
      let x = top[0], y = top[1] - lh * 0.25, r = 0, a = 1;
      if (open < 0) r = Math.sin(t * 9) * 0.03 * smooth((t - 1.8) / 0.8);
      else { x += 330 * open; y += -520 * open + 420 * open * open; r = 2.6 * open; a = 1 - smooth((open - 0.6) / 0.6); }
      if (a > 0) {
        ctx.save();
        ctx.globalAlpha *= a;
        ctx.translate(x, y); ctx.rotate(r);
        ctx.drawImage(IMG.lid, -lw / 2, -lh / 2, lw, lh);
        ctx.restore();
      }
    }
    this.drawMotes(ctx, t, vw, top[0], top[1] - 100, 'rgba(255,220,150,', open > 0 ? 1 : 0.3);
  }

  // 3. The flooded street, the boy from behind on the quay. A swirl of light sweeps across from
  // right to left; behind it the same street appears in the past, and the boy's grey jacket turns
  // brown. Then the camera drifts slowly towards the setting sun while the light grows warmer.
  travel(ctx, t, vw) {
    const p = ease((t - 1.6) / 4.4);
    const sx = vw * 1.2 - p * vw * 1.45; // the swirl's x
    this.swirlX = p > 0 && p < 1 ? sx : null;
    const ahead = ease((t - 6) / 6); // looking ahead, after the swirl
    const zoom = 1.06 + 0.04 * ease(t / 6) + 0.22 * ahead;
    const fx = 0.5 + 0.03 * Math.sin(t * 0.2) + (SUN[0] - 0.5) * ahead, fy = 0.45 + (SUN[1] - 0.45) * ahead;
    const kid = (img, at) => {
      if (!ready(img) || !at) return;
      // pinned to the painting, so he stays on the quay while the camera moves
      const kh = at.h * KID_H, kw = kh * img.naturalWidth / img.naturalHeight;
      const x = at.x + KID_AT[0] * at.w, y = Math.min(H - 6, at.y + KID_AT[1] * at.h);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, 1 + 0.008 * Math.sin(t * 2.2)); // breathing
      ctx.fillStyle = 'rgba(10,8,6,0.3)';
      ctx.beginPath(); ctx.ellipse(0, -4, kw * 0.45, kh * 0.025, 0, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(img, -kw / 2, -kh, kw, kh);
      ctx.restore();
    };
    // the future, left of the swirl
    if (sx > 0) {
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, sx, H); ctx.clip();
      kid(IMG.kidFuture, cover(ctx, IMG.future, vw, zoom, fx, fy));
      if (ready(IMG.futureFrame)) {
        // dark vines in front, drifting a little more than the street for depth
        ctx.drawImage(IMG.futureFrame, -vw * 0.06 + Math.sin(t * 0.25) * 10, -H * 0.06, vw * 1.12, H * 1.12);
      }
      this.drawRain(ctx, t, vw, 0.3);
      ctx.restore();
    }
    // the past, right of the swirl
    if (sx < vw) {
      ctx.save();
      ctx.beginPath(); ctx.rect(sx, 0, vw - sx, H); ctx.clip();
      const at = cover(ctx, IMG.past, vw, zoom, fx, fy);
      sunBeams(ctx, vw, t, 0.5 + 0.5 * ahead);
      kid(IMG.kidPast, at);
      this.drawMotes(ctx, t, vw, vw * 0.6, H * 0.4, 'rgba(255,236,170,', 0.8 + 0.4 * ahead);
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
        ctx.translate(sx + Math.sin(t * 2 + i) * 18, H / 2);
        ctx.rotate(Math.sin(t * 1.3 + i * 2) * 0.06 + (i ? 0.25 : -0.1));
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
      if (tube > 3 && tube < 7 && this.tubeTop) {
        const [x, y] = this.tubeTop;
        this.add(x + (Math.random() - 0.5) * 40, y - 20, (Math.random() - 0.5) * 160, -260 - Math.random() * 200, 0.22);
        this.spawn = 0.13;
      } else if (this.swirlX != null && travel > 1.6 && travel < 6) {
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

  // Specks of dust floating slowly in the light around (cx, cy).
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

  // Captions on a strip of old paper, bottom right (clear of the boy and his hands), fading in and out.
  drawCaptions(ctx, t, shot, vw) {
    for (const [from, to, text] of shot.captions) {
      const a = bump(t, from, from + 0.8, to - 0.8, to);
      if (a <= 0) continue;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font = '600 38px Caveat, "Comic Sans MS", cursive';
      const tw = ctx.measureText(text).width, w = tw + 90, h = 84;
      const x = vw - w - Math.max(24, vw * 0.06), y = H - h - 34 - (1 - a) * 8;
      if (ready(STRIP)) ctx.drawImage(STRIP, x, y, w, h);
      else { ctx.fillStyle = '#f4e9d7'; ctx.fillRect(x, y, w, h); }
      ctx.fillStyle = INK; ctx.textBaseline = 'middle';
      ctx.fillText(text, x + 45, y + h / 2 + 2);
      ctx.restore();
    }
  }
}

// Draw a 16:9 painting so it covers the screen, zoomed around (fx, fy) (0–1 of the picture).
// Returns where it went, to pin things to the painting.
function cover(ctx, img, vw, zoom, fx, fy) {
  if (!ready(img)) return;
  const s = Math.max(vw / img.naturalWidth, H / img.naturalHeight) * zoom;
  const w = img.naturalWidth * s, h = img.naturalHeight * s;
  const x = Math.min(0, Math.max(vw - w, vw / 2 - fx * w));
  const y = Math.min(0, Math.max(H - h, H / 2 - fy * h));
  ctx.drawImage(img, x, y, w, h);
  return { x, y, w, h };
}

function glow(ctx, x, y, r, rgba) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 4, x, y, r);
  g.addColorStop(0, rgba); g.addColorStop(1, 'rgba(255,200,110,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

// Soft slanting beams of sunlight, slowly breathing.
function sunBeams(ctx, vw, t, strength) {
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

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
