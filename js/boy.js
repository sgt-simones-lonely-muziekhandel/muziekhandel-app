// The player: a cut-out puppet built from the pieces in public/art/characters/kid-past
// (head, torso, upper/lower arms and legs). Each piece turns around its joint, so the walk
// is posed every frame: legs swing and bend, arms swing the other way, the body rides up
// and down on whichever foot is on the ground. Walks with the arrow keys or to a clicked spot.
// The future boy (characters/kid-future, grey jacket and gas mask) was cut from the same sheet
// layout, so his pieces share the same joints. The torso is torso-armless.webp: torso.webp has
// both sleeves painted on, which with the swinging arm pieces gave him four arms
// (scripts/make_armless_torso.py takes them off).

import { step } from './sfx.js';

const ready = img => img.complete && img.naturalWidth > 0;

// Joints in each piece's own pixels. `pivot` is where it hangs from; `end` is where the next piece
// hangs (elbow, knee); `soles` are heel, middle and toe of the shoe. All pieces share one scale.
const kits = new Map();
function parts(kit) {
  if (kits.has(kit)) return kits.get(kit);
  const load = name => { const i = new Image(); i.src = `public/art/characters/${kit}/${name}.webp`; return i; };
  const P = {
    torso: { img: load('torso-armless'), neck: [156, 14], shoulder: [128, 50], hipFront: [150, 196], hipBack: [124, 196] },
    head: { img: load('head'), pivot: [96, 158] },
    upperArm1: { img: load('upper-arm-1'), pivot: [54, 21], end: [25, 91] },
    lowerArm1: { img: load('lower-arm-1'), pivot: [25, 19] },
    upperArm2: { img: load('upper-arm-2'), pivot: [23, 20], end: [55, 93] },
    lowerArm2: { img: load('lower-arm-2'), pivot: [57, 18] },
    upperLeg1: { img: load('upper-leg-1'), pivot: [52, 21], end: [40, 124] },
    lowerLeg1: { img: load('lower-leg-1'), pivot: [60, 13], soles: [[28, 150], [78, 158], [115, 152]] },
    upperLeg2: { img: load('upper-leg-2'), pivot: [33, 19], end: [49, 124] },
    lowerLeg2: { img: load('lower-leg-2'), pivot: [27, 11], soles: [[9, 143], [55, 147], [110, 141]] },
  };
  // The angle (forward of straight down) each upper piece already has in its picture.
  for (const p of Object.values(P)) {
    p.rest = p.end ? Math.atan2(p.end[0] - p.pivot[0], p.end[1] - p.pivot[1]) : 0;
  }
  kits.set(kit, P);
  return P;
}
const FIGURE_H = 600; // head top to sole, in piece pixels, standing straight

// The far arm and leg are drawn a little darker so the body reads as round.
const shaded = new Map();
function shade(img) {
  if (!ready(img)) return null;
  if (!shaded.has(img)) {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = 'rgba(25,14,6,0.28)';
    g.fillRect(0, 0, c.width, c.height);
    shaded.set(img, c);
  }
  return shaded.get(img);
}

const D = Math.PI / 180;
const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];

export class Boy {
  constructor(x, kit = 'kid-past') {
    this.parts = parts(kit);
    this.x = x;
    this.dir = 1;
    this.moving = false;
    this.t = 0;
    this.idleT = 0;
    this.phase = 0;  // walk cycle, radians
    this.stride = 0; // 0 standing … 1 full walk, eased so starting and stopping look smooth
    this.target = null;
    this.onArrive = null;
    this.speed = 230;
    this.lastHeight = 235;
    this.ground = 'stone'; // what the footsteps sound like (see js/sfx.js); each scene sets it
    this.steps = 0;        // footfalls so far, to hear each one once
  }

  walkTo(x, onArrive = null) {
    this.target = x;
    this.onArrive = onArrive;
  }

  update(dt, input, minX, maxX) {
    let vx = 0;
    if (input.left || input.right) {
      this.target = null; this.onArrive = null;
      vx = input.left ? -1 : 1;
    } else if (this.target != null) {
      const d = this.target - this.x;
      if (Math.abs(d) < 5) {
        this.target = null;
        const cb = this.onArrive; this.onArrive = null;
        cb?.();
      } else vx = Math.sign(d);
    }
    const before = this.x;
    this.x = Math.max(minX, Math.min(maxX, this.x + vx * this.speed * dt));
    if (this.x === before && vx) { // blocked by the edge
      if (this.target != null) { this.target = null; const cb = this.onArrive; this.onArrive = null; cb?.(); }
      vx = 0;
    }
    this.moving = vx !== 0;
    if (vx) this.dir = vx;
    if (this.moving) { this.t += dt; this.idleT = 0; } else this.idleT += dt;

    // one full cycle (two steps) per ~0.72 figure heights walked
    const cycle = this.lastHeight * 0.72;
    this.phase += (Math.abs(this.x - before) / cycle) * Math.PI * 2;
    this.stride += ((this.moving ? 1 : 0) - this.stride) * Math.min(1, dt * 9);
    // when stopping, let the legs come together instead of freezing mid-step
    if (!this.moving && this.stride > 0.02) this.phase += dt * 7 * this.stride;
    this.footfall();
  }

