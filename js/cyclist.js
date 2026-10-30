// People on old Dutch bikes who ride past while the player stands still: cut-out puppets built
// from public/art/characters/cyclist-man and cyclist-woman. The wheels turn at their hubs, the
// crank turns at the bottom bracket and the legs follow the pedals (two-bone IK from hip to pedal).

const ready = img => img.ready || (img.complete && img.naturalWidth > 0);
const load = (dir, name) => { const i = new Image(); i.src = `public/art/characters/${dir}/${name}.webp`; return i; };

// Every rig is laid out in the pixels of its full.webp (the finished drawing), so it can be lined up
// against it. Static pieces: `at` is where the piece's `pivot` goes, `s` its scale, `r` a tilt (radians).
// Legs: `hip` in full px, `thigh`/`shin` lengths in full px; the lower-leg piece hangs from `pivot`
// and puts `foot` (the ball of the foot) on the pedal.
const RIGS = {
  man: {
    dir: 'cyclist-man', H: 566,
    // hubs and crank are points of bicycle.webp, placed with the bicycle's transform
    bicycle: { at: [222, 474], pivot: [169, 230], s: 1.0, r: -0.05, rearHub: [80, 212], frontHub: [330, 226] },
    wheels: [{ s: 1.17, pivot: [80, 81] }, { s: 1.17, pivot: [80, 81] }], wheelR: 95,
    crank: { pivot: [79, 34], s: 1.0, r: 55 },
    torso: { at: [212, 126], pivot: [75, 10], s: 1.0, r: 0.12, patch: [[31, 44, 18, [40, 64]]] },
    head: { at: [212, 126], pivot: [53, 120], s: 0.984, r: 0 },
    legs: {
      hip: [168, 296], thigh: 106, shin: 126,
      upper: [{ img: 'upper-leg-1', pivot: [25, 20], knee: [42, 100], s: 1.15 }, { img: 'upper-leg-2', pivot: [30, 20], knee: [40, 100], s: 1.15 }],
      lower: [{ img: 'lower-leg-1', pivot: [51, 9], foot: [42, 107], s: 1.12 }, { img: 'lower-leg-2', pivot: [23, 7], foot: [53, 105], s: 1.12 }],
    },
    order: ['wheels', 'legB', 'bicycle', 'crank', 'legF', 'torso', 'head'],
  },
  // The lady's long skirt can't be built from pieces convincingly, so her whole body (hat, head,
  // arms, skirt down to the hem) is cut straight out of full.webp (`body.outline`); only her boots
  // and stockings move under the hem, on the pedals. The bicycle is lined up on the drawing's hubs.
  woman: {
    dir: 'cyclist-woman', H: 549,
    bicycle: { at: [86, 447], pivot: [47, 219], s: 1.12, r: -0.048, rearHub: [47, 219], frontHub: [324, 235], bb: [162, 242] },
    wheels: [{ s: 1.17, pivot: [73, 71] }, { s: 1.0, pivot: [84, 84] }], wheelR: 84,
    crank: { pivot: [80, 34], s: 1.12, r: 60 },
    body: {
      outline: [[121, 66], [148, 14], [279, 21], [269, 48], [266, 103], [231, 128], [248, 172], [297, 217], [338, 228],
        [331, 259], [297, 272], [303, 324], [307, 414], [228, 429], [166, 433], [114, 431], [117, 324], [128, 238],
        [155, 207], [155, 138], [141, 103]],
      patch: [[172, 145, 9, [184, 166]]],
    },
    legs: {
      hip: [176, 328], thigh: 104, shin: 100,
      lower: [{ img: 'lower-leg-1', pivot: [36, 12], foot: [40, 105], s: 1.1, patch: [[36, 14, 11, [36, 34]]] },
        { img: 'lower-leg-2', pivot: [19, 12], foot: [45, 105], s: 1.1, patch: [[19, 14, 11, [19, 34]]] }],
    },
    order: ['wheels', 'legB', 'bicycle', 'crank', 'legF', 'body'],
  },
};

