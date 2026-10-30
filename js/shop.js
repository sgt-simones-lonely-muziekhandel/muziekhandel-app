// Inside Muziekhandel Van der Velde. The background is a painted scene; hotspots sit on top of it.
import { Boy } from './boy.js';

const W = 1440, H = 720;
const FOOT_Y = 706;
const INK = '#1d1510';

const bg = new Image();
bg.src = 'assets/shop-interior.jpg';

// Areas in background-image coordinates. `stand` is where the boy walks to before opening it.
const HOTSPOTS = [
  { id: 'door', label: 'Naar buiten', icon: '🚪', rects: [[18, 200, 82, 410]], stand: 95, action: g => g.goTo('street') },
  { id: 'library', label: 'Bladmuziek', icon: '📜', rects: [[118, 104, 200, 482]], stand: 215, action: g => g.ui.open('library') },
  { id: 'portraits', label: 'Componisten', icon: '🖼️', rects: [[368, 128, 330, 268], [948, 130, 225, 280]], stand: 560, action: g => g.ui.open('gallery') },
  { id: 'piano', label: 'Piano', icon: '🎹', rects: [[420, 285, 330, 365]], stand: 600, action: g => g.ui.open('piano') },
  { id: 'keeper', label: 'Meneer Van der Velde', icon: '💬', rects: [[935, 295, 140, 175], [912, 455, 236, 170]], stand: 1030, action: g => g.ui.open('keeper') },
  { id: 'gramophone', label: 'Grammofoon', icon: '🎵', rects: [[1272, 335, 145, 300]], stand: 1300, action: g => g.ui.open('gramophone') },
];

// The painted plaques have spelling mistakes; we put clean brass plaques over them.
const PLAQUES = [
  [534, 319, 'Beethoven'], [988, 256, 'Vivaldi'], [1122, 256, 'Händel'], [417, 400, 'Mozart'],
];

export class Shop {
  constructor(game) {
    this.game = game;
    this.width = W;
    this.fitWidth = W;
    this.boy = new Boy(260);
    this.hover = null;
    this.time = 0;
    this.greeted = false;
  }

  enter() {
    this.boy.x = 260;
    this.boy.dir = 1;
    this.boy.target = null;
    this.game.setPlace('Muziekhandel Van der Velde');
    if (!this.greeted) {
      this.greeted = true;
      setTimeout(() => this.game.ui.open('keeper', { greeting: true }), 900);
    }
  }

  spotAt(wx, wy) {
    return HOTSPOTS.find(h => h.rects.some(([x, y, w, hh]) => wx >= x && wx <= x + w && wy >= y && wy <= y + hh));
  }

  get nearSpot() {
    let best = null, bd = 90;
    for (const h of HOTSPOTS) {
      const d = Math.abs(this.boy.x - h.stand);
      if (d < bd) { bd = d; best = h; }
    }
    return best;
  }

  interact() {
    this.nearSpot?.action(this.game);
  }

  click(wx, wy) {
    const spot = this.spotAt(wx, wy);
    if (spot) {
      this.boy.walkTo(spot.stand, () => {
        this.boy.dir = spot.id === 'door' ? -1 : this.boy.dir;
        spot.action(this.game);
      });
    } else {
      this.boy.walkTo(Math.max(70, Math.min(W - 40, wx)));
    }
  }

  hoverAt(wx, wy) {
    this.hover = this.spotAt(wx, wy) || null;
    return !!this.hover;
  }

  update(dt, input) {
    this.time += dt;
    this.boy.update(dt, input, 70, W - 40);
  }

  draw(ctx, view) {
    ctx.save();
    ctx.setTransform(view.base);
    ctx.fillStyle = '#120c08';
    ctx.fillRect(0, -400, view.viewW, H + 800);
    ctx.translate(-view.camX, 0);
    if (bg.complete && bg.naturalWidth) ctx.drawImage(bg, 0, 0, W, H);

    ctx.font = '700 11px "EB Garamond", serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const [x, y, name] of PLAQUES) {
      const g = ctx.createLinearGradient(0, y - 8, 0, y + 8);
      g.addColorStop(0, '#e9c97a'); g.addColorStop(1, '#a87d34');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.roundRect(x - 30, y - 8, 60, 16, 3); ctx.fill();
      ctx.strokeStyle = '#4a3216'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#2a1a0a'; ctx.fillText(name, x, y + 1);
    }

    // warm pulse around what the mouse points at, or what the boy stands next to
    const near = this.nearSpot;
    const lit = this.hover || near;
    if (lit) {
      const pulse = 0.55 + 0.45 * Math.sin(this.time * 4);
      ctx.save();
      ctx.shadowColor = 'rgba(255,214,120,0.9)';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = `rgba(255,214,120,${0.5 + pulse * 0.4})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 7]);
      ctx.lineDashOffset = -this.time * 20;
      for (const [x, y, w, h] of lit.rects) { ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.stroke(); }
      ctx.restore();
      const [x, y, w] = lit.rects[0];
      this.drawTag(ctx, x + w / 2, Math.max(40, y - 26), (lit === near && !this.hover ? '↑ ' : '') + lit.label);
    }

    this.boy.draw(ctx, FOOT_Y, 250);
    ctx.restore();
  }

  drawTag(ctx, x, y, text) {
    ctx.font = '800 19px "Nunito Sans", sans-serif';
    const w = ctx.measureText(text).width + 34;
    x = Math.max(w / 2 + 8, Math.min(W - w / 2 - 8, x));
    ctx.save();
    ctx.translate(x, y + Math.sin(this.time * 3) * 3);
    ctx.beginPath();
    ctx.moveTo(-w / 2, -19); ctx.lineTo(w / 2, -20); ctx.lineTo(w / 2 + 2, 19); ctx.lineTo(9, 20); ctx.lineTo(0, 31); ctx.lineTo(-9, 20); ctx.lineTo(-w / 2 - 1, 19);
    ctx.closePath();
    ctx.fillStyle = '#f4e9d7'; ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 1);
    ctx.restore();
  }
}
