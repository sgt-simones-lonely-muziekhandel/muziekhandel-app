// Inside the music shop, put together from the separate pieces in public/art/shop:
// the empty room (back-wall), the piano with the composers' portraits above it, the counter
// with the shopkeeper, the cabinet, and foreground silhouettes. Walking out on the right
// leads to the listening corner (js/corner.js).
import { Boy } from './boy.js';
import { COMPOSERS } from './data.js';
import { FRAME_TYPES, FRAME_SRC, COMPOSER_FRAME } from './frames.js';
import { hitSpot, nearestSpot, clickSpots, drawOutline, drawLabel } from './hotspots.js';

const W = 1440, H = 720;
const FOOT_Y = 692;

const load = src => { const i = new Image(); i.src = src; return i; };
const ART = 'public/art/';
const IMG = {
  wall: load(`${ART}shop/back-wall.webp`),
  fg: load(`${ART}shop/foreground.webp`),
  cabinet: load(`${ART}shop/cabinet.webp`),
  piano: load(`${ART}shop/piano.webp`),
  counter: load(`${ART}shop/counter.webp`),
  keeper: load(`${ART}characters/shopkeeper/full.webp`),
};
const ready = img => img.complete && img.naturalWidth > 0;

// Furniture: x, bottom y and width in world units; height follows the image.
// Drawn in this order: the counter stands in front of the cabinet's left edge.
const FURNITURE = [
  { img: 'piano', x: 340, bottom: 630, w: 280 },
  { img: 'cabinet', x: 1238, bottom: 632, w: 200 },
  // behind the counter, waist at desk height (the desk top is just below the window sill, y ≈ 469)
  { img: 'keeper', x: 877, bottom: 636, w: 130, clipBottom: 636, noShadow: true },
  { img: 'counter', x: 626, bottom: 650, w: 632 },
];

// Gilded frames on the wall, each with a composer portrait inside (see js/frames.js).
const FRAME_IMG = Object.fromEntries(Object.keys(FRAME_TYPES).map(n => [n, load(FRAME_SRC(n))]));
// A gallery wall above the piano: two in the top row (left and right of the hanging lamp), four below.
const FRAMES = [
  { cx: 392, top: 100, h: 98, composer: 'bach' },
  { cx: 608, top: 98, h: 100, composer: 'mozart' },
  { cx: 374, top: 220, h: 108, composer: 'beethoven' },
  { cx: 458, top: 220, h: 104, composer: 'chopin' },
  { cx: 546, top: 220, h: 108, composer: 'verdi' },
  { cx: 634, top: 228, h: 92, composer: 'tchaikovsky' },
];
for (const f of FRAMES) {
  f.type = COMPOSER_FRAME[f.composer];
  f.portrait = load(COMPOSERS.find(c => c.id === f.composer).portrait);
  f.short = COMPOSERS.find(c => c.id === f.composer).short;
}

function box(item) {
  const img = IMG[item.img];
  const h = ready(img) ? item.w * img.naturalHeight / img.naturalWidth : item.w;
  return [item.x, item.bottom - h, item.w, h];
}

// Where things are, in world units. `stands` is where the boy walks to, one per rect.
const HOTSPOTS = [
  { id: 'door', label: 'Naar buiten', rects: [[18, 150, 72, 450]], stands: [85], faceLeft: true, action: g => g.goTo('street') },
  { id: 'portraits', label: 'Componisten', rects: [[330, 96, 345, 252]], stands: [420], action: g => g.ui.open('gallery') },
  { id: 'piano', label: 'Piano', rects: [[340, 370, 280, 260]], stands: [520], action: g => g.ui.open('piano') },
  { id: 'keeper', label: 'Meneer Van der Velde', rects: [[626, 300, 632, 350]], stands: [940], action: g => g.ui.open('keeper') },
  { id: 'next', label: 'Luisterhoek →', rects: [[1406, 120, 34, 560]], stands: [1400], action: g => g.goTo('corner') },
  { id: 'library', label: 'Bladmuziek', rects: [[1262, 300, 176, 332]], stands: [1330], action: g => g.ui.open('library') },
];

export class Shop {
  constructor(game) {
    this.game = game;
    this.width = W;
    this.fitWidth = W;
    this.boy = new Boy(200);
    this.hovered = null;
    this.time = 0;
    this.greeted = false;
  }

