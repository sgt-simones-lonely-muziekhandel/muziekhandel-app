// Outside: a canal street in Amsterdam around 1900. Canal crossing on the left, houses and
// the music shop on the right. Drawn live on the canvas in a hand-inked style.
import { Boy } from './boy.js';
import { skyAt, currentHour } from './sky.js';
import { Cyclist } from './cyclist.js';

const W = 3400;
const GROUND = 640;
const CANAL_END = 860;
const SHOP_X = 1480, SHOP_W = 460;
export const DOOR_X = SHOP_X + 230;
const INK = '#1d1510';

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Polygon with slightly wobbly, hand-drawn edges. Same seed → same wobble every frame.
function wobPath(ctx, pts, r, amt = 1.6, closed = true) {
  ctx.beginPath();
  const n = pts.length;
  const J = () => (r() - 0.5) * amt;
  ctx.moveTo(pts[0][0] + J(), pts[0][1] + J());
  for (let i = 1; i <= (closed ? n : n - 1); i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i % n];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const segs = Math.max(1, Math.floor(len / 40));
    for (let s = 1; s <= segs; s++) {
      const t = s / segs;
      const end = s === segs;
      ctx.lineTo(x0 + (x1 - x0) * t + (end ? 0 : J()), y0 + (y1 - y0) * t + (end ? 0 : J()));
    }
  }
  if (closed) ctx.closePath();
}

function inked(ctx, fill, lw = 3) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.stroke();
}

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v * f))));
  return `rgb(${c.join(',')})`;
}

const BRICKS = ['#7d3b2c', '#6b3a2a', '#8a4a32', '#5b4232', '#7a5a45', '#8e5b3e', '#704634', '#9a6a4c'];
const PLASTER = ['#cdbf9f', '#a9b3a1', '#d9cdb2', '#b9a587'];
const GABLES = ['step', 'neck', 'bell', 'spout', 'cornice'];

function buildHouses() {
  const r = rng(1900);
  const houses = [];
  const fill = (x0, x1) => {
    let x = x0;
    while (x < x1) {
      let w = 165 + Math.floor(r() * 75);
      if (x1 - (x + w) < 150) w = x1 - x;
      const plaster = r() < 0.18;
      const bodyTop = 150 + Math.floor(r() * 120);
      houses.push({
        x, w, bodyTop,
        gable: GABLES[Math.floor(r() * GABLES.length)],
        gableH: 85 + Math.floor(r() * 60),
        color: plaster ? PLASTER[Math.floor(r() * PLASTER.length)] : BRICKS[Math.floor(r() * BRICKS.length)],
        plaster,
        cols: w > 205 ? 3 : 2,
        arched: r() < 0.35,
        shutters: r() < 0.3,
        seed: Math.floor(r() * 1e9),
      });
      x += w;
    }
  };
  fill(CANAL_END, SHOP_X);
  houses.push({ shop: true, x: SHOP_X, w: SHOP_W, bodyTop: 170, gable: 'bell', gableH: 120, color: '#5e3a2b', cols: 3, seed: 92 });
  fill(SHOP_X + SHOP_W, W + 40);
  return houses;
}

function buildCobbles() {
  const c = document.createElement('canvas');
  c.width = 240; c.height = 84;
  const g = c.getContext('2d');
  const r = rng(7);
  g.fillStyle = '#5d554b'; g.fillRect(0, 0, c.width, c.height);
  for (let row = 0; row < 7; row++) {
    const h = 9 + row * 0.9;
    const y = 2 + row * 12;
    for (let x = (row % 2) * -14; x < c.width; x += 28) {
      const v = 0.85 + r() * 0.3;
      g.fillStyle = shade('#8a7f71', v);
      g.beginPath();
      g.roundRect(x + 1.5, y, 25, h, 5);
      g.fill();
      g.strokeStyle = 'rgba(25,18,12,0.55)'; g.lineWidth = 1.3; g.stroke();
      g.fillStyle = 'rgba(255,240,210,0.12)';
      g.fillRect(x + 5, y + 2, 12, 2);
    }
  }
  return c;
}

export class Street {
  constructor(game) {
    this.game = game;
    this.width = W;
    this.boy = new Boy(1120);
    this.houses = buildHouses();
    this.cobbles = null;
    this.cyclists = [];
    this.nextCyclist = 3 + Math.random() * 3;
    this.time = 0;
    this.hoverDoor = false;
    this.lamps = [140, 790, 990, 1420, 2040, 2620, 3180];
    this.clouds = Array.from({ length: 7 }, (_, i) => ({ x: i * 520 + Math.random() * 200, y: 40 + Math.random() * 120, s: 0.7 + Math.random() * 0.7 }));
    const r = rng(42);
    this.stars = Array.from({ length: 90 }, () => [r(), r() * 0.6, 0.5 + r() * 1.3, r() * 6]);
  }

