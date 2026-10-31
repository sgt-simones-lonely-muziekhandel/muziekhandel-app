// The start of the game: the same canal quay as the street, far in the future. Built from the
// painted layers in public/art/future-street (sky, far, walk, foreground) with parallax, a
// drifting storm sky, rain, now and then distant lightning, and the flooded canal rippling.
// The shop is boarded up behind the flood, so the player can't go in; instead a glowing crate
// with phonograph cylinders and sheet music stands on the quay. Clicking it starts the story
// (js/story.js), which ends in the past.
import { Boy } from './boy.js';
import { thunder, loadThunder, rain } from './sfx.js';

const ART = 'public/art/future-street/';
const load = name => { const i = new Image(); i.src = `${ART}${name}.webp`; return i; };
const SKY = load('sky'), FAR = load('far'), WALK = load('walk'), FG = load('foreground');
const CRATE = load('crate');

const LAYER_W = 2172, LAYER_H = 724;
const K = 720 / LAYER_H;             // layer pixels → world units
const W = Math.round(LAYER_W * K);   // 2160
const FOOT_Y = 574;                  // the quay in walk.webp
const FAR_PARALLAX = 0.6;
const INK = '#1d1510';

// Places in world units, measured on walk.webp. Right of WALK_MAX the quay is under water.
const START_X = 560, WALK_MAX = 1450;
const CRATE_X = 1415, CRATE_W = 150;           // centre of the crate, standing on the quay
const CRATE_H = CRATE_W * 651 / 1024;
const CRATE_STAND = CRATE_X - 105;             // where the boy stands to open it
const CRATE_BOX = { x0: CRATE_X - CRATE_W / 2 - 10, x1: CRATE_X + CRATE_W / 2 + 10, y0: FOOT_Y - CRATE_H - 40, y1: FOOT_Y + 10 };
// Canal water in walk.webp, in layer pixels: along the front of the quay, and the flooded street
// in front of the shop (right of FLOOD_X0).
const WATER_TOP = 640, FLOOD_X0 = 1500, FLOOD_TOP = 548, FLOOD_BOTTOM = 600;
// Opening the crate: the glow swells, then the story takes over.
const OPEN_TIME = 1.4;

const ready = img => img.complete && img.naturalWidth > 0;
const smooth = p => { p = Math.max(0, Math.min(1, p)); return p * p * (3 - 2 * p); };

export class FutureStreet {
  constructor(game) {
    this.game = game;
    this.width = W;
    this.boy = new Boy(START_X, 'kid-future');
    this.boy.ground = 'wet';
    this.time = 0;
    this.hoverCrate = false;
    this.opening = null; // { t } while the crate opens
    this.flash = 0;      // lightning, 1 at the strike, fading out
    this.nextFlash = 6;
    const r = mulberry(7);
    // rain drops in screen space (0–1): x, y, length, speed
    this.rain = Array.from({ length: 220 }, () => [r(), r(), 14 + r() * 22, 0.9 + r() * 0.6]);
    // glints of the last light on the water: x, y, length, phase, speed
    this.glints = Array.from({ length: 50 }, () => [r() * W, 648 + r() * 68, 6 + r() * 14, r() * 7, 0.5 + r() * 1.2]);
  }

  enter() {
    this.boy.x = START_X;
    this.boy.dir = 1;
    this.boy.target = null;
    this.opening = null;
    this.nextRumble = 12 + Math.random() * 15;
    loadThunder();
    this.game.setPlace('De toekomst');
  }

  get nearCrate() { return Math.abs(this.boy.x - CRATE_STAND) < 70; }

  interact() {
    if (this.nearCrate && !this.opening) this.boy.walkTo(CRATE_STAND, () => this.openCrate());
  }

  click(wx, wy) {
    if (this.opening) return;
    if (this.isCrate(wx, wy)) this.boy.walkTo(CRATE_STAND, () => this.openCrate());
    else this.boy.walkTo(Math.max(90, Math.min(WALK_MAX, wx)));
  }

  hover(wx, wy) {
    this.hoverCrate = !this.opening && this.isCrate(wx, wy);
    return this.hoverCrate;
  }

