// Inside the music shop, put together from the separate pieces in public/art/shop:
// the empty room (back-wall), the piano with the team's portraits above it, the counter
// with the shopkeeper, the cabinet, and foreground silhouettes. In the evening the hanging
// lamps light up, following the real time like the street. Walking out on the right leads to
// the listening corner (js/corner.js).
import { Boy } from './boy.js';
import { TEAM } from './data.js';
import { FRAME_TYPES, FRAME_SRC, TEAM_FRAME } from './frames.js';
import { hitSpot, nearestSpot, clickSpots, drawLabel } from './hotspots.js';
import { skyAt, currentHour } from './sky.js';

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

// counter.webp is a desk with three panels. To make it shorter without making it lower, the
// middle panel is cut out (from the middle of one pillar to the middle of the next), and the
// book that lay across the cut is put back whole.
let counterCut = null;
function counterArt() {
  const img = IMG.counter;
  if (!ready(img)) return null;
  if (!counterCut) {
    const A = 347, B = 678; // pillar centres in the image
    const c = document.createElement('canvas');
    c.width = img.naturalWidth - (B - A); c.height = img.naturalHeight;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0, A, c.height, 0, 0, A, c.height);
    g.drawImage(img, B, 0, img.naturalWidth - B, c.height, A, 0, img.naturalWidth - B, c.height);
    g.drawImage(img, 600, 60, 172, 70, 330, 60, 172, 70); // the book
    counterCut = c;
  }
  return counterCut;
}
const art = name => (name === 'counter' ? counterArt() : ready(IMG[name]) ? IMG[name] : null);

// Furniture: x, bottom y and width in world units; height follows the image.
// Drawn in this order, so the shopkeeper stands behind the counter. `wall` pieces stand against
// the back wall (its skirting meets the floor at y ≈ 575) and cast a soft shadow on it.
const FURNITURE = [
  { img: 'piano', x: 326, bottom: 598, w: 320, wall: true },
  { img: 'cabinet', x: 1112, bottom: 596, w: 270, wall: true },
  // waist at desk height (the desk top is just below the window sill, y ≈ 469)
  { img: 'keeper', x: 805, bottom: 676, w: 162, clipBottom: 650, noShadow: true },
  { img: 'counter', x: 666, bottom: 650, w: 436 },
];

// The three hanging lamps in back-wall.webp: where the bulb sits under each shade.
const LAMPS = [[518, 160], [982, 160], [1340, 160]];

// Gilded frames on the wall, each with a team portrait inside (see js/frames.js).
const FRAME_IMG = Object.fromEntries(Object.keys(FRAME_TYPES).map(n => [n, load(FRAME_SRC(n))]));
// A gallery wall above the piano: two by two, close together around the hanging lamp, which hangs
// in front of them (it is drawn again on top, see LAMP).
// Sized to the green wall panel between the pillars (x ≈ 345–710, below the beam at y ≈ 95).
const FRAMES = [
  { cx: 446, top: 126, h: 80, team: 'team-1' },
  { cx: 560, top: 126, h: 80, team: 'team-2' },
  { cx: 446, top: 212, h: 80, team: 'team-3' },
  { cx: 560, top: 212, h: 80, team: 'team-4' },
];
// The first hanging lamp, cut out of back-wall.webp (scripts/cut_shop_lamp.py), and where it goes.
const LAMP = { img: load(`${ART}shop/lamp.webp`), x: 474, y: 96, w: 92, h: 110 };
for (const f of FRAMES) {
  const t = TEAM.find(m => m.id === f.team);
  f.type = TEAM_FRAME[f.team];
  f.portrait = load(t.portrait);
  f.short = t.name;
}

function box(item) {
  const img = art(item.img);
  const h = img ? item.w * img.height / img.width : item.w;
  return [item.x, item.bottom - h, item.w, h];
}

// Where things are, in world units. `stands` is where the boy walks to, one per rect.
const HOTSPOTS = [
  { id: 'door', label: 'Naar buiten', rects: [[18, 150, 72, 450]], stands: [85], faceLeft: true, action: g => g.goTo('street') },
  { id: 'portraits', label: 'Schilderijen', rects: [[352, 98, 324, 204]], stands: [420], action: g => g.ui.open('gallery') },
  { id: 'piano', label: 'Piano', rects: [[326, 300, 320, 298]], stands: [490], action: g => g.ui.open('piano') },
  { id: 'keeper', label: 'Meneer Simone', rects: [[666, 270, 436, 380]], stands: [880], action: g => g.ui.open('keeper') },
  { id: 'next', label: 'Luisterhoek →', rects: [[1406, 120, 34, 560]], stands: [1400], action: g => g.goTo('corner') },
  { id: 'library', label: 'Bladmuziek', rects: [[1112, 205, 270, 391]], stands: [1250], action: g => g.ui.open('library') },
];

export class Shop {
  constructor(game) {
    this.game = game;
    this.width = W;
    this.fitWidth = W;
    this.boy = new Boy(200);
    this.boy.ground = 'wood';
    this.hovered = null;
    this.time = 0;
    this.greeted = false;
  }