  // Walking on the spot (going through a door): the legs keep moving while x stays put.
  march(dt) {
    this.stride += (1 - this.stride) * Math.min(1, dt * 9);
    this.phase += dt * 8;
    this.idleT = 0;
    this.footfall();
  }

  // A foot lands when its leg is furthest forward (phase π/2, then every π): a footstep sound,
  // only while really walking, not while the legs come together after stopping.
  footfall() {
    const n = Math.floor((this.phase - Math.PI / 2) / Math.PI);
    if (n !== this.steps && this.stride > 0.5) step(this.ground);
    this.steps = n;
  }

  // Joint angles in radians, forward of straight down.
  pose() {
    const s = this.stride, p = this.phase;
    const breath = Math.sin(this.idleT * 2.2) * (1 - s);
    const leg = ph => {
      const hip = 26 * D * Math.sin(ph) * s;
      // the knee bends while the leg swings forward, and a little all the time
      const knee = -(4 + 42 * Math.max(0, Math.cos(ph))) * D * s;
      return { hip, shin: hip + knee };
    };
    // standing: feet a little apart, the near one forward
    const stand = (l, deg) => ({ hip: l.hip + deg * D * (1 - s), shin: l.shin + deg * D * (1 - s) });
    const arm = ph => {
      const sh = -22 * D * Math.sin(ph) * s + breath * 1.5 * D;
      return { sh, fore: sh + (12 + 16 * Math.max(0, -Math.sin(ph))) * D * s + 6 * D };
    };
    return {
      lean: 4 * D * s,
      head: (-2 * D * s) + Math.sin(p * 2) * 1.5 * D * s + breath * 1.2 * D,
      breath,
      leg1: stand(leg(p), 10), leg2: stand(leg(p + Math.PI), -9),
      arm1: arm(p), arm2: arm(p + Math.PI),
    };
  }

  draw(ctx, footY, height) {
    this.lastHeight = height;
    const P = this.parts, T = P.torso;
    const pose = this.pose();
    const k = height / FIGURE_H;

    // Body space: the point between the hips is (0, 0), y down, the boy faces +x.
    const hipC = [(T.hipFront[0] + T.hipBack[0]) / 2, T.hipFront[1]];
    const torsoRot = pose.lean;
    const fromTorso = pt => rot([pt[0] - hipC[0], pt[1] - hipC[1]], torsoRot);

    const limb = (upper, lower, root, a) => {
      const ru = upper.rest - a.hip;          // canvas rotation of the upper piece
      const knee = add(root, rot([upper.end[0] - upper.pivot[0], upper.end[1] - upper.pivot[1]], ru));
      const rl = -a.shin;
      const low = lower.soles ? Math.max(...lower.soles.map(([x, y]) => add(knee, rot([x - lower.pivot[0], y - lower.pivot[1]], rl))[1])) : 0;
      return { upper, lower, root, ru, knee, rl, low };
    };
    const legF = limb(P.upperLeg1, P.lowerLeg1, fromTorso(T.hipFront), pose.leg1);
    const legB = limb(P.upperLeg2, P.lowerLeg2, fromTorso(T.hipBack), pose.leg2);
    const sh = fromTorso(T.shoulder);
    const armF = limb(P.upperArm1, P.lowerArm1, sh, { hip: pose.arm1.sh, shin: pose.arm1.fore });
    const armB = limb(P.upperArm2, P.lowerArm2, add(sh, [-14, 4]), { hip: pose.arm2.sh, shin: pose.arm2.fore });
    // stand on whichever foot is lower
    const ground = Math.max(legF.low, legB.low);

    ctx.save();
    ctx.translate(this.x, footY);
    // shadow on the floor
    ctx.fillStyle = 'rgba(20,12,6,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, -2, height * 0.2, height * 0.035, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.scale(this.dir * k, k);
    ctx.translate(-10, -ground);

    const piece = (part, at, r, dark) => {
      const img = dark ? shade(part.img) : part.img;
      if (!img || !ready(part.img)) return;
      ctx.save();
      ctx.translate(at[0], at[1]);
      ctx.rotate(r);
      ctx.drawImage(img, -part.pivot[0], -part.pivot[1]);
      ctx.restore();
    };
    const drawLimb = (l, dark) => { piece(l.lower, l.knee, l.rl, dark); piece(l.upper, l.root, l.ru, dark); };

    drawLimb(armB, true);
    drawLimb(legB, true);
    drawLimb(legF, false);
    // torso, breathing a touch
    if (ready(T.img)) {
      ctx.save();
      ctx.rotate(torsoRot);
      ctx.scale(1, 1 + pose.breath * 0.012);
      ctx.drawImage(T.img, -hipC[0], -hipC[1]);
      ctx.restore();
    }
    piece(P.head, fromTorso(T.neck), torsoRot + pose.head, false);
    drawLimb(armF, false);
    ctx.restore();
  }
}