  enter(from) {
    this.boy.x = from === 'shop' ? DOOR_X : 1120;
    this.boy.dir = from === 'shop' ? -1 : 1;
    this.boy.target = null;
    this.cyclists = [];
    this.nextCyclist = 4;
    this.game.setPlace('Amsterdam, 1900');
  }

  get nearDoor() { return Math.abs(this.boy.x - DOOR_X) < 70; }

  interact() {
    if (this.nearDoor) this.game.goTo('shop');
  }

  click(wx, wy) {
    if (this.isDoor(wx, wy)) this.boy.walkTo(DOOR_X, () => this.game.goTo('shop'));
    else this.boy.walkTo(Math.max(110, Math.min(W - 60, wx)));
  }

  hover(wx, wy) {
    this.hoverDoor = this.isDoor(wx, wy);
    return this.hoverDoor;
  }

  isDoor(wx, wy) {
    return wx > SHOP_X + 20 && wx < SHOP_X + SHOP_W - 20 && wy > 400 && wy < GROUND + 10;
  }

  update(dt, input) {
    this.time += dt;
    this.boy.update(dt, input, 110, W - 60);
    // Cyclists only show up while the player is idle.
    const idle = this.game.idleTime > 4;
    if (idle) {
      this.nextCyclist -= dt;
      if (this.nextCyclist <= 0 && this.cyclists.length < 2) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        const cam = this.game.camX, vw = this.game.viewW;
        this.cyclists.push(new Cyclist(dir, dir > 0 ? cam - 160 : cam + vw + 160));
        this.nextCyclist = 5 + Math.random() * 5;
      }
    } else {
      this.nextCyclist = Math.max(this.nextCyclist, 1.5);
    }
    for (const c of this.cyclists) c.update(dt);
    const cam = this.game.camX, vw = this.game.viewW;
    this.cyclists = this.cyclists.filter(c => c.x > cam - 400 && c.x < cam + vw + 400);
  }

  draw(ctx, view) {
    const { camX, viewW } = view;
    const hour = currentHour();
    const sky = skyAt(hour);
    this.sky = sky;

    // --- screen-space sky
    ctx.save();
    ctx.setTransform(view.base);
    const g = ctx.createLinearGradient(0, 0, 0, 560);
    g.addColorStop(0, sky.top); g.addColorStop(1, sky.horizon);
    ctx.fillStyle = g; ctx.fillRect(0, 0, viewW, 720);
    this.drawSkyBodies(ctx, sky, viewW);
    this.drawClouds(ctx, sky, camX, viewW);
    ctx.restore();

    // --- far skyline (parallax)
    this.layer(ctx, view, 0.25, () => this.drawSkyline(ctx, sky));
    // --- canal with far bank (parallax)
    this.layer(ctx, view, 0.55, () => this.drawCanal(ctx, sky));

    // --- main layer
    this.layer(ctx, view, 1, () => {
      this.drawRailing(ctx, sky);
      const left = camX - 50, right = camX + viewW + 50;
      for (const h of this.houses) if (h.x + h.w > left && h.x < right) h.shop ? this.drawShop(ctx, h, sky) : this.drawHouse(ctx, h, sky);
      this.drawStreet(ctx, left, right);
      this.drawBridgeFace(ctx, sky);
      for (const x of this.lamps) if (x > left - 100 && x < right + 100) this.drawLamp(ctx, x, sky);
      // night falls over the scene; lights are added on top
      if (sky.dark > 0) {
        ctx.fillStyle = `rgba(12,16,40,${sky.dark * 0.5})`;
        ctx.fillRect(left, 0, right - left, 720);
      }
      this.drawLights(ctx, sky, left, right);
      this.drawDoorHint(ctx);
      ctx.save();
      if (sky.dark > 0) ctx.filter = `brightness(${1 - sky.dark * 0.3})`;
      this.boy.draw(ctx, GROUND + 6, 175);
      for (const c of this.cyclists) c.draw(ctx, 704);
      ctx.restore();
    });

    // --- foreground silhouettes
    this.layer(ctx, view, 1.3, () => this.drawForeground(ctx, sky));
  }

  layer(ctx, view, factor, fn) {
    ctx.save();
    ctx.setTransform(view.base);
    ctx.translate(-view.camX * factor, 0);
    fn();
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
    const arc = t => [vw * (0.1 + 0.8 * t), 430 - Math.sin(Math.PI * t) * 360];
    if (sky.sun != null) {
      const [x, y] = arc(sky.sun);
      const glow = ctx.createRadialGradient(x, y, 10, x, y, 140);
      glow.addColorStop(0, 'rgba(255,230,160,0.7)'); glow.addColorStop(1, 'rgba(255,220,150,0)');
      ctx.fillStyle = glow; ctx.fillRect(x - 140, y - 140, 280, 280);
      ctx.beginPath(); ctx.arc(x, y, 30, 0, Math.PI * 2);
      inked(ctx, '#fbe3a1', 2.5);
    }
    if (sky.moon != null) {
      const [x, y] = arc(sky.moon);
      const glow = ctx.createRadialGradient(x, y, 10, x, y, 110);
      glow.addColorStop(0, 'rgba(230,235,255,0.35)'); glow.addColorStop(1, 'rgba(230,235,255,0)');
      ctx.fillStyle = glow; ctx.fillRect(x - 110, y - 110, 220, 220);
      ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2);
      inked(ctx, '#efeedd', 2.5);
      ctx.beginPath(); ctx.arc(x + 9, y - 5, 18, 0, Math.PI * 2);
      ctx.fillStyle = sky.top; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
    }
  }

  drawClouds(ctx, sky, camX, vw) {
    const tint = sky.dark > 0.5 ? 'rgba(70,80,120,0.55)' : sky.dark > 0.1 ? 'rgba(250,200,170,0.75)' : 'rgba(255,252,244,0.9)';
    for (const c of this.clouds) {
      const span = vw + 600;
      const x = ((c.x - camX * 0.08 + this.time * 6 * c.s) % span + span) % span - 300;
      ctx.save();
      ctx.translate(x, c.y);
      ctx.scale(c.s, c.s);
      ctx.beginPath();
      ctx.ellipse(0, 0, 80, 22, 0, 0, Math.PI * 2);
      ctx.ellipse(-40, -12, 42, 24, 0, 0, Math.PI * 2);
      ctx.ellipse(30, -18, 50, 30, 0, 0, Math.PI * 2);
      ctx.fillStyle = tint; ctx.fill();
      ctx.restore();
    }
  }

  drawSkyline(ctx, sky) {
    const r = rng(5);
    const base = 545;
    ctx.fillStyle = sky.dark > 0.5 ? '#2a3150' : '#7f8ea0';
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(-200, base);
    let x = -200;
    while (x < 1800) {
      const w = 40 + r() * 50, h = 60 + r() * 70;
      ctx.lineTo(x, base - h); ctx.lineTo(x + w / 2, base - h - 30 - r() * 20); ctx.lineTo(x + w, base - h);
      x += w;
      if (Math.abs(x - 420) < 40) { // Westertoren-like tower
        ctx.lineTo(x, base - 250); ctx.lineTo(x + 8, base - 250); ctx.lineTo(x + 8, base - 300);
        ctx.lineTo(x + 16, base - 340); ctx.lineTo(x + 24, base - 300); ctx.lineTo(x + 24, base - 250);
        ctx.lineTo(x + 32, base - 250); ctx.lineTo(x + 32, base - 140);
        x += 32;
      }
    }
    ctx.lineTo(x, base + 40); ctx.lineTo(-200, base + 40); ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawCanal(ctx, sky) {
    const top = 528;
    // far bank houses
    const r = rng(11);
    let x = -100;
    while (x < 1400) {
      const w = 70 + r() * 40, h = 120 + r() * 80;
      const col = BRICKS[Math.floor(r() * BRICKS.length)];
      const rr = rng(Math.floor(r() * 1e6));
      wobPath(ctx, [[x, top], [x, top - h], [x + w / 2, top - h - 35], [x + w, top - h], [x + w, top]], rr, 1.2);
      inked(ctx, shade(col, 0.85), 2);
      for (let fy = top - h + 18; fy < top - 25; fy += 36) {
        for (let fx = x + 12; fx < x + w - 18; fx += 26) {
          const lit = sky.lampsOn && rr() < 0.45;
          ctx.fillStyle = lit ? '#f2c76b' : '#2b3442';
          ctx.fillRect(fx, fy, 12, 18);
        }
      }
      x += w;
    }
    // trees along the far quay
    for (let tx = 40; tx < 1300; tx += 210) {
      ctx.fillStyle = sky.dark > 0.5 ? '#1f2a22' : '#4f6345';
      ctx.beginPath();
      ctx.ellipse(tx, top - 90, 55, 70, 0, 0, Math.PI * 2);
      ctx.ellipse(tx + 30, top - 120, 40, 45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a2018'; ctx.fillRect(tx - 4, top - 40, 8, 40);
    }
    // quay wall
    ctx.fillStyle = '#4b3a2e'; ctx.fillRect(-200, top - 4, 1700, 12);
    // water
    const wg = ctx.createLinearGradient(0, top, 0, 720);
    wg.addColorStop(0, sky.horizon); wg.addColorStop(0.25, '#4b6372'); wg.addColorStop(1, '#22323d');
    ctx.fillStyle = wg; ctx.fillRect(-200, top + 8, 1700, 720 - top);
    if (sky.dark > 0) { ctx.fillStyle = `rgba(8,12,30,${sky.dark * 0.45})`; ctx.fillRect(-200, top + 8, 1700, 720 - top); }
    // shimmer
    const sr = rng(3);
    ctx.lineWidth = 2;
    for (let i = 0; i < 70; i++) {
      const y = top + 14 + sr() * 180;
      const wx = sr() * 1500 - 100 + Math.sin(this.time * 0.8 + i) * 12;
      const len = 14 + sr() * 30;
      ctx.strokeStyle = sky.lampsOn && sr() < 0.4 ? 'rgba(242,199,107,0.55)' : 'rgba(230,240,245,0.28)';
      ctx.beginPath(); ctx.moveTo(wx, y); ctx.lineTo(wx + len, y); ctx.stroke();
    }
    // moored boat
    const by = top + 70 + Math.sin(this.time * 1.3) * 2.5;
    ctx.save();
    ctx.translate(520, by);
    ctx.rotate(Math.sin(this.time * 1.1) * 0.012);
    wobPath(ctx, [[-120, -18], [120, -18], [95, 14], [-100, 14]], rng(8), 1.2);
    inked(ctx, '#3d2b1f', 3);
    ctx.fillStyle = '#8e3b3b'; ctx.fillRect(-110, -18, 220, 6);
    wobPath(ctx, [[-50, -18], [-50, -48], [30, -48], [40, -18]], rng(9), 1);
    inked(ctx, '#6b5640', 2.5);
    ctx.restore();
  }

  drawRailing(ctx) {
    const y0 = 580;
    ctx.strokeStyle = '#231d18'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(70, y0); ctx.lineTo(CANAL_END - 30, y0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(70, y0 + 14); ctx.lineTo(CANAL_END - 30, y0 + 14); ctx.stroke();
    ctx.lineWidth = 2;
    for (let x = 80; x < CANAL_END - 30; x += 14) {
      ctx.beginPath(); ctx.moveTo(x, y0 + 14); ctx.lineTo(x, GROUND); ctx.stroke();
    }
    for (let x = 70; x <= CANAL_END - 20; x += 190) {
      wobPath(ctx, [[x - 9, y0 - 12], [x + 9, y0 - 12], [x + 9, GROUND], [x - 9, GROUND]], rng(x), 1);
      inked(ctx, '#8c8c8c', 2.5);
    }
  }

  drawWindow(ctx, x, y, w, h, r, arched, sky, lit) {
    const pts = arched
      ? [[x, y + h], [x, y + w / 2], [x + w * 0.15, y + w * 0.15], [x + w / 2, y], [x + w * 0.85, y + w * 0.15], [x + w, y + w / 2], [x + w, y + h]]
      : [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    wobPath(ctx, pts, r, 1);
    inked(ctx, '#efe4cc', 2.5);
    const ix = x + 5, iy = y + (arched ? w * 0.3 : 5), iw = w - 10, ih = h - (arched ? w * 0.3 : 5) - 5;
    if (lit) {
      ctx.fillStyle = '#f5cf74';
    } else {
      const gg = ctx.createLinearGradient(ix, iy, ix + iw, iy + ih);
      gg.addColorStop(0, sky.dark > 0.5 ? '#2c3550' : '#9fb7c6');
      gg.addColorStop(1, sky.dark > 0.5 ? '#151b2c' : '#4d6577');
      ctx.fillStyle = gg;
    }
    ctx.fillRect(ix, iy, iw, ih);
    ctx.strokeStyle = '#efe4cc'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(ix + iw / 2, iy); ctx.lineTo(ix + iw / 2, iy + ih);
    ctx.moveTo(ix, iy + ih / 2); ctx.lineTo(ix + iw, iy + ih / 2);
    ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(ix, iy, iw, ih);
    if (!lit && sky.dark < 0.5) {
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ix + 4, iy + ih * 0.4); ctx.lineTo(ix + iw * 0.4, iy + 4); ctx.stroke();
    }
  }

  gablePoints(h) {
    const { x, w, bodyTop: t, gableH: gh } = h;
    switch (h.gable) {
      case 'step': {
        const pts = [[x, GROUND], [x, t]];
        const steps = 3, sw = w * 0.32 / steps, sh = gh / (steps + 1);
        for (let i = 0; i < steps; i++) pts.push([x + i * sw, t - (i + 1) * sh], [x + (i + 1) * sw, t - (i + 1) * sh]);
        pts.push([x + steps * sw, t - gh], [x + w - steps * sw, t - gh]);
        for (let i = steps - 1; i >= 0; i--) pts.push([x + w - (i + 1) * sw, t - (i + 1) * sh], [x + w - i * sw, t - (i + 1) * sh]);
        pts.push([x + w, t], [x + w, GROUND]);
        return pts;
      }
      case 'neck': {
        const n = w * 0.24;
        return [[x, GROUND], [x, t], [x + w * 0.12, t - gh * 0.12], [x + w / 2 - n, t - gh * 0.38], [x + w / 2 - n, t - gh * 0.85],
          [x + w / 2, t - gh - 14], [x + w / 2 + n, t - gh * 0.85], [x + w / 2 + n, t - gh * 0.38], [x + w * 0.88, t - gh * 0.12], [x + w, t], [x + w, GROUND]];
      }
      case 'bell':
        return [[x, GROUND], [x, t], [x + w * 0.06, t - gh * 0.2], [x + w * 0.16, t - gh * 0.5], [x + w * 0.28, t - gh * 0.78],
          [x + w * 0.38, t - gh * 0.94], [x + w / 2, t - gh], [x + w * 0.62, t - gh * 0.94], [x + w * 0.72, t - gh * 0.78],
          [x + w * 0.84, t - gh * 0.5], [x + w * 0.94, t - gh * 0.2], [x + w, t], [x + w, GROUND]];
      case 'spout':
        return [[x, GROUND], [x, t], [x + w * 0.12, t], [x + w / 2, t - gh * 1.1], [x + w * 0.88, t], [x + w, t], [x + w, GROUND]];
      default: // cornice
        return [[x, GROUND], [x, t - gh * 0.3], [x + w, t - gh * 0.3], [x + w, GROUND]];
    }
  }

  drawHouse(ctx, h, sky) {
    const r = rng(h.seed);
    const { x, w, bodyTop: t } = h;
    wobPath(ctx, this.gablePoints(h), r, 1.8);
    inked(ctx, h.color, 3.2);
    // brick texture / plaster stains
    ctx.strokeStyle = h.plaster ? 'rgba(90,70,50,0.18)' : 'rgba(30,15,10,0.28)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 45; i++) {
      const bx = x + 8 + r() * (w - 30), by = t + r() * (GROUND - t - 10);
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 8 + r() * 10, by); ctx.stroke();
    }
    if (h.gable === 'cornice') {
      wobPath(ctx, [[x - 6, t - h.gableH * 0.3], [x + w + 6, t - h.gableH * 0.3], [x + w + 6, t - h.gableH * 0.3 + 14], [x - 6, t - h.gableH * 0.3 + 14]], r, 1);
      inked(ctx, '#e9dfc8', 2.5);
    } else {
      // little gable window and hoisting beam
      this.drawWindow(ctx, x + w / 2 - 15, t - h.gableH * 0.62, 30, 42, r, true, sky, false);
      ctx.fillStyle = INK; ctx.fillRect(x + w / 2 - 4, t - h.gableH * 0.86 - 8, 8, 10);
      ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + w / 2, t - h.gableH * 0.86 + 2); ctx.lineTo(x + w / 2, t - h.gableH * 0.86 + 16); ctx.stroke();
    }
    // cornice line
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x + 2, t + 6); ctx.lineTo(x + w - 2, t + 6); ctx.stroke();

    const groundH = 140;
    const floors = Math.max(2, Math.floor((GROUND - groundH - t - 10) / 95));
    const fh = (GROUND - groundH - t - 10) / floors;
    const cw = w / h.cols;
    h.windows = [];
    for (let f = 0; f < floors; f++) {
      for (let c = 0; c < h.cols; c++) {
        const ww = cw * 0.52, wh = fh * 0.66;
        const wx = x + c * cw + (cw - ww) / 2, wy = t + 18 + f * fh;
        const lit = r() < 0.5;
        if (h.shutters) {
          ctx.fillStyle = '#2f4a3a';
          wobPath(ctx, [[wx - 12, wy + 4], [wx, wy + 4], [wx, wy + wh], [wx - 12, wy + wh]], r, 0.8); inked(ctx, '#2f4a3a', 1.6);
          wobPath(ctx, [[wx + ww, wy + 4], [wx + ww + 12, wy + 4], [wx + ww + 12, wy + wh], [wx + ww, wy + wh]], r, 0.8); inked(ctx, '#2f4a3a', 1.6);
        }
        this.drawWindow(ctx, wx, wy, ww, wh, r, h.arched, sky, lit && sky.lampsOn);
        if (lit) h.windows.push(h.arched ? [wx, wy + ww * 0.3, ww, wh - ww * 0.3] : [wx, wy, ww, wh]);
      }
    }
    // ground floor: steps, door and a window
    const dw = 46, dx = x + (r() < 0.5 ? 18 : w - 18 - dw), dy = GROUND - 112;
    wobPath(ctx, [[dx - 8, GROUND - 10], [dx + dw + 8, GROUND - 10], [dx + dw + 12, GROUND], [dx - 12, GROUND]], r, 1);
    inked(ctx, '#8c8c8c', 2);
    wobPath(ctx, [[dx, GROUND - 10], [dx, dy + 18], [dx + dw / 2, dy], [dx + dw, dy + 18], [dx + dw, GROUND - 10]], r, 1);
    inked(ctx, r() < 0.5 ? '#2f4a3a' : '#4a3626', 2.8);
    ctx.fillStyle = '#d7b26a'; ctx.beginPath(); ctx.arc(dx + dw - 10, GROUND - 55, 3, 0, Math.PI * 2); ctx.fill();
    const gwx = dx < x + w / 2 ? dx + dw + 22 : x + 22;
    const gww = w - dw - 66;
    if (gww > 50) {
      const lit = r() < 0.5;
      this.drawWindow(ctx, gwx, GROUND - groundH + 22, gww, 82, r, false, sky, lit && sky.lampsOn);
      if (lit) h.windows.push([gwx, GROUND - groundH + 22, gww, 82]);
    }
  }

  drawShop(ctx, h, sky) {
    const r = rng(h.seed);
    const { x, w, bodyTop: t } = h;
    wobPath(ctx, this.gablePoints(h), r, 1.8);
    inked(ctx, h.color, 3.2);
    this.drawWindow(ctx, x + w / 2 - 18, t - h.gableH * 0.62, 36, 50, r, true, sky, sky.lampsOn);
    h.windows = sky.lampsOn ? [[x + w / 2 - 18, t - h.gableH * 0.62 + 11, 36, 39]] : [];
    for (let f = 0; f < 2; f++) for (let c = 0; c < 3; c++) {
      const cw = w / 3, ww = cw * 0.5, wh = 70, wx = x + c * cw + (cw - ww) / 2, wy = t + 22 + f * 105;
      const lit = (f + c) % 2 === 0;
      this.drawWindow(ctx, wx, wy, ww, wh, r, true, sky, lit && sky.lampsOn);
      if (lit) h.windows.push([wx, wy + ww * 0.3, ww, wh - ww * 0.3]);
    }
    // shopfront
    const fy = GROUND - 235;
    wobPath(ctx, [[x + 6, fy], [x + w - 6, fy], [x + w - 6, GROUND], [x + 6, GROUND]], r, 1.4);
    inked(ctx, '#203328', 3);
    // sign board
    wobPath(ctx, [[x + 14, fy + 8], [x + w - 14, fy + 8], [x + w - 14, fy + 64], [x + 14, fy + 64]], r, 1);
    inked(ctx, '#15231b', 2.5);
    ctx.strokeStyle = '#c9a050'; ctx.lineWidth = 1.5; ctx.strokeRect(x + 22, fy + 15, w - 44, 42);
    ctx.fillStyle = '#e8c56d'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '700 12px "Cinzel Decorative", serif';
    ctx.fillText('MUZIEKHANDEL', x + w / 2, fy + 25);
    ctx.font = '700 22px "Cinzel Decorative", serif';
    ctx.fillText('VAN DER VELDE', x + w / 2, fy + 45);
    // display windows, always warmly lit
    const glass = (gx, gw) => {
      const gy = fy + 80, gh = GROUND - 26 - gy;
      const lg = ctx.createLinearGradient(gx, gy, gx, gy + gh);
      lg.addColorStop(0, '#f6d48a'); lg.addColorStop(1, '#b97b36');
      wobPath(ctx, [[gx, gy], [gx + gw, gy], [gx + gw, gy + gh], [gx, gy + gh]], r, 1);
      inked(ctx, lg, 3);
      return [gx, gy, gw, gh];
    };
    const L = glass(x + 22, 150), R = glass(x + w - 172, 150);
    // things in the window: sheet music, a violin, a gramophone
    ctx.fillStyle = '#f4e9d7';
    for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(L[0] + 28 + i * 40, L[1] + 50); ctx.rotate((i - 1) * 0.12); ctx.fillRect(-15, -20, 30, 40); ctx.strokeStyle = '#4a3626'; ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-11, -12 + k * 7); ctx.lineTo(11, -12 + k * 7); ctx.stroke(); } ctx.restore(); }
    ctx.fillStyle = '#6b3a1f';
    ctx.beginPath(); ctx.ellipse(L[0] + 75, L[1] + L[3] - 30, 14, 20, 0, 0, Math.PI * 2); ctx.ellipse(L[0] + 75, L[1] + L[3] - 58, 10, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(L[0] + 73, L[1] + L[3] - 95, 4, 30);
    ctx.fillStyle = '#4a3626'; ctx.fillRect(R[0] + 45, R[1] + R[3] - 32, 60, 28);
    ctx.fillStyle = '#c9a050';
    ctx.beginPath(); ctx.moveTo(R[0] + 75, R[1] + R[3] - 36); ctx.lineTo(R[0] + 95, R[1] + 40); ctx.lineTo(R[0] + 135, R[1] + 22); ctx.lineTo(R[0] + 120, R[1] + 75); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    for (const [gx, gy, gw, gh] of [L, R]) {
      ctx.strokeStyle = '#203328'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(gx + gw / 2, gy); ctx.lineTo(gx + gw / 2, gy + gh); ctx.moveTo(gx, gy + 34); ctx.lineTo(gx + gw, gy + 34); ctx.stroke();
    }
    // door
    const dx = DOOR_X - 34, dy = fy + 78;
    wobPath(ctx, [[dx, GROUND - 8], [dx, dy], [dx + 68, dy], [dx + 68, GROUND - 8]], r, 1);
    inked(ctx, '#2f4a3a', 3);
    ctx.fillStyle = '#f2c76b'; ctx.fillRect(dx + 10, dy + 10, 48, 60);
    ctx.strokeStyle = '#2f4a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(dx + 34, dy + 10); ctx.lineTo(dx + 34, dy + 70); ctx.stroke();
    ctx.fillStyle = '#d7b26a'; ctx.beginPath(); ctx.arc(dx + 56, dy + 100, 4, 0, Math.PI * 2); ctx.fill();
    wobPath(ctx, [[dx - 12, GROUND - 8], [dx + 80, GROUND - 8], [dx + 86, GROUND], [dx - 18, GROUND]], r, 1);
    inked(ctx, '#8c8c8c', 2);
    // hanging sign with a note
    ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x + w, fy - 40); ctx.lineTo(x + w + 60, fy - 40); ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + w + 20, fy - 40); ctx.lineTo(x + w + 20, fy - 30); ctx.moveTo(x + w + 50, fy - 40); ctx.lineTo(x + w + 50, fy - 30); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x + w + 35, fy - 2, 26, 30, 0, 0, Math.PI * 2);
    inked(ctx, '#c9a050', 3);
    ctx.fillStyle = INK; ctx.font = '34px "Noto Music", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('♫', x + w + 35, fy);
    this.shopRects = [L, R, [dx + 10, dy + 10, 48, 60]];
  }

  drawStreet(ctx, left, right) {
    if (!this.cobbles) this.cobbles = ctx.createPattern(buildCobbles(), 'repeat');
    ctx.save();
    ctx.translate(0, GROUND);
    ctx.fillStyle = this.cobbles;
    ctx.fillRect(Math.max(left, CANAL_END - 40), 0, right - Math.max(left, CANAL_END - 40), 90);
    ctx.restore();
    // pavement edge
    ctx.fillStyle = '#8c8c8c';
    ctx.fillRect(Math.max(left, CANAL_END - 40), GROUND - 2, right, 7);
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(Math.max(left, CANAL_END - 40), GROUND + 5); ctx.lineTo(right, GROUND + 5); ctx.stroke();
    // Amsterdammertjes (street posts)
    for (let px = 1000; px < W; px += 170) {
      if (px < left - 20 || px > right + 20 || Math.abs(px - DOOR_X) < 120) continue;
      ctx.beginPath();
      ctx.roundRect(px - 7, GROUND + 10, 14, 44, [6, 6, 2, 2]);
      inked(ctx, '#6a2a22', 2);
      ctx.fillStyle = '#c9a050'; ctx.fillRect(px - 7, GROUND + 22, 14, 3);
    }
  }

  drawBridgeFace(ctx) {
    const r = rng(77);
    const x0 = 30, x1 = CANAL_END - 10;
    wobPath(ctx, [[x0, GROUND - 4], [x1, GROUND - 4], [x1, 720], [x0, 720]], r, 1.5);
    inked(ctx, '#7d4a35', 3);
    ctx.fillStyle = '#e9dfc8'; ctx.fillRect(x0, GROUND - 4, x1 - x0, 9);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(x0, GROUND - 4, x1 - x0, 9);
    for (const cx of [230, 600]) {
      ctx.beginPath();
      ctx.moveTo(cx - 140, 722);
      ctx.bezierCurveTo(cx - 140, 668, cx + 140, 668, cx + 140, 722);
      ctx.closePath();
      ctx.fillStyle = '#1b2830'; ctx.fill();
      ctx.strokeStyle = '#e9dfc8'; ctx.lineWidth = 7; ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(30,15,10,0.3)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 50; i++) {
      const bx = x0 + r() * (x1 - x0), by = GROUND + 12 + r() * 50;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 10, by); ctx.stroke();
    }
  }

  drawLamp(ctx, x, sky) {
    const top = GROUND - 250;
    ctx.fillStyle = '#1f2a24';
    ctx.fillRect(x - 4, top + 40, 8, 250 - 40);
    ctx.fillRect(x - 12, GROUND - 22, 24, 22);
    ctx.beginPath();
    ctx.moveTo(x - 18, top + 4); ctx.lineTo(x + 18, top + 4); ctx.lineTo(x + 12, top + 42); ctx.lineTo(x - 12, top + 42); ctx.closePath();
    inked(ctx, sky.lampsOn ? '#f8dc8c' : '#c9d2cf', 2.5);
    ctx.beginPath(); ctx.moveTo(x - 22, top + 4); ctx.lineTo(x, top - 14); ctx.lineTo(x + 22, top + 4); ctx.closePath();
    inked(ctx, '#1f2a24', 2.5);
  }

  drawLights(ctx, sky, left, right) {
    if (!sky.lampsOn) return;
    const a = Math.min(1, (sky.dark - 0.3) / 0.4);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const h of this.houses) {
      if (h.x + h.w < left || h.x > right || !h.windows) continue;
      for (const [wx, wy, ww, wh] of h.windows) {
        ctx.fillStyle = `rgba(242,199,107,${0.55 * a})`;
        ctx.fillRect(wx + 5, wy + 5, ww - 10, wh - 10);
        const gg = ctx.createRadialGradient(wx + ww / 2, wy + wh / 2, 4, wx + ww / 2, wy + wh / 2, ww * 1.1);
        gg.addColorStop(0, `rgba(242,180,90,${0.28 * a})`); gg.addColorStop(1, 'rgba(242,180,90,0)');
        ctx.fillStyle = gg; ctx.fillRect(wx - ww, wy - ww, ww * 3, wh + ww * 2);
      }
    }
    for (const rect of this.shopRects || []) {
      const [gx, gy, gw, gh] = rect;
      ctx.fillStyle = `rgba(246,200,110,${0.35 * a})`;
      ctx.fillRect(gx, gy, gw, gh);
    }
    for (const x of this.lamps) {
      if (x < left - 200 || x > right + 200) continue;
      const y = GROUND - 225;
      const gg = ctx.createRadialGradient(x, y, 5, x, y, 210);
      gg.addColorStop(0, `rgba(255,214,130,${0.55 * a})`); gg.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = gg; ctx.fillRect(x - 210, y - 210, 420, 420);
      const pool = ctx.createRadialGradient(x, GROUND + 30, 4, x, GROUND + 30, 150);
      pool.addColorStop(0, `rgba(255,210,130,${0.3 * a})`); pool.addColorStop(1, 'rgba(255,210,130,0)');
      ctx.fillStyle = pool; ctx.fillRect(x - 150, GROUND - 40, 300, 140);
    }
    ctx.restore();
  }

  drawDoorHint(ctx) {
    const near = this.nearDoor;
    const bob = Math.sin(this.time * 3) * 6;
    const y = GROUND - 300 + bob;
    if (!near && !this.hoverDoor) {
      // bouncing arrow over the shop door so even the youngest players know where to go
      ctx.save();
      ctx.translate(DOOR_X, y + 40);
      ctx.beginPath(); ctx.moveTo(-16, -22); ctx.lineTo(16, -22); ctx.lineTo(16, 0); ctx.lineTo(28, 0); ctx.lineTo(0, 26); ctx.lineTo(-28, 0); ctx.lineTo(-16, 0); ctx.closePath();
      inked(ctx, '#f2c76b', 3);
      ctx.restore();
      return;
    }
    const label = near ? '↑  Naar binnen' : 'Muziekwinkel';
    ctx.font = '800 20px "Nunito Sans", sans-serif';
    const tw = ctx.measureText(label).width + 36;
    ctx.save();
    ctx.translate(DOOR_X, y);
    wobPath(ctx, [[-tw / 2, -22], [tw / 2, -22], [tw / 2, 22], [10, 22], [0, 34], [-10, 22], [-tw / 2, 22]], rng(4), 1.2);
    inked(ctx, '#f4e9d7', 3);
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 1);
    ctx.restore();
  }

  drawForeground(ctx, sky) {
    const col = sky.dark > 0.5 ? '#0c0d10' : '#1c1a17';
    ctx.fillStyle = col;
    // a big canal-side tree and some railings in front, Valiant Hearts style framing
    ctx.beginPath();
    ctx.ellipse(-40, 140, 190, 170, 0, 0, Math.PI * 2);
    ctx.ellipse(140, 60, 150, 110, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-30, 140, 34, 600);
    // tufts of grass and leaves along the bottom edge
    for (const x of [1500, 2700, 3900]) {
      for (let k = 0; k < 9; k++) {
        const a = -Math.PI / 2 + (k - 4) * 0.22, len = 60 + (k % 3) * 22;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * len / 2, 735 + Math.sin(a) * len / 2, len / 2, 7, a, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