  enter(from) {
    const back = from === 'corner';
    this.boy.x = back ? W - 60 : 200;
    this.boy.dir = back ? -1 : 1;
    this.boy.target = null;
    this.game.setPlace('Muziekhandel Simone');
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
    if (ready(LAMP.img)) ctx.drawImage(LAMP.img, LAMP.x, LAMP.y, LAMP.w, LAMP.h);
    for (const item of FURNITURE) {
      const img = art(item.img);
      if (!img) continue;
      const [x, y, w, h] = box(item);
      // soft contact shadow on the floor
      ctx.save();
      if (item.wall) {
        // against the wall: a dark halo on the wall around it, and a thin shadow where it meets the floor
        ctx.fillStyle = 'rgba(20,12,6,0.4)';
        ctx.beginPath(); ctx.ellipse(x + w / 2, item.bottom - 3, w * 0.5, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.shadowColor = 'rgba(8,5,2,0.6)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 6;
      } else if (!item.noShadow) {
        ctx.fillStyle = 'rgba(20,12,6,0.35)';
        ctx.beginPath(); ctx.ellipse(x + w / 2, item.bottom - 2, w * 0.52, 10, 0, 0, Math.PI * 2); ctx.fill();
      }
      if (item.clipBottom) { ctx.beginPath(); ctx.rect(x, y, w, item.clipBottom - y); ctx.clip(); }
      ctx.drawImage(img, x, y, w, h);
      ctx.restore();
    }

    const sky = skyAt(currentHour());
    // evening: the room gets darker and bluer…
    if (sky.dark > 0.01) {
      ctx.fillStyle = `rgba(14,16,40,${sky.dark * 0.45})`;
      ctx.fillRect(0, 0, W, H);
    }

    // warm pulse around what the mouse points at, or what the boy stands next to
    const near = this.nearSpot;
    const lit = this.hovered || near;

    ctx.save();
    if (sky.dark > 0) ctx.filter = `brightness(${1 - sky.dark * 0.25})`;
    this.boy.draw(ctx, FOOT_Y, 235);
    ctx.restore();
    // …and the hanging lamps come on
    this.drawLamps(ctx, sky);
    // only the left silhouettes (lamp, plant, chair): the right ones would hide the cabinet
    if (ready(IMG.fg)) {
      const k = IMG.fg.naturalHeight / H;
      ctx.drawImage(IMG.fg, 0, 0, 600 * k, IMG.fg.naturalHeight, 0, 0, 600, H);
    }
    if (lit) drawLabel(ctx, lit, this.time, W, lit === near && !this.hovered);
    ctx.restore();
  }

  // Lamps go on with the street lamps (sky.lampsOn) and get brighter as it gets darker. Kept dim on
  // purpose: an old shop lit by a few bulbs, not a bright room.
  drawLamps(ctx, sky) {
    if (!sky.lampsOn) return;
    const a = Math.min(1, (sky.dark - 0.3) / 0.4);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    LAMPS.forEach(([x, y], i) => {
      const f = 0.95 + 0.03 * Math.sin(this.time * 9 + i * 2) + 0.02 * Math.sin(this.time * 23 + i);
      // the bulb
      const bulb = ctx.createRadialGradient(x, y, 1, x, y, 26);
      bulb.addColorStop(0, `rgba(255,240,190,${0.85 * a * f})`); bulb.addColorStop(1, 'rgba(255,214,140,0)');
      ctx.fillStyle = bulb; ctx.fillRect(x - 26, y - 26, 52, 52);
      // light falling from the shade: a few cones on top of each other, so the edges are soft
      const cone = ctx.createLinearGradient(0, y, 0, 640);
      cone.addColorStop(0, `rgba(255,205,120,${0.045 * a * f})`); cone.addColorStop(1, 'rgba(255,205,120,0)');
      ctx.fillStyle = cone;
      for (const spread of [240, 190, 140, 95]) {
        const top = 14 + spread * 0.1;
        ctx.beginPath(); ctx.moveTo(x - top, y); ctx.lineTo(x + top, y); ctx.lineTo(x + spread, 640); ctx.lineTo(x - spread, 640); ctx.closePath(); ctx.fill();
      }
      // warm glow on the wall around it
      const glow = ctx.createRadialGradient(x, y, 10, x, y, 280);
      glow.addColorStop(0, `rgba(255,200,120,${0.2 * a * f})`); glow.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = glow; ctx.fillRect(x - 280, y - 280, 560, 560);
      // pool of light on the floor
      const pool = ctx.createRadialGradient(x, 660, 5, x, 660, 220);
      pool.addColorStop(0, `rgba(255,205,130,${0.14 * a * f})`); pool.addColorStop(1, 'rgba(255,205,130,0)');
      ctx.fillStyle = pool; ctx.fillRect(x - 220, 440, 440, 440);
    });
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
    if (!f.short) return;
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
