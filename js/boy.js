// The player: an 8-frame walk cycle that walks with the arrow keys or to a clicked spot.

const FRAME_W = 180, FRAME_H = 277, FRAMES = 8;

export const boyImage = new Image();
boyImage.src = 'assets/boy-walk.png';

export class Boy {
  constructor(x) {
    this.x = x;
    this.dir = 1;
    this.moving = false;
    this.t = 0;
    this.idleT = 0;
    this.target = null;
    this.onArrive = null;
    this.speed = 230;
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
  }

  draw(ctx, footY, height) {
    const w = height * FRAME_W / FRAME_H;
    const frame = this.moving ? Math.floor(this.t * this.speed / 26) % FRAMES : 0;
    const breathe = this.moving ? 0 : Math.sin(this.idleT * 2.2) * 0.008;
    ctx.save();
    ctx.translate(this.x, footY);
    ctx.fillStyle = 'rgba(20,12,6,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, -2, w * 0.38, height * 0.035, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.scale(this.dir, 1 + breathe);
    if (boyImage.complete && boyImage.naturalWidth) {
      ctx.drawImage(boyImage, frame * FRAME_W, 0, FRAME_W, FRAME_H, -w / 2, -height, w, height);
    }
    ctx.restore();
  }
}
