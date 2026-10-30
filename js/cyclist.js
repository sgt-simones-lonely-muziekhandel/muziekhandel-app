// People on old Dutch bikes who ride past while the player stands still.

const INK = '#1d1510';
const KINDS = [
  { kind: 'heer', coat: '#3a3f4a', trousers: '#2b2b30', hat: 'bowler', skin: '#e8c4a0' },
  { kind: 'dame', coat: '#8e3b3b', skirt: '#4a3626', hat: 'wide', skin: '#f0cfae', basket: true },
  { kind: 'bakker', coat: '#e9e2d0', trousers: '#5b4a3a', hat: 'cap', skin: '#e2b893', basket: true },
  { kind: 'dame', coat: '#3f5566', skirt: '#6b7a6a', hat: 'wide', skin: '#e8c4a0' },
];

export class Cyclist {
  constructor(dir, x) {
    this.dir = dir;
    this.x = x;
    this.speed = 150 + Math.random() * 70;
    this.wheel = 0;
    this.look = KINDS[Math.floor(Math.random() * KINDS.length)];
  }

  update(dt) {
    this.x += this.dir * this.speed * dt;
    this.wheel += this.speed * dt / 30;
  }

  draw(ctx, groundY) {
    const L = this.look, R = 30;
    ctx.save();
    ctx.translate(this.x, groundY);
    ctx.scale(this.dir * 1.3, 1.3);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    const rear = [-46, -R], front = [46, -R], crank = [-4, -R - 2];
    const seat = [-20, -R - 58], head = [32, -R - 58], bar = [30, -R - 70];
    const a = this.wheel * 0.55;
    const pedal = ph => [crank[0] + 13 * Math.cos(a + ph), crank[1] + 13 * Math.sin(a + ph)];
    const hip = [seat[0] + 2, seat[1] - 6];
    const knee = foot => {
      const l1 = 34, l2 = 35;
      const dx = foot[0] - hip[0], dy = foot[1] - hip[1];
      const d = Math.min(l1 + l2 - 0.5, Math.hypot(dx, dy));
      const base = Math.atan2(dy, dx);
      const off = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
      return [hip[0] + l1 * Math.cos(base - off), hip[1] + l1 * Math.sin(base - off)];
    };
    const line = (pts, color, w) => {
      ctx.beginPath(); ctx.moveTo(...pts[0]); for (const p of pts.slice(1)) ctx.lineTo(...p);
      ctx.strokeStyle = INK; ctx.lineWidth = w + 3; ctx.stroke();
      ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();
    };
    const legColor = L.trousers || '#2a2420';

    // far leg (behind the bike)
    const p2 = pedal(Math.PI);
    line([hip, knee(p2), p2], shadeColor(legColor), 8);

    // wheels
    for (const [cx, cy] of [rear, front]) {
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke();
      ctx.lineWidth = 1;
      for (let k = 0; k < 8; k++) {
        const t = this.wheel + k * Math.PI / 4;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(t) * R, cy + Math.sin(t) * R); ctx.stroke();
      }
    }
    // frame
    ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(...rear); ctx.lineTo(...seat); ctx.lineTo(...crank); ctx.lineTo(...rear);
    ctx.moveTo(...seat); ctx.lineTo(...head); ctx.lineTo(...front);
    ctx.moveTo(...crank); ctx.lineTo(head[0] - 3, head[1] + 14);
    ctx.moveTo(...head); ctx.lineTo(...bar); ctx.lineTo(bar[0] - 12, bar[1] - 2);
    ctx.stroke();
    // mudguard + saddle
    ctx.beginPath(); ctx.arc(rear[0], rear[1], R + 5, Math.PI * 1.05, Math.PI * 1.75); ctx.stroke();
    ctx.fillStyle = '#3a2618'; ctx.beginPath(); ctx.ellipse(seat[0], seat[1] - 2, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
    if (L.basket) {
      ctx.fillStyle = '#a07a45';
      ctx.beginPath(); ctx.roundRect(front[0] - 4, -R - 66, 26, 20, 3); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = L.kind === 'bakker' ? '#d9a45a' : '#e05a4f';
      ctx.beginPath(); ctx.arc(front[0] + 5, -R - 68, 6, 0, Math.PI * 2); ctx.arc(front[0] + 15, -R - 69, 6, 0, Math.PI * 2); ctx.fill();
    }

    // near leg
    const p1 = pedal(0);
    line([hip, knee(p1), p1], legColor, 8);
    ctx.fillStyle = INK; ctx.fillRect(p1[0] - 6, p1[1] - 2, 13, 5);

    // body
    const shoulder = [hip[0] + 13, hip[1] - 42];
    if (L.skirt) {
      const k1 = knee(p1), k2 = knee(p2);
      ctx.beginPath();
      ctx.moveTo(hip[0] - 8, hip[1] - 6);
      ctx.lineTo(Math.max(k1[0], k2[0]) + 8, Math.max(k1[1], k2[1]) + 12);
      ctx.lineTo(hip[0] - 14, Math.max(k1[1], k2[1]) + 18);
      ctx.closePath();
      ctx.fillStyle = L.skirt; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(hip[0] - 9, hip[1] + 2); ctx.lineTo(shoulder[0] - 10, shoulder[1]); ctx.lineTo(shoulder[0] + 8, shoulder[1] + 2); ctx.lineTo(hip[0] + 9, hip[1] + 2);
    ctx.closePath();
    ctx.fillStyle = L.coat; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
    line([[shoulder[0], shoulder[1] + 4], [shoulder[0] + 12, shoulder[1] + 22], [bar[0] - 8, bar[1]]], L.coat, 6);
    // head and hat
    const hd = [shoulder[0] + 5, shoulder[1] - 14];
    ctx.beginPath(); ctx.arc(hd[0], hd[1], 10, 0, Math.PI * 2);
    ctx.fillStyle = L.skin; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = INK;
    if (L.hat === 'bowler') {
      ctx.beginPath(); ctx.ellipse(hd[0], hd[1] - 8, 14, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(hd[0], hd[1] - 9, 9, Math.PI, 0); ctx.fill();
    } else if (L.hat === 'wide') {
      ctx.fillStyle = '#d9c7a0';
      ctx.beginPath(); ctx.ellipse(hd[0], hd[1] - 8, 20, 4, -0.1, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(hd[0], hd[1] - 9, 8, Math.PI, 0); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e05a4f'; ctx.beginPath(); ctx.arc(hd[0] - 6, hd[1] - 12, 3.5, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#4a4036';
      ctx.beginPath(); ctx.arc(hd[0], hd[1] - 6, 10, Math.PI, 0); ctx.fill();
      ctx.fillRect(hd[0], hd[1] - 8, 14, 3);
    }
    ctx.restore();
  }
}

function shadeColor(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${[n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * 0.7)).join(',')})`;
}
