// The listening corner, one room to the right of the shop: a painted close-up of a window,
// a crate of records and an armchair (closeups/gramophone-corner), with the gramophone
// (shop/gramophone, horn and box only) standing on the round table.
import { Boy } from './boy.js';
import { hitSpot, nearestSpot, clickSpots, drawOutline, drawLabel } from './hotspots.js';
import { skyAt, currentHour } from './sky.js';

const BG_W = 1672, BG_H = 941;
const H = 720, W = Math.round(BG_W * H / BG_H); // 1279
const FOOT_Y = 706;
const BOY_H = 360;

const load = src => { const i = new Image(); i.src = src; return i; };
const IMG = {
  bg: load('public/art/closeups/gramophone-corner.webp'),
  gramophone: load('public/art/shop/gramophone.webp'),
};
const ready = img => img.complete && img.naturalWidth > 0;

// The gramophone image is a horn and box on a cabinet; only the top part (source rows 0–TOP_ROWS) is drawn.
const TOP_ROWS = 560;
const GRAMO = { cx: 640, bottom: 402, w: 300 };

// The painted room is in daylight; by the visitor's clock it gets darker like the street outside.
const K = W / BG_W;
const WINDOW = [120 * K, 0, 410 * K, 440 * K];                    // the panes, in scene units
const WINDOW_LAMPS = [[150 * K, 268 * K], [383 * K, 236 * K]];   // street lamps seen through the window
const ROOM_LAMP = [640, 120];                                      // a warm glow over the gramophone

const HOTSPOTS = [
  { id: 'back', label: 'Terug naar de winkel', rects: [[0, 120, 46, 580]], stands: [70], faceLeft: true, action: g => g.goTo('shop') },
  { id: 'records', label: 'Cilinders', rects: [[65, 352, 298, 306]], stands: [220], action: g => g.ui.open('gramophone') },
  { id: 'gramophone', label: 'Grammofoon', rects: [[470, 110, 340, 300]], stands: [640], action: g => g.ui.open('gramophone') },
];

export class Corner {
  constructor(game) {
    this.game = game;
    this.width = W;
    this.fitWidth = W;
    this.boy = new Boy(170);
    this.hovered = null;
    this.time = 0;
  }

  enter() {
    this.boy.x = 170;
    this.boy.dir = 1;
    this.boy.target = null;
    this.game.setPlace('De luisterhoek');
  }

  get nearSpot() {
    return nearestSpot(HOTSPOTS, this.boy.x);
  }

  interact() {
    this.nearSpot?.action(this.game);
  }

  click(wx, wy) {
    clickSpots(this, HOTSPOTS, wx, wy, 60, W - 260);
  }

  hover(wx, wy) {
    this.hovered = hitSpot(HOTSPOTS, wx, wy)?.spot || null;
    return !!this.hovered;
  }

  update(dt, input) {
    this.time += dt;
    this.boy.update(dt, input, 60, W - 260);
    // keep walking left to go back into the shop
    if (input.left && this.boy.x <= 61) this.game.goTo('shop');
  }

  draw(ctx, view) {
    ctx.save();
    ctx.setTransform(view.base);
    ctx.fillStyle = '#120c08';
    ctx.fillRect(0, -400, view.viewW, H + 800);
    ctx.translate(-view.camX, 0);
    if (ready(IMG.bg)) ctx.drawImage(IMG.bg, 0, 0, W, H);

    const g = IMG.gramophone;
    if (ready(g)) {
      const s = GRAMO.w / g.naturalWidth, h = TOP_ROWS * s;
      ctx.save();
      ctx.fillStyle = 'rgba(20,12,6,0.35)';
      ctx.beginPath(); ctx.ellipse(GRAMO.cx, GRAMO.bottom - 3, GRAMO.w * 0.36, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(g, 0, 0, g.naturalWidth, TOP_ROWS, GRAMO.cx - GRAMO.w / 2, GRAMO.bottom - h, GRAMO.w, h);
      ctx.restore();
    }

    const sky = skyAt(currentHour());
    this.drawNight(ctx, sky);

    const near = this.nearSpot;
    const lit = this.hovered || near;
    if (lit) drawOutline(ctx, lit, this.time);
    if (sky.dark > 0) ctx.filter = `brightness(${1 - sky.dark * 0.25})`;
    this.boy.draw(ctx, FOOT_Y, BOY_H);
    ctx.filter = 'none';
    if (lit) drawLabel(ctx, lit, this.time, W, lit === near && !this.hovered);
    ctx.restore();
  }

  // Evening and night: the sky in the window turns the colour of the real sky, the room gets darker
  // and bluer, the street lamps outside and a lamp over the gramophone glow (not too bright).
  drawNight(ctx, sky) {
    if (sky.dark <= 0.01) return;
    const [wx, wy, ww, wh] = WINDOW;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    const g = ctx.createLinearGradient(0, wy, 0, wy + wh);
    g.addColorStop(0, sky.top);
    g.addColorStop(1, sky.horizon);
    ctx.globalAlpha = Math.min(1, sky.dark * 1.1);
    ctx.fillStyle = g;
    ctx.fillRect(wx, wy, ww, wh);
    ctx.restore();

    ctx.fillStyle = `rgba(14,16,40,${sky.dark * 0.5})`;
    ctx.fillRect(0, 0, W, H);

    if (!sky.lampsOn) return;
    const a = Math.min(1, (sky.dark - 0.3) / 0.4);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = (x, y, r, rgb, alpha) => {
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, `rgba(${rgb},${alpha})`);
      rg.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = rg;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };
    WINDOW_LAMPS.forEach(([x, y], i) => {
      const f = 0.9 + 0.1 * Math.sin(this.time * 7 + i * 2) * Math.sin(this.time * 2.3 + i);
      glow(x, y, 9, '255,236,180', 0.8 * a * f);
      glow(x, y, 40, '255,190,100', 0.3 * a * f);
    });
    const f = 0.95 + 0.05 * Math.sin(this.time * 1.7);
    glow(ROOM_LAMP[0], ROOM_LAMP[1], 520, '255,170,80', 0.16 * a * f);
    glow(ROOM_LAMP[0], FOOT_Y - 120, 380, '255,160,70', 0.08 * a);
    ctx.restore();
  }
}
