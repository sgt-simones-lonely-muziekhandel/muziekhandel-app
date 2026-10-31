// Sound effects: footsteps and the time travel's gust of wind are recordings (public/audio, made by
// scripts/import_sounds.py); the shop door with its bell, distant thunder and paper being picked up
// are made with Tone.js. They play once the player has pressed Start (the browser only allows
// sound after a click); before that, or when Tone isn't there, every function quietly does nothing.

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
// Recorded steps (Kenney, CC0), five of each so no two in a row are alike, played a little lower
// and muffled so they sound soft: cobbles in 1900 (`stone`), the shop's floor (`wood`), puddles in
// the flooded future (`wet`). The first step loads them, so it may be silent.
const GROUND = {
  stone: { level: 0.08, rate: [0.72, 0.82] },
  wood: { level: 0.08, rate: [0.8, 0.9] },
  wet: { level: 0.07, rate: [0.62, 0.72] },
};
const feet = {};
export function step(ground = 'stone') {
  if (!live()) return;
  const g = GROUND[ground] || GROUND.stone;
  const f = feet[ground] ??= (() => {
    const gain = new Tone.Gain(g.level).connect(out());
    const soft = new Tone.Filter({ frequency: 1600, type: 'lowpass', rolloff: -24 }).connect(gain);
    const players = [0, 1, 2, 3, 4].map(i => new Tone.Player(`public/audio/steps/${ground}-${i}.m4a`).connect(soft));
    return { players, last: -1 };
  })();
  // a different recording each time, never the same twice in a row
  let i = Math.floor(Math.random() * 4);
  if (i >= f.last) i++;
  f.last = i;
  const p = f.players[i];
  if (!p.loaded) return;
  p.playbackRate = rand(...g.rate);
  p.start();
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
// One short gust of wind with a little chime in it (BigSoundBank, CC0), as the swirl carries the
// boy to the past: 2.5 seconds, then quiet. Loaded when the story starts (`loadTimeTravel()`).
let travel = null;
export function loadTimeTravel() {
  if (!live() || travel) return;
  const chimeSoft = new Tone.Filter({ frequency: 6500, type: 'lowpass' }).connect(out());
  travel = {
    gust: new Tone.Player({ url: 'public/audio/time-travel/gust.m4a', volume: -12 }).connect(out()),
    chime: new Tone.Player({ url: 'public/audio/time-travel/chime.m4a', volume: -18 }).connect(chimeSoft),
  };
}
export function timeTravel() {
  loadTimeTravel();
  if (!travel) return;
  const now = Tone.now();
  if (travel.gust.loaded) travel.gust.start(now);
  if (travel.chime.loaded) travel.chime.start(now + 0.35);
}
