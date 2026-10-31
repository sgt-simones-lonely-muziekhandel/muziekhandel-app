// Sound effects, made with Tone.js instead of recordings (nothing to load): footsteps, the shop
// door with its bell, distant thunder, paper being picked up, and the wind and chimes of the time
// travel. They play once the player has pressed Start (the browser only allows sound after a
// click); before that, or when Tone isn't there, every function quietly does nothing.

const live = () => typeof Tone !== 'undefined' && Tone.context.state === 'running';
const rand = (a, b) => a + Math.random() * (b - a);

// Everything goes through one bus: a little room reverb, then a limiter.
let bus = null, room = null;
function out() {
  if (!bus) {
    const limiter = new Tone.Limiter(-3).toDestination();
    bus = new Tone.Gain(0.9).connect(limiter);
    room = new Tone.Reverb({ decay: 3, wet: 0.35 }).connect(limiter);
  }
  return bus;
}

// ---- footsteps ---------------------------------------------------------------------------
// One step: a soft thump with a short scuff of noise on top. The ground decides the colour:
// cobbles in 1900 (`stone`), the shop's floor (`wood`), puddles in the flooded future (`wet`).
const GROUND = {
  stone: { thump: 'C2', scuff: 1500, q: 1.2, decay: 0.05, level: 0.5 },
  wood: { thump: 'G1', scuff: 700, q: 1, decay: 0.09, level: 0.7 },
  wet: { thump: 'A1', scuff: 2600, q: 0.6, decay: 0.16, level: 0.9 },
};
const feet = {};
export function step(ground = 'stone') {
  if (!live()) return;
  const g = GROUND[ground] || GROUND.stone;
  const f = feet[ground] ??= (() => {
    const gain = new Tone.Gain(g.level).connect(out());
    const filter = new Tone.Filter({ frequency: g.scuff, type: 'bandpass', Q: g.q }).connect(gain);
    const scuff = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.004, decay: g.decay, sustain: 0 } }).connect(filter);
    const thump = new Tone.MembraneSynth({ pitchDecay: 0.02, octaves: 2, envelope: { attack: 0.001, decay: 0.08, sustain: 0 }, volume: -14 }).connect(gain);
    return { filter, scuff, thump };
  })();
  const now = Tone.now();
  // no two steps alike
  f.filter.frequency.setValueAtTime(g.scuff * rand(0.8, 1.25), now);
  f.scuff.triggerAttackRelease(g.decay, now, rand(0.6, 1));
  f.thump.triggerAttackRelease(g.thump, 0.06, now, rand(0.4, 0.7));
  // in the water a little splash follows the step
  if (ground === 'wet') f.scuff.triggerAttackRelease(0.1, now + 0.07, rand(0.2, 0.4));
}

// ---- the shop door -----------------------------------------------------------------------
// The old door creaks on its hinges and the bell above it rings, swinging: two strikes and a
// softer third.
let bell = null;
export function shopDoor() {
  if (!live()) return;
  const now = Tone.now();
  // the creak: a low buzzing tone through a narrow filter, its pitch wobbling as the hinge turns
  const gain = new Tone.Gain(0).connect(out());
  const filter = new Tone.Filter({ frequency: 1100, type: 'bandpass', Q: 9 }).connect(gain);
  const hinge = new Tone.Oscillator(70, 'sawtooth').connect(filter);
  const wobble = Array.from({ length: 24 }, (_, i) => 70 + 30 * Math.sin(i * 0.9) * Math.random() + i * 2);
  hinge.frequency.setValueCurveAtTime(wobble, now, 0.9);
  filter.frequency.setValueCurveAtTime([900, 1400, 1100, 1600, 1250], now, 0.9);
  gain.gain.setValueAtTime(0, now).linearRampToValueAtTime(0.05, now + 0.15).linearRampToValueAtTime(0.035, now + 0.7).linearRampToValueAtTime(0, now + 0.95);
  hinge.start(now).stop(now + 1);
  setTimeout(() => [hinge, filter, gain].forEach(n => n.dispose()), 1500);
  // the bell: a few high partials that ring out, like a small brass shop bell
  bell ??= new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 1.4, sustain: 0, release: 0.6 }, volume: -25,
  }).connect(out()).connect(room);
  [[0.05, 1], [0.24, 0.8], [0.5, 0.45]].forEach(([at, v]) => {
    const f = 1760 * rand(0.99, 1.01);
    bell.triggerAttackRelease([f, f * 2.76, f * 5.4], 1.2, now + at, v);
  });
}

