// Outside: a canal quay in Amsterdam around 1900, built from the painted layers in
// public/art/past-street (sky, far, walk, foreground) with parallax, a real-time sky,
// rippling canal water, flickering gas lamps, night lighting and cyclists.
import { Boy } from './boy.js';
import { skyAt, currentHour } from './sky.js';
import { Cyclist } from './cyclist.js';

const ART = 'public/art/past-street/';
const load = name => { const i = new Image(); i.src = `${ART}${name}.webp`; return i; };
const SKY = load('sky'), FAR = load('far'), WALK = load('walk'), FG = load('foreground');

const LAYER_W = 2172, LAYER_H = 724;
const K = 720 / LAYER_H;             // layer pixels → world units
const W = Math.round(LAYER_W * K);   // 2160
const FOOT_Y = 556;                  // the pavement in walk.webp, along the railing
const SHOP_FOOT_Y = 570;             // in front of the shop the pavement runs lower, along the shop front
const BIKE_Y = 574;
const FAR_PARALLAX = 0.6;
const INK = '#1d1510';

// Places in world units, measured on walk.webp.
export const DOOR_X = 2072;
const DOOR_SILL = 554;  // the doorstep, where the boy disappears inside
// The shop door's panel in world units (measured on walk.webp); it hangs on its right edge.
const DOOR = { x0: 2025, x1: 2120, y0: 316, y1: 556 };
// Going in: the door swings open, the boy steps over the threshold into the warm light, the door
// closes behind him. Coming out plays the same timeline backwards.
const DOOR_OPEN = 0.5, DOOR_WALK = 1.0, DOOR_CLOSE = 0.45;
const DOOR_TIME = DOOR_OPEN + DOOR_WALK + DOOR_CLOSE;
const smooth = p => { p = Math.max(0, Math.min(1, p)); return p * p * (3 - 2 * p); };
const SHOP = { x0: 1640, x1: W, y0: 130, y1: 565 };
const LAMPS = [[60, 214], [1348, 210]];
// Gas lamps on the far side of the canal, in far.webp layer pixels.
const FAR_LAMPS = [[89, 322], [680, 378], [817, 385], [939, 385], [1739, 359], [2122, 178]];
// Canal water at the bottom of walk.webp, in layer pixels. Right of WATER_X0 the stone steps
// go down into the water, so there only the rows below WATER_STEPS ripple.
const WATER_TOP = 640, WATER_X0 = 1700, WATER_STEPS = 704;
const SHOP_LIGHTS = [[1712, 262, 262, 192], [2040, 258, 74, 62], [1735, 0, 420, 112]];

const ready = img => img.complete && img.naturalWidth > 0;

export class Street {
  constructor(game) {
    this.game = game;
    this.width = W;
    this.boy = new Boy(1150);
    this.cyclists = [];
    this.nextCyclist = 4;
    this.time = 0;
    this.hoverDoor = false;
    this.door = null; // { t, dir: 1 going in, -1 coming out } while stepping through the shop door
    const r = mulberry(42);
    this.stars = Array.from({ length: 90 }, () => [r(), r() * 0.55, 0.5 + r() * 1.3, r() * 6]);
    // glints of light on the water: x, y, length, phase, speed
    this.glints = Array.from({ length: 70 }, () => [r() * W, 650 + r() * 66, 6 + r() * 16, r() * 7, 0.6 + r() * 1.4]);
  }

  enter(from) {
    this.boy.x = from === 'shop' ? DOOR_X : 1150;
    this.boy.dir = from === 'shop' ? -1 : 1;
    this.boy.target = null;
    this.door = from === 'shop' ? { t: 0, dir: -1 } : null;
    this.cyclists = [];
    this.nextCyclist = 4;
    this.game.setPlace('Amsterdam, 1900');
  }

  get nearDoor() { return Math.abs(this.boy.x - DOOR_X) < 70; }

  interact() {
    if (this.nearDoor && !this.door) this.boy.walkTo(DOOR_X, () => this.goInside());
  }

  click(wx, wy) {
    if (this.door) return;
    if (this.isDoor(wx, wy)) this.boy.walkTo(DOOR_X, () => this.goInside());
    else this.boy.walkTo(Math.max(90, Math.min(W - 50, wx)));
  }

