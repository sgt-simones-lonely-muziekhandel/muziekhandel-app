// The listening corner, one room to the right of the shop: a painted close-up of a window,
// a crate of records and an armchair (closeups/gramophone-corner), with the gramophone
// (shop/gramophone, horn and box only) standing on the round table.
import { Boy } from './boy.js';
import { hitSpot, nearestSpot, clickSpots, drawOutline, drawLabel } from './hotspots.js';

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

    const near = this.nearSpot;
    const lit = this.hovered || near;
    if (lit) drawOutline(ctx, lit, this.time);
    this.boy.draw(ctx, FOOT_Y, BOY_H);
    if (lit) drawLabel(ctx, lit, this.time, W, lit === near && !this.hovered);
    ctx.restore();
  }
}