// ---- thunder -----------------------------------------------------------------------------
// Far away: a low rumble that rolls in, grumbles on for a few seconds and dies away. `delay`
// seconds after the flash, since the sound takes a while to get here.
export function thunder(delay = 1) {
  if (!live()) return;
  const at = Tone.now() + delay, len = rand(3.5, 5.5);
  const gain = new Tone.Gain(0).connect(out());
  const low = new Tone.Filter({ frequency: 260, type: 'lowpass', rolloff: -24 }).connect(gain);
  const noise = new Tone.Noise('brown').connect(low);
  // the rumble: it swells and falls back a few times, louder at the start
  const curve = Array.from({ length: 48 }, (_, i) => {
    const p = i / 47;
    const shape = Math.min(1, p * 8) * Math.pow(1 - p, 1.4);
    return shape * (0.55 + 0.45 * Math.abs(Math.sin(p * rand(9, 15)))) * 0.45;
  });
  gain.gain.setValueAtTime(0, at);
  gain.gain.setValueCurveAtTime(curve, at, len);
  low.frequency.setValueCurveAtTime([340, 220, 160, 120], at, len);
  noise.start(at).stop(at + len + 0.1);
  setTimeout(() => [noise, low, gain].forEach(n => n.dispose()), (delay + len + 1) * 1000);
}

// ---- paper -------------------------------------------------------------------------------
// Sheet music slid out of its compartment and picked up: a quick swish that brightens, then
// a small flap as the paper settles in the hand.
export function pickUpPaper() {
  if (!live()) return;
  const now = Tone.now();
  const gain = new Tone.Gain(0).connect(out());
  const filter = new Tone.Filter({ frequency: 1200, type: 'bandpass', Q: 0.8 }).connect(gain);
  const noise = new Tone.Noise('pink').connect(filter);
  filter.frequency.setValueAtTime(1000, now).exponentialRampToValueAtTime(4200, now + 0.28)
    .exponentialRampToValueAtTime(1600, now + 0.5);
  gain.gain.setValueAtTime(0, now).linearRampToValueAtTime(0.6, now + 0.06)
    .linearRampToValueAtTime(0.19, now + 0.3).linearRampToValueAtTime(0.45, now + 0.36)
    .linearRampToValueAtTime(0, now + 0.55);
  noise.start(now).stop(now + 0.6);
  setTimeout(() => [noise, filter, gain].forEach(n => n.dispose()), 1000);
}

// ---- the time travel ---------------------------------------------------------------------
// Sparkling chimes: high bell notes from a happy (pentatonic) scale, tumbling one after the
// other. `n` notes over `spread` seconds, higher and higher when `rising`.
const SPARKLE = ['E6', 'G6', 'A6', 'C7', 'D7', 'E7', 'G7', 'A7'];
let chimes = null;
export function sparkle({ n = 6, spread = 0.8, rising = true, level = 1 } = {}) {
  if (!live()) return;
  chimes ??= new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 3.01, modulationIndex: 6, volume: -12,
    envelope: { attack: 0.002, decay: 1.6, sustain: 0, release: 1 },
    modulationEnvelope: { attack: 0.002, decay: 0.4, sustain: 0, release: 0.4 },
  }).connect(out()).connect(room);
  const now = Tone.now();
  for (let i = 0; i < n; i++) {
    const k = rising ? Math.min(SPARKLE.length - 1, Math.floor(i / n * SPARKLE.length + rand(0, 2)))
      : Math.floor(rand(0, SPARKLE.length));
    chimes.triggerAttackRelease(SPARKLE[k], 0.8, now + (i / n) * spread + rand(0, 0.04), level * rand(0.35, 0.7));
  }
}

// The wind that blows while the world changes: rushing noise with a soft whistle, its colour
// slowly moving. The film sets how strong it is (0–1) every frame with wind(level); when that
// stops (the film is over or skipped) the wind dies down by itself.
let gust = null;
export function wind(level) {
  if (!live()) return;
  if (!gust) {
    const gain = new Tone.Gain(0).connect(out());
    const rush = new Tone.Filter({ frequency: 600, type: 'bandpass', Q: 0.6 }).connect(gain);
    const whistle = new Tone.Filter({ frequency: 1300, type: 'bandpass', Q: 7 }).connect(gain);
    const noise = new Tone.Noise('pink').start();
    noise.connect(rush);
    noise.connect(whistle);
    // gusts: both filters drift up and down at their own pace
    const sway = new Tone.LFO(0.13, 380, 950).connect(rush.frequency).start();
    const sing = new Tone.LFO(0.21, 900, 1900).connect(whistle.frequency).start();
    gust = { gain, nodes: [noise, rush, whistle, sway, sing, gain], seen: 0 };
    // when nobody sets the wind for a moment, it fades out and stops
    gust.timer = setInterval(() => {
      if (performance.now() - gust.seen < 300) return;
      const g = gust;
      gust = null;
      clearInterval(g.timer);
      g.gain.gain.rampTo(0, 0.8);
      setTimeout(() => g.nodes.forEach(n => n.dispose()), 1200);
    }, 150);
  }
  gust.seen = performance.now();
  gust.gain.gain.rampTo(0.55 * Math.max(0, Math.min(1, level)), 0.25);
}