// The pieces have little round joint marks painted on them; `patch` covers those with the colour
// next to them: [x, y, radius, [sample x, sample y]].
function patched(img, patches) {
  const c = document.createElement('canvas');
  const paint = () => {
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    for (const [x, y, r, [sx, sy]] of patches) {
      const [R, G, B] = g.getImageData(sx, sy, 1, 1).data;
      g.fillStyle = `rgb(${R},${G},${B})`;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    c.ready = true;
  };
  if (ready(img)) paint(); else img.addEventListener('load', paint);
  return c;
}

// A piece of full.webp inside `outline`, with `patch` marks covered.
function cutOut(img, outline, patches) {
  const c = document.createElement('canvas');
  const paint = () => {
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.beginPath();
    outline.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.clip();
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    for (const [x, y, r, [sx, sy]] of patches || []) {
      const [R, G, B] = g.getImageData(sx, sy, 1, 1).data;
      g.fillStyle = `rgb(${R},${G},${B})`;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    c.ready = true;
  };
  if (ready(img)) paint(); else img.addEventListener('load', paint);
  return c;
}

// A point of bicycle.webp in full.webp pixels.
const onBike = (b, [x, y]) => {
  const dx = (x - b.pivot[0]) * b.s, dy = (y - b.pivot[1]) * b.s, c = Math.cos(b.r), s = Math.sin(b.r);
  return [b.at[0] + dx * c - dy * s, b.at[1] + dx * s + dy * c];
};

for (const rig of Object.values(RIGS)) {
  const L = n => load(rig.dir, n);
  rig.img = { bicycle: L('bicycle'), crank: L('crank'), wheel1: L('wheel-1'), wheel2: L('wheel-2'), full: L('full') };
  for (const key of ['torso', 'head', 'skirt']) {
    const p = rig[key];
    if (!p) continue;
    const img = L(p.img || key);
    p.image = p.patch ? patched(img, p.patch) : img;
  }
  [...(rig.legs.upper || []), ...rig.legs.lower].forEach(p => { p.image = p.patch ? patched(L(p.img), p.patch) : L(p.img); });
  rig.rear = onBike(rig.bicycle, rig.bicycle.rearHub);
  rig.front = onBike(rig.bicycle, rig.bicycle.frontHub);
  rig.bb = onBike(rig.bicycle, rig.bicycle.bb || rig.bicycle.pivot);
  if (rig.body) rig.body.image = cutOut(rig.img.full, rig.body.outline, rig.body.patch);
  rig.ground = Math.max(rig.rear[1], rig.front[1]) + rig.wheelR;
}
export const CYCLIST_RIGS = RIGS;

// The far leg is drawn a little darker so the rider reads as round.
const shaded = new Map();
function shade(img) {
  if (!ready(img)) return null;
  if (!shaded.has(img)) {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth || img.width; c.height = img.naturalHeight || img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = 'rgba(20,12,6,0.3)';
    g.fillRect(0, 0, c.width, c.height);
    shaded.set(img, c);
  }
  return shaded.get(img);
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const ang = v => Math.atan2(v[1], v[0]);

// Knee position for a leg from hip to foot, bending forward (+x).
function knee(hip, foot, l1, l2) {
  const d = Math.min(Math.hypot(foot[0] - hip[0], foot[1] - hip[1]), (l1 + l2) * 0.999);
  const a = Math.atan2(foot[1] - hip[1], foot[0] - hip[0]);
  const b = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const k1 = [hip[0] + l1 * Math.cos(a - b), hip[1] + l1 * Math.sin(a - b)];
  const k2 = [hip[0] + l1 * Math.cos(a + b), hip[1] + l1 * Math.sin(a + b)];
  return k1[0] > k2[0] ? k1 : k2;
}

// Draw a piece so that its point `from` lands on `at` and from→to points along `dir`, `len` long:
// stretched along the bone, `width` times across it.
function bone(ctx, img, from, to, at, dir, len, width) {
  if (!img) return;
  const rest = sub(to, from);
  ctx.save();
  ctx.translate(at[0], at[1]);
  ctx.rotate(dir);
  ctx.scale(len / Math.hypot(rest[0], rest[1]), width);
  ctx.rotate(-ang(rest));
  ctx.drawImage(img, -from[0], -from[1]);
  ctx.restore();
}

function piece(ctx, img, p, dy = 0, r = p.r || 0) {
  if (!img || !ready(img)) return;
  ctx.save();
  ctx.translate(p.at[0], p.at[1] + dy);
  ctx.rotate(r);
  ctx.scale(p.s, p.s);
  ctx.drawImage(img, -p.pivot[0], -p.pivot[1]);
  ctx.restore();
}

// Draw a rig in its own full.webp pixels, with the crank at angle `crank` and wheels at `wheel`.
export function drawRig(ctx, rig, crank, wheel) {
  const I = rig.img, Lg = rig.legs;
  const bob = Math.sin(crank * 2) * 1.5;
  const pedal = sgn => [rig.bb[0] + sgn * rig.crank.r * Math.cos(crank), rig.bb[1] + sgn * rig.crank.r * Math.sin(crank) - 6];
  const hip = [Lg.hip[0], Lg.hip[1] + bob];
  const leg = (i, sgn, dark) => {
    const foot = pedal(sgn);
    const k = knee(hip, foot, Lg.thigh, Lg.shin);
    const lo = Lg.lower[i], up = Lg.upper?.[i];
    const pick = img => (dark ? shade(img) : ready(img) ? img : null);
    bone(ctx, pick(lo.image), lo.pivot, lo.foot, k, ang(sub(foot, k)), Math.hypot(foot[0] - k[0], foot[1] - k[1]), lo.s);
    if (up) bone(ctx, pick(up.image), up.pivot, up.knee, hip, ang(sub(k, hip)), Lg.thigh, up.s);
  };
  for (const part of rig.order) {
    if (part === 'wheels') {
      for (const [img, hub, w] of [[I.wheel1, rig.rear, rig.wheels[0]], [I.wheel2, rig.front, rig.wheels[1]]]) {
        if (!ready(img)) continue;
        ctx.save();
        ctx.translate(hub[0], hub[1]);
        ctx.rotate(wheel);
        ctx.scale(w.s, w.s);
        ctx.drawImage(img, -w.pivot[0], -w.pivot[1]);
        ctx.restore();
      }
    } else if (part === 'bicycle') piece(ctx, I.bicycle, rig.bicycle);
    else if (part === 'crank') piece(ctx, I.crank, { at: rig.bb, pivot: rig.crank.pivot, s: rig.crank.s }, 0, crank);
    else if (part === 'legB') leg(1, -1, true);
    else if (part === 'legF') leg(0, 1, false);
    else if (part === 'torso') piece(ctx, rig.torso.image, rig.torso, bob);
    else if (part === 'head') piece(ctx, rig.head.image, rig.head, bob);
    else if (part === 'body' && ready(rig.body.image)) ctx.drawImage(rig.body.image, 0, bob);
  }
}

const RIDER_H = 200; // height on the street, in world units (the boy is 165)

export class Cyclist {
  constructor(dir, x) {
    this.dir = dir;
    this.x = x;
    this.speed = 150 + Math.random() * 70;
    this.rig = Math.random() < 0.5 ? RIGS.man : RIGS.woman;
    this.wheel = 0;
    this.crank = Math.random() * Math.PI * 2;
  }

  update(dt) {
    this.x += this.dir * this.speed * dt;
    const k = RIDER_H / this.rig.H;
    const turn = this.speed * dt / (this.rig.wheelR * k);
    this.wheel += turn;
    this.crank += turn * 0.45; // geared: the pedals go round slower than the wheels
  }

  draw(ctx, groundY) {
    const rig = this.rig, k = RIDER_H / rig.H;
    const cx = (rig.rear[0] + rig.front[0]) / 2;
    ctx.save();
    ctx.translate(this.x, groundY);
    ctx.fillStyle = 'rgba(20,12,6,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, -1, (rig.front[0] - rig.rear[0]) * k * 0.75, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.scale(this.dir * k, k);
    ctx.translate(-cx, -rig.ground);
    drawRig(ctx, rig, this.crank, this.wheel);
    ctx.restore();
  }
}
