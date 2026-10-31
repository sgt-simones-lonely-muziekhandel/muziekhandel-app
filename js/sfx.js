// Sound effects. Recordings (public/audio, made by scripts/import_sounds.py): footsteps, rain,
// thunder and the time travel's chimes and gust of wind. Made with Tone.js: the shop door with its
// bell and paper being picked up. They play once the player has pressed Start (the browser only
// allows sound after a click); before that, or when Tone isn't there, every function quietly does
// nothing.

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

// ---- weather -----------------------------------------------------------------------------
// Distant thunder: one of three recorded rumbles, `delay` seconds from now (the sound takes a
// while to get here after the flash), `strength` 0–1 for nearer or further away.
let rumbles = null;
const RUMBLES = [0, 1, 2].map(i => `public/audio/weather/thunder-${i}.m4a`);
// Loads the rumbles ahead, so the first flash isn't silent; rainy scenes call it when they start.
export function loadThunder() {
  if (live()) rumbles ??= RUMBLES.map(url => new Tone.Player({ url, volume: -13 }).connect(out()));
}
export function thunder(delay = 1, strength = 1) {
  loadThunder();
  if (!rumbles) return;
  const free = rumbles.filter(p => p.loaded && p.state !== 'started');
  if (!free.length) return;
  const p = free[Math.floor(Math.random() * free.length)];
  p.volume.value = -13 + 20 * Math.log10(Math.max(0.05, strength));
  p.start(Tone.now() + delay);
}

// Thunder that is still rolling fades out quickly (the story wants quiet when the crate opens).
export function hushThunder() {
  for (const p of rumbles || []) if (p.state === 'started') {
    p.volume.rampTo(-60, 0.8);
    p.stop(Tone.now() + 0.9);
  }
}

// Soft rain on puddles, a recorded loop. The scene sets how hard it rains (0–1) every frame with
// rain(level); when that stops (another scene, or a film that's over) it fades out by itself.
let shower = null;
export function rain(level) {
  if (!live()) return;
  if (!shower) {
    const gain = new Tone.Gain(0).connect(out());
    const player = new Tone.Player({ url: 'public/audio/weather/rain.m4a', loop: true, autostart: true }).connect(gain);
    shower = { gain, player, seen: 0 };
    shower.timer = setInterval(() => {
      if (performance.now() - shower.seen < 300) return;
      const r = shower;
      shower = null;
      clearInterval(r.timer);
      r.gain.gain.rampTo(0, 1);
      setTimeout(() => { r.player.stop(); r.player.dispose(); r.gain.dispose(); }, 1500);
    }, 150);
  }
  shower.seen = performance.now();
  shower.gain.gain.rampTo(0.1 * Math.max(0, Math.min(1, level)), 0.4);
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
// A sparkling chime as the lid comes off the tube, and one short gust of wind with a little chime
// in it as the swirl carries the boy to the past: 2.5 seconds, then quiet (BigSoundBank, CC0).
// Loaded when the story starts (`loadTimeTravel()`).
let travel = null;
export function loadTimeTravel() {
  if (!live() || travel) return;
  const chimeSoft = new Tone.Filter({ frequency: 6500, type: 'lowpass' }).connect(out());
  travel = {
    gust: new Tone.Player({ url: 'public/audio/time-travel/gust.m4a', volume: -12 }).connect(out()),
    chime: new Tone.Player({ url: 'public/audio/time-travel/chime.m4a', volume: -18 }).connect(chimeSoft),
    // the sparkle keeps more of its shine: only the very top is taken off
    sparkle: new Tone.Player({ url: 'public/audio/time-travel/sparkle.m4a', volume: -14 }).connect(new Tone.Filter({ frequency: 11000, type: 'lowpass' }).connect(out())),
  };
}
export function tubeSparkle() {
  loadTimeTravel();
  if (travel?.sparkle.loaded) travel.sparkle.start();
  halo();
}

// Under the sparkle, a halo: a soft choir singing "aah" on an open A major chord that swells up
// slowly and fades into a long echo, as if heaven opens. Saw-wave voices, a little detuned and
// wavering, shaped into the vowel by two band-pass filters (its formants, about 750 and 1150 Hz),
// with a quiet high shimmer an octave above.
let choir = null;
function halo() {
  if (!live()) return;
  choir ??= (() => {
    const hall = new Tone.Reverb({ decay: 4, wet: 0.65 }).connect(out());
    const aah = [750, 1150].map(frequency => new Tone.Filter({ frequency, type: 'bandpass', Q: 4 }).connect(hall));
    const waver = new Tone.Vibrato(5, 0.06);
    aah.forEach(f => waver.connect(f));
    const voices = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsawtooth', count: 3, spread: 16 },
      envelope: { attack: 0.9, decay: 0.4, sustain: 0.7, release: 1.8 }, volume: -22,
    }).connect(waver);
    const shimmer = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' }, envelope: { attack: 1.2, decay: 0.3, sustain: 0.6, release: 2 }, volume: -36,
    }).connect(hall);
    return { voices, shimmer };
  })();
  const now = Tone.now();
  choir.voices.triggerAttackRelease(['A3', 'E4', 'A4', 'C#5', 'E5'], 1.3, now);
  choir.shimmer.triggerAttackRelease(['A5', 'E6'], 1.2, now + 0.2);
}
export function timeTravel() {
  loadTimeTravel();
  if (!travel) return;
  const now = Tone.now();
  if (travel.gust.loaded) travel.gust.start(now);
  if (travel.chime.loaded) travel.chime.start(now + 0.35);
}