  isCrate(wx, wy) {
    const b = CRATE_BOX;
    return wx > b.x0 && wx < b.x1 && wy > b.y0 && wy < b.y1;
  }

  openCrate() {
    this.boy.dir = 1;
    this.opening = { t: 0 };
  }

  update(dt, input) {
    this.time += dt;
    if (this.opening) {
      this.boy.update(dt, { left: false, right: false }, this.boy.x, this.boy.x);
      this.opening.t += dt;
      // then the story takes over: the crate, the cylinder, the time travel (js/story.js)
      if (this.opening.t >= OPEN_TIME && !this.opening.done) { this.opening.done = true; this.game.goTo('story'); }
    } else {
      this.boy.update(dt, input, 90, WALK_MAX);
    }
    // lightning far away, every 8–20 seconds
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.nextFlash -= dt;
    if (this.nextFlash <= 0) {
      this.flash = 1;
      this.nextFlash = 8 + Math.random() * 12;
      thunder(0.6 + Math.random() * 1.4); // far away, so the rumble comes a moment later
    }
    // now and then a rumble from further away, without a flash
    this.nextRumble -= dt;
    if (this.nextRumble <= 0) { thunder(0, 0.5); this.nextRumble = 20 + Math.random() * 20; }
    rain(1);
  }

  draw(ctx, view) {
    this.drawSky(ctx, view);
    this.layer(ctx, view, FAR_PARALLAX, () => {
      if (ready(FAR)) ctx.drawImage(FAR, 0, 0, W, 720);
    });
    this.layer(ctx, view, 1, () => {
      if (ready(WALK)) {
        ctx.drawImage(WALK, 0, 0, W, 720);
        this.drawWater(ctx);
      }
      this.drawCrate(ctx);
      this.drawHint(ctx);
      // the boy in the same cold, dim light as the painting
      ctx.save();
      ctx.filter = 'brightness(0.9) saturate(0.85)';
      this.boy.draw(ctx, FOOT_Y, 165);
      ctx.restore();
      if (ready(FG)) ctx.drawImage(FG, 0, 0, W, 720);
    });
    this.drawRain(ctx, view);
    this.drawFlash(ctx, view);
  }

  layer(ctx, view, factor, fn) {
    ctx.save();
    ctx.setTransform(view.base);
    ctx.translate(-view.camX * factor, 0);
    fn();
    ctx.restore();
  }

  // The painted storm sky covers the view, sliding a little with the camera and drifting slowly.
  drawSky(ctx, view) {
    const vw = view.viewW;
    ctx.save();
    ctx.setTransform(view.base);
    ctx.fillStyle = '#2a2f3a';
    ctx.fillRect(0, 0, vw, 720);
    if (ready(SKY)) {
      const s = Math.max(vw * 1.15 / SKY.naturalWidth, 720 / SKY.naturalHeight);
      const w = SKY.naturalWidth * s, h = SKY.naturalHeight * s;
      const slide = Math.max(0, Math.min(1, view.camX / W)) * 0.7 + 0.15 * (0.5 + 0.5 * Math.sin(this.time * 0.03));
      ctx.drawImage(SKY, -(w - vw) * slide, 0, w, h);
    }
    ctx.restore();
  }