  enter(from) {
    const back = from === 'corner';
    this.boy.x = back ? W - 60 : 200;
    this.boy.dir = back ? -1 : 1;
    this.boy.target = null;
    this.game.setPlace('Muziekhandel Van der Velde');
    if (!this.greeted) {
      this.greeted = true;
      setTimeout(() => this.game.ui.open('keeper', { greeting: true }), 900);
    }
  }

  get nearSpot() {
    return nearestSpot(HOTSPOTS, this.boy.x);
  }

  interact() {
    this.nearSpot?.action(this.game);
  }

  click(wx, wy) {
    clickSpots(this, HOTSPOTS, wx, wy, 70, W - 40);
  }

  hover(wx, wy) {
    this.hovered = hitSpot(HOTSPOTS, wx, wy)?.spot || null;
    return !!this.hovered;
  }

  update(dt, input) {
    this.time += dt;
    this.boy.update(dt, input, 70, W - 40);
    // keep walking right into the listening corner
    if (input.right && this.boy.x >= W - 41) this.game.goTo('corner');
  }

  draw(ctx, view) {
    ctx.save();
    ctx.setTransform(view.base);
    ctx.fillStyle = '#120c08';
    ctx.fillRect(0, -400, view.viewW, H + 800);
    ctx.translate(-view.camX, 0);
    if (ready(IMG.wall)) ctx.drawImage(IMG.wall, 0, 0, W, H);

    for (const f of FRAMES) this.drawFrame(ctx, f);
    for (const item of FURNITURE) {
      const img = IMG[item.img];
      if (!ready(img)) continue;
      const [x, y, w, h] = box(item);
      // soft contact shadow on the floor
      ctx.save();
      if (!item.noShadow) {
        ctx.fillStyle = 'rgba(20,12,6,0.35)';
        ctx.beginPath(); ctx.ellipse(x + w / 2, item.bottom - 2, w * 0.52, 10, 0, 0, Math.PI * 2); ctx.fill();
      }
      if (item.clipBottom) { ctx.beginPath(); ctx.rect(x, y, w, item.clipBottom - y); ctx.clip(); }
      ctx.drawImage(img, x, y, w, h);
      ctx.restore();
    }

    // warm pulse around what the mouse points at, or what the boy stands next to
    const near = this.nearSpot;
    const lit = this.hovered || near;
    if (lit) drawOutline(ctx, lit, this.time);

    this.boy.draw(ctx, FOOT_Y, 235);
    // only the left silhouettes (lamp, plant, chair): the right ones would hide the cabinet
    if (ready(IMG.fg)) {
      const k = IMG.fg.naturalHeight / H;
      ctx.drawImage(IMG.fg, 0, 0, 600 * k, IMG.fg.naturalHeight, 0, 0, 600, H);
    }
    if (lit) drawLabel(ctx, lit, this.time, W, lit === near && !this.hovered);
    ctx.restore();
  }

  drawFrame(ctx, f) {
    const t = FRAME_TYPES[f.type];
    const s = f.h / t.h, w = t.w * s, x = f.cx - w / 2, y = f.top;
    const [l, tp, r, b] = t.inner;
    const ix = x + l * s, iy = y + tp * s, iw = (r - l) * s, ih = (b - tp) * s;
    if (ready(f.portrait)) {
      ctx.save();
      ctx.beginPath();
      if (t.oval) ctx.ellipse(ix + iw / 2, iy + ih / 2, iw / 2 + 2, ih / 2 + 2, 0, 0, Math.PI * 2);
      else ctx.rect(ix - 2, iy - 2, iw + 4, ih + 4);
      ctx.clip();
      // cover the opening, keeping the face near the top
      const p = f.portrait, ps = Math.max((iw + 4) / p.naturalWidth, (ih + 4) / p.naturalHeight);
      ctx.drawImage(p, ix + iw / 2 - p.naturalWidth * ps / 2, iy - 2, p.naturalWidth * ps, p.naturalHeight * ps);
      ctx.restore();
    }
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
    if (ready(FRAME_IMG[f.type])) ctx.drawImage(FRAME_IMG[f.type], x, y, w, f.h);
    ctx.restore();
    // brass name plaque
    ctx.font = '700 11px "EB Garamond", serif';
    const pw = ctx.measureText(f.short).width + 14, py = y + f.h + 3;
    const g = ctx.createLinearGradient(0, py, 0, py + 15);
    g.addColorStop(0, '#e9c97a'); g.addColorStop(1, '#a87d34');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(f.cx - pw / 2, py, pw, 15, 3); ctx.fill();
    ctx.strokeStyle = '#4a3216'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#2a1a0a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(f.short, f.cx, py + 8);
  }
}