  goInside() {
    this.door = { t: 0, dir: 1 };
  }

  // The pavement: along the railing, then lower in front of the shop.
  footAt(x) {
    const k = Math.max(0, Math.min(1, (x - 1640) / 140));
    return FOOT_Y + (SHOP_FOOT_Y - FOOT_Y) * k * k * (3 - 2 * k);
  }

  hover(wx, wy) {
    this.hoverDoor = this.isDoor(wx, wy);
    return this.hoverDoor;
  }

  isDoor(wx, wy) {
    return wx > SHOP.x0 && wx < SHOP.x1 && wy > SHOP.y0 && wy < SHOP.y1;
  }

  update(dt, input) {
    this.time += dt;
    if (this.door) {
      // going through the door: no other input; the boy walks on the spot only while he steps through
      const { walk } = this.doorState();
      if (walk > 0 && walk < 1) this.boy.march(dt);
      else this.boy.update(dt, { left: false, right: false }, this.boy.x, this.boy.x);
      this.door.t += dt;
      if (this.door.t >= DOOR_TIME) {
        // going in: stay hidden while the screen fades to the shop
        if (this.door.dir < 0) this.door = null;
        else if (!this.door.done) { this.door.done = true; this.game.goTo('shop'); }
      }
    } else {
      this.boy.update(dt, input, 90, W - 50);
    }
    // Cyclists only show up while the player is idle.
    const cam = this.game.camX, vw = this.game.viewW;
    if (this.game.idleTime > 4) {
      this.nextCyclist -= dt;
      if (this.nextCyclist <= 0 && this.cyclists.length < 2) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        this.cyclists.push(new Cyclist(dir, dir > 0 ? cam - 160 : cam + vw + 160));
        this.nextCyclist = 5 + Math.random() * 5;
      }
    } else {
      this.nextCyclist = Math.max(this.nextCyclist, 1.5);
    }
    for (const c of this.cyclists) c.update(dt);
    this.cyclists = this.cyclists.filter(c => c.x > cam - 400 && c.x < cam + vw + 400);
  }

  draw(ctx, view) {
    const { camX, viewW } = view;
    const sky = skyAt(currentHour());
    this.drawSky(ctx, view, sky);

    // far canal view, slower than the quay
    this.layer(ctx, view, FAR_PARALLAX, () => {
      if (ready(FAR)) ctx.drawImage(nightTinted(FAR, sky.dark), 0, 0, W, 720);
      this.drawFarLamps(ctx, sky);
    });

    this.layer(ctx, view, 1, () => {
      if (ready(WALK)) {
        ctx.drawImage(nightTinted(WALK, sky.dark), 0, 0, W, 720);
        this.drawWater(ctx, sky);
      }
      this.drawLights(ctx, sky);
      this.drawDoor(ctx, sky);
      this.drawDoorHint(ctx);
      ctx.save();
      if (sky.dark > 0) ctx.filter = `brightness(${1 - sky.dark * 0.3})`;
      this.drawBoy(ctx);
      for (const c of this.cyclists) c.draw(ctx, BIKE_Y);
      ctx.restore();
      // silhouettes framing the scene, Valiant Hearts style
      if (ready(FG)) ctx.drawImage(FG, 0, 0, W, 720);
    });
  }

  // Where we are in the door timeline: how far the door is open (0–1) and how far the boy has
  // stepped through (0 on the pavement, 1 inside). Coming out runs it backwards.
  doorState() {
    if (!this.door) return { open: 0, walk: 0 };
    const t = this.door.dir > 0 ? this.door.t : DOOR_TIME - this.door.t;
    const open = t < DOOR_OPEN ? smooth(t / DOOR_OPEN)
      : t < DOOR_OPEN + DOOR_WALK ? 1 : 1 - smooth((t - DOOR_OPEN - DOOR_WALK) / DOOR_CLOSE);
    return { open, walk: smooth((t - DOOR_OPEN) / DOOR_WALK) };
  }

  // The door swings inwards on its right-hand hinges: the warm shop shows behind it, the panel
  // narrows towards the hinges and darkens as it turns away, and light falls out onto the pavement.
  drawDoor(ctx, sky) {
    const { open } = this.doorState();
    if (open <= 0.001 || !ready(WALK)) return;
    const { x0, x1, y0, y1 } = DOOR, w = x1 - x0, h = y1 - y0;
    // inside: the lit shop
    const inside = ctx.createLinearGradient(0, y0, 0, y1);
    inside.addColorStop(0, '#f6cf86'); inside.addColorStop(0.55, '#d79a52'); inside.addColorStop(1, '#6e4122');
    ctx.fillStyle = inside;
    ctx.fillRect(x0, y0, w, h);
    // light on the pavement in front of the door
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const pool = ctx.createRadialGradient((x0 + x1) / 2, y1 + 6, 4, (x0 + x1) / 2, y1 + 6, 120);
    pool.addColorStop(0, `rgba(255,200,120,${(0.18 + 0.3 * sky.dark) * open})`); pool.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = pool;
    ctx.beginPath(); ctx.ellipse((x0 + x1) / 2, y1 + 8, 120, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // the door panel, cut from the street picture, turning about its hinges
    const a = open * 1.25; // up to ~72°
    const pw = w * Math.cos(a);
    ctx.save();
    ctx.drawImage(nightTinted(WALK, sky.dark), x0 / K, y0 / K, w / K, h / K, x1 - pw, y0, pw, h);
    ctx.fillStyle = `rgba(20,12,6,${0.45 * Math.sin(a)})`;
    ctx.fillRect(x1 - pw, y0, pw, h);
    ctx.restore();
  }

  // Through the door: the boy steps up onto the threshold, gets a little smaller as he goes in,
  // his feet disappear behind the threshold and he fades into the lit room.
  drawBoy(ctx) {
    const foot = this.footAt(this.boy.x);
    if (!this.door) { this.boy.draw(ctx, foot, 165); return; }
    const e = this.doorState().walk;
    if (e >= 1) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(DOOR.x0 - 60, 0, DOOR.x1 - DOOR.x0 + 120, 640 + (DOOR.y1 - 640) * smooth(e * 1.6));
    ctx.clip();
    ctx.globalAlpha *= 1 - smooth((e - 0.55) / 0.45);
    this.boy.draw(ctx, foot + (DOOR_SILL + 6 - foot) * smooth(e * 1.4), 165 * (1 - 0.16 * e));
    ctx.restore();
  }

  layer(ctx, view, factor, fn) {
    ctx.save();
    ctx.setTransform(view.base);
    ctx.translate(-view.camX * factor, 0);
    fn();
    ctx.restore();
  }

  // Real-time sky: a colour gradient for the hour, with the painted sky on top. Around sunrise
  // and sunset the painting shows as it is; by day and night it only lends its clouds, blended
  // into the gradient, so the sky still matches the real time.
  drawSky(ctx, view, sky) {
    const vw = view.viewW;
    ctx.save();
    ctx.setTransform(view.base);
    const g = ctx.createLinearGradient(0, 0, 0, 520);
    g.addColorStop(0, sky.top); g.addColorStop(1, sky.horizon);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, vw, 720);
    this.drawSkyBodies(ctx, sky, vw);
    if (ready(SKY)) {
      // cover the view, sliding a little with the camera
      const s = Math.max(vw * 1.1 / SKY.naturalWidth, 720 / SKY.naturalHeight);
      const w = SKY.naturalWidth * s, h = SKY.naturalHeight * s;
      const x = -(w - vw) * Math.max(0, Math.min(1, view.camX / W));
      const night = sky.dark > 0.5;
      ctx.globalCompositeOperation = night ? 'luminosity' : 'soft-light';
      ctx.globalAlpha = (1 - sky.painted) * (night ? 0.3 : 0.8);
      ctx.drawImage(SKY, x, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = sky.painted;
      ctx.drawImage(SKY, x, 0, w, h);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  drawSkyBodies(ctx, sky, vw) {
    if (sky.dark > 0.25) {
      ctx.fillStyle = '#fff8e0';
      for (const [x, y, s, ph] of this.stars) {
        ctx.globalAlpha = (sky.dark - 0.25) * (0.55 + 0.45 * Math.sin(this.time * 1.5 + ph));
        ctx.fillRect(x * vw, y * 480, s, s);
      }
      ctx.globalAlpha = 1;
    }
    const arc = t => [vw * (0.1 + 0.8 * t), 380 - Math.sin(Math.PI * t) * 320];
    const disc = (t, r, glowCol, fill) => {
      const [x, y] = arc(t);
      const glow = ctx.createRadialGradient(x, y, 8, x, y, r * 4.5);
      glow.addColorStop(0, glowCol); glow.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = glow; ctx.fillRect(x - r * 4.5, y - r * 4.5, r * 9, r * 9);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = fill; ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
      return [x, y];
    };
    if (sky.sun != null) disc(sky.sun, 30, 'rgba(255,230,160,0.7)', '#fbe3a1');
    if (sky.moon != null) {
      const [x, y] = disc(sky.moon, 22, 'rgba(230,235,255,0.35)', '#efeedd');
      ctx.beginPath(); ctx.arc(x + 9, y - 5, 18, 0, Math.PI * 2);
      ctx.fillStyle = sky.top; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
    }
  }

  // The canal: each thin row of painted water is drawn again shifted sideways by a slow wave,
  // stronger towards the front, so the reflections wobble. Glints of light come and go on top.
  drawWater(ctx, sky) {
    const src = nightTinted(WALK, sky.dark), t = this.time;
    for (let y = WATER_TOP; y < LAYER_H; y += 2) {
      const depth = (y - WATER_TOP) / (LAYER_H - WATER_TOP);
      const amp = 0.3 + 3.4 * depth * depth;
      const off = amp * (Math.sin(y * 0.35 + t * 2.1) + 0.5 * Math.sin(y * 0.13 - t * 1.3));
      const sw = y >= WATER_STEPS ? LAYER_W : WATER_X0;
      ctx.drawImage(src, 0, y, sw, 2, off * K, y * K, sw * K, 2 * K);
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const warm = sky.dark > 0.4;
    for (const [x, y, len, ph, sp] of this.glints) {
      const a = Math.max(0, Math.sin(t * sp + ph)) ** 4;
      if (a < 0.02) continue;
      ctx.fillStyle = warm ? `rgba(255,200,120,${a * 0.35})` : `rgba(255,250,225,${a * 0.5})`;
      ctx.beginPath();
      ctx.ellipse(x + Math.sin(t * 0.4 + ph) * 8, y, len * (0.6 + 0.4 * a), 1.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Gas lamps flicker a little, each in its own rhythm, with now and then a short dip.
  flicker(i) {
    const t = this.time + i * 7.3;
    const dip = Math.sin(t * 0.7) > 0.985 ? 0.25 : 0;
    return 0.86 + 0.07 * Math.sin(t * 11.3) + 0.05 * Math.sin(t * 23.7 + i) + 0.03 * Math.sin(t * 41) - dip;
  }

  // By day the lamps glow softly; in the evening they light up the quay and the water.
  lampLevel(sky) {
    return sky.lampsOn ? 0.3 + 0.7 * Math.min(1, (sky.dark - 0.3) / 0.4) : 0.3;
  }

  drawFarLamps(ctx, sky) {
    const lv = this.lampLevel(sky);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    FAR_LAMPS.forEach(([lx, ly], i) => {
      const x = lx * K, y = ly * K, f = this.flicker(i + 5), r = (18 + 22 * lv) * f;
      const g = ctx.createRadialGradient(x, y, 1, x, y, r);
      g.addColorStop(0, `rgba(255,220,140,${0.6 * lv * f})`); g.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    });
    ctx.restore();
  }

  drawLights(ctx, sky) {
    const lv = this.lampLevel(sky);
    const a = sky.lampsOn ? Math.min(1, (sky.dark - 0.3) / 0.4) : 0;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    LAMPS.forEach(([x, y], i) => {
      const f = this.flicker(i);
      // the flame: a small bright core in the glass
      const core = ctx.createRadialGradient(x, y, 1, x, y, 30);
      core.addColorStop(0, `rgba(255,236,180,${0.7 * f * (0.4 + 0.6 * lv)})`); core.addColorStop(1, 'rgba(255,210,130,0)');
      ctx.fillStyle = core; ctx.fillRect(x - 30, y - 30, 60, 60);
      // the halo around it
      const r = (60 + 150 * lv) * (0.94 + 0.06 * f);
      const gg = ctx.createRadialGradient(x, y, 5, x, y, r);
      gg.addColorStop(0, `rgba(255,214,130,${0.55 * lv * f})`); gg.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = gg; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      if (a <= 0) return;
      // pool of light on the pavement
      const pool = ctx.createRadialGradient(x, FOOT_Y, 4, x, FOOT_Y, 150);
      pool.addColorStop(0, `rgba(255,210,130,${0.3 * a * f})`); pool.addColorStop(1, 'rgba(255,210,130,0)');
      ctx.fillStyle = pool; ctx.fillRect(x - 150, FOOT_Y - 150, 300, 300);
      // its reflection in the canal: a wobbling column of short strokes
      for (let wy = 652; wy < 720; wy += 5) {
        const d = (wy - 652) / 68;
        const w = (8 + 20 * d) * (0.6 + 0.4 * Math.sin(this.time * 3 + wy * 0.4 + i));
        const wx = x + Math.sin(this.time * 2 + wy * 0.3) * 4 * d;
        ctx.fillStyle = `rgba(255,205,120,${0.45 * a * f * (1 - d * 0.6)})`;
        ctx.fillRect(wx - w / 2, wy, w, 2);
      }
    });
    for (const [x, y, w, h] of SHOP_LIGHTS) {
      if (a <= 0) break;
      const cx = x + w / 2, cy = y + h / 2, r = Math.max(w, h);
      const gg = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
      gg.addColorStop(0, `rgba(246,200,110,${0.35 * a})`); gg.addColorStop(1, 'rgba(246,200,110,0)');
      ctx.fillStyle = gg; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    ctx.restore();
  }

  drawDoorHint(ctx) {
    const near = this.nearDoor;
    const y = 280 + Math.sin(this.time * 3) * 6;
    if (this.door) return;
    if (!near && !this.hoverDoor) {
      // bouncing arrow over the shop door so even the youngest players know where to go
      ctx.save();
      ctx.translate(DOOR_X, y);
      ctx.beginPath();
      ctx.moveTo(-16, -22); ctx.lineTo(16, -22); ctx.lineTo(16, 0); ctx.lineTo(28, 0);
      ctx.lineTo(0, 26); ctx.lineTo(-28, 0); ctx.lineTo(-16, 0); ctx.closePath();
      ctx.fillStyle = '#f2c76b'; ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.restore();
      return;
    }
    const label = near ? '↑  Naar binnen' : 'Muziekwinkel';
    ctx.font = '800 20px "Nunito Sans", sans-serif';
    const tw = ctx.measureText(label).width + 36;
    const x = Math.min(DOOR_X, W - tw / 2 - 8);
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(-tw / 2, -22); ctx.lineTo(tw / 2, -22); ctx.lineTo(tw / 2, 22);
    ctx.lineTo(DOOR_X - x + 10, 22); ctx.lineTo(DOOR_X - x, 34); ctx.lineTo(DOOR_X - x - 10, 22);
    ctx.lineTo(-tw / 2, 22); ctx.closePath();
    ctx.fillStyle = '#f4e9d7'; ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 1);
    ctx.restore();
  }
}

// A painted layer darkened and tinted blue for the evening, only where the layer has pixels.
// Cached per image and redrawn only when the darkness changes noticeably.
const tintCache = new Map();
function nightTinted(img, dark) {
  if (dark <= 0.01) return img;
  const level = Math.round(dark * 50) / 50;
  let c = tintCache.get(img);
  if (c?.level === level) return c.canvas;
  const canvas = c?.canvas || document.createElement('canvas');
  canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
  const g = canvas.getContext('2d');
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = `rgba(12,16,40,${level * 0.55})`;
  g.fillRect(0, 0, canvas.width, canvas.height);
  tintCache.set(img, { level, canvas });
  return canvas;
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