  // The canal: each thin row of painted water is drawn again shifted sideways by a slow wave,
  // stronger towards the front, so the reflections wobble (as on the street). Here the flooded
  // street in front of the shop moves too.
  drawWater(ctx) {
    const t = this.time;
    const rows = (y0, y1, x0, x1, strength) => {
      for (let y = y0; y < y1; y += 2) {
        const depth = (y - y0) / (y1 - y0);
        const amp = strength * (0.3 + 3 * depth * depth);
        const off = amp * (Math.sin(y * 0.35 + t * 1.7) + 0.5 * Math.sin(y * 0.13 - t * 1.1));
        ctx.drawImage(WALK, x0, y, x1 - x0, 2, x0 * K + off * K, y * K, (x1 - x0) * K, 2 * K);
      }
    };
    rows(WATER_TOP, LAYER_H, 0, LAYER_W, 1);
    rows(FLOOD_TOP, FLOOD_BOTTOM, FLOOD_X0, LAYER_W, 0.5);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const [x, y, len, ph, sp] of this.glints) {
      const a = Math.max(0, Math.sin(t * sp + ph)) ** 4;
      if (a < 0.02) continue;
      ctx.fillStyle = `rgba(255,170,110,${a * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(x + Math.sin(t * 0.4 + ph) * 8, y, len * (0.6 + 0.4 * a), 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // The crate is the only warm thing in the cold street: a soft golden glow breathes around it,
  // and swells when the boy opens it.
  drawCrate(ctx) {
    const open = this.opening ? smooth(this.opening.t / OPEN_TIME) : 0;
    const pulse = 0.75 + 0.25 * Math.sin(this.time * 2.2);
    const cx = CRATE_X, cy = FOOT_Y - CRATE_H * 0.45;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const r = 110 + 60 * pulse + 600 * open;
    const g = ctx.createRadialGradient(cx, cy, 6, cx, cy, r);
    g.addColorStop(0, `rgba(255,205,120,${0.35 * pulse + 0.6 * open})`);
    g.addColorStop(1, 'rgba(255,190,100,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
    if (ready(CRATE)) {
      // shadow on the wet stones, then the crate
      ctx.fillStyle = 'rgba(10,8,6,0.35)';
      ctx.beginPath(); ctx.ellipse(cx, FOOT_Y - 2, CRATE_W * 0.55, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(CRATE, cx - CRATE_W / 2, FOOT_Y - CRATE_H + 4, CRATE_W, CRATE_H);
    }
  }

  // A bouncing arrow over the crate so even the youngest players know where to go; a label when
  // the boy is close or the pointer is over it (same look as the shop door hint on the street).
  drawHint(ctx) {
    if (this.opening) return;
    const near = this.nearCrate;
    const y = FOOT_Y - CRATE_H - 70 + Math.sin(this.time * 3) * 6;
    ctx.save();
    if (!near && !this.hoverCrate) {
      ctx.translate(CRATE_X, y);
      ctx.beginPath();
      ctx.moveTo(-16, -22); ctx.lineTo(16, -22); ctx.lineTo(16, 0); ctx.lineTo(28, 0);
      ctx.lineTo(0, 26); ctx.lineTo(-28, 0); ctx.lineTo(-16, 0); ctx.closePath();
      ctx.fillStyle = '#f2c76b'; ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.restore();
      return;
    }
    const label = near ? '↑  Open de kist' : 'Een oude kist';
    ctx.font = '800 20px "Nunito Sans", sans-serif';
    const tw = ctx.measureText(label).width + 36;
    ctx.translate(CRATE_X, y);
    ctx.beginPath();
    ctx.moveTo(-tw / 2, -22); ctx.lineTo(tw / 2, -22); ctx.lineTo(tw / 2, 22);
    ctx.lineTo(10, 22); ctx.lineTo(0, 34); ctx.lineTo(-10, 22);
    ctx.lineTo(-tw / 2, 22); ctx.closePath();
    ctx.fillStyle = '#f4e9d7'; ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 1);
    ctx.restore();
  }

  // Rain falls in screen space, slanted by the wind, in front of everything.
  drawRain(ctx, view) {
    const vw = view.viewW, t = this.time;
    ctx.save();
    ctx.setTransform(view.base);
    ctx.strokeStyle = 'rgba(190,205,225,0.28)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (const [x, y, len, sp] of this.rain) {
      const py = ((y + t * sp * 1.1) % 1) * 760 - 20;
      const px = ((x + t * sp * 0.12 + view.camX / vw * 0.3) % 1) * (vw + 60) - 30;
      ctx.moveTo(px, py);
      ctx.lineTo(px - len * 0.22, py + len);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Distant lightning: the whole picture lights up cold for a moment.
  drawFlash(ctx, view) {
    if (this.flash <= 0) return;
    // a double flicker: bright, a dip, bright again, then fading
    const f = this.flash, a = f > 0.8 ? f : f > 0.65 ? f * 0.3 : f * 0.8;
    ctx.save();
    ctx.setTransform(view.base);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(170,185,220,${0.22 * a})`;
    ctx.fillRect(0, 0, view.viewW, 720);
    ctx.restore();
  }
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
