// Salamander Grand Piano via Tone.js, plus a "gramophone" colouring with crackle. The piano view
// can switch to another instrument (js/instruments.js): everything that plays through `voice`
// then sounds like that; the piano stays loaded underneath.
import { instrumentById, SAMPLE_BASE } from './instruments.js';

const SALAMANDER = 'https://tonejs.github.io/audio/salamander/';

let sampler = null;  // the piano
let voice = null;    // what plays now: the piano or the chosen instrument
const others = {};   // instrument id → a promise of its sampler, once asked for
let tone = null;     // lowpass that makes the gramophone sound old
let crackle = null;
let loading = null;
export const audioState = { ready: false, listeners: new Set() };

function salamanderUrls() {
  const urls = { A0: 'A0.mp3', C8: 'C8.mp3' };
  for (let o = 1; o <= 7; o++) {
    urls[`C${o}`] = `C${o}.mp3`;
    urls[`D#${o}`] = `Ds${o}.mp3`;
    urls[`F#${o}`] = `Fs${o}.mp3`;
    urls[`A${o}`] = `A${o}.mp3`;
  }
  return urls;
}

export function initAudio() {
  if (loading) return loading;
  loading = (async () => {
    await Tone.start();
    // The samples are quiet on their own: boost them, and let a limiter catch loud chords so nothing clips.
    const limiter = new Tone.Limiter(-1).toDestination();
    const reverb = new Tone.Reverb({ decay: 2.4, wet: 0.16 }).connect(limiter);
    tone = new Tone.Filter(18000, 'lowpass').connect(reverb);
    sampler = new Tone.Sampler({ urls: salamanderUrls(), baseUrl: SALAMANDER, release: 1.2, volume: 8 }).connect(tone);
    await Tone.loaded();
    voice = sampler;
    audioState.ready = true;
    audioState.listeners.forEach(fn => fn());
  })().catch(err => {
    console.error('Piano samples could not be loaded', err);
    loading = null;
    throw err;
  });
  return loading;
}

export const onAudioReady = fn => {
  if (audioState.ready) fn(); else audioState.listeners.add(fn);
};

const noteName = midi => Tone.Frequency(midi, 'midi').toNote();

// Play everything with instrument `id` ('piano' for the piano). Its samples load the first time;
// until then the piano keeps playing. Resolves when it can be heard.
export function setInstrument(id) {
  if (!audioState.ready) return Promise.reject(new Error('audio not ready'));
  if (id === 'piano') { voice.releaseAll?.(); voice = sampler; return Promise.resolve(); }
  const inst = instrumentById(id);
  others[id] ??= new Promise((resolve, reject) => {
    const s = new Tone.Sampler({
      urls: inst.urls, baseUrl: `${SAMPLE_BASE}${id}/`, release: 1, volume: -2,
      onload: () => resolve(s), onerror: reject,
    }).connect(tone);
  });
  others[id].catch(() => { delete others[id]; });
  return others[id].then(s => { voice.releaseAll?.(); voice = s; });
}

export function noteOn(midi, velocity = 0.8) {
  if (!audioState.ready) return;
  voice.triggerAttack(noteName(midi), Tone.now(), velocity);
}

export function noteOff(midi) {
  if (!audioState.ready) return;
  voice.triggerRelease(noteName(midi), Tone.now() + 0.05);
}

export function strike(midi, seconds = 0.6, velocity = 0.8) {
  if (!audioState.ready) return;
  voice.triggerAttackRelease(noteName(midi), seconds, Tone.now(), velocity);
}

/**
 * Play a parsed piece: the melody, and under it the piano accompaniment when the piece has one
 * (softer). The melody starts `parsed.offset` beats in, after the piano's introduction. Notes are
 * scheduled a little ahead of time so a stop() is near-instant. onNote(note) fires when each melody
 * note (or rest) starts; onKey(midi, down, part) fires when any key goes down or comes up, with
 * part 'melody' or 'accomp', so a keyboard on screen can show every note that sounds.
 * For practice: `from` / `to` (beats of the melody) play only that stretch (from the start, the
 * introduction too); `countIn` beats of metronome ticks come first, `metronome` keeps ticking
 * through the music, and onBeat({ count, accent }) fires on every tick (`count` 1, 2, 3… while
 * counting in). `melody: 0` leaves the melody to the player (silent, no keys, onNote still fires).
 * Returns { stop, duration, timeOf(note) } (timeOf: when the note sounds, on the audio clock).
 */
export function playPiece(parsed, {
  onNote, onKey, onEnd, onBeat, tempoScale = 1, from = 0, to = Infinity, countIn = 0, metronome = false, melody = 0.75,
} = {}) {
  if (!audioState.ready) { onEnd?.(); return { stop() {}, duration: 0, timeOf: () => 0 }; }
  const spb = parsed.secPerBeat / tempoScale;
  const sampler = voice; // the instrument it started with plays it to the end
  const off = parsed.offset;
  const accomp = parsed.accomp;
  // the stretch, in beats of the music (the accompaniment's clock: the melody starts `off` in)
  const lo = from <= 0 ? 0 : off + from;
  const notes = parsed.notes.filter(n => n.start >= from - 1e-6 && n.start < to - 1e-6);
  const acc = accomp.filter(a => a.start >= lo - 1e-6 && (to === Infinity || a.start < off + to - 1e-6));
  const hi = to === Infinity
    ? Math.max(off + parsed.totalBeats, ...accomp.map(a => a.start + a.dur))
    : off + Math.min(to, parsed.totalBeats);
  const t0 = Tone.now() + 0.15 + countIn * spb;
  const time = beat => t0 + (beat - lo) * spb;
  const end = time(hi);
  const at = n => time(off + n.start);
  const melLen = n => n.sound * spb * 0.92, accLen = a => a.dur * spb * 0.95;

  // every key down / up, in time order (an up before a down at the same moment)
  const keys = [];
  if (melody) for (const n of notes) if (!n.rest && !n.tied) keys.push([at(n), true, n.midi, 'melody'], [at(n) + melLen(n), false, n.midi, 'melody']);
  for (const a of acc) keys.push([time(a.start), true, a.midi, 'accomp'], [time(a.start) + accLen(a), false, a.midi, 'accomp']);
  keys.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  let nextKey = 0;
  const down = [];

  // metronome ticks on the beat grid of the bars (the first full bar starts on a downbeat)
  const anchor = off + (parsed.measures.length > 1 ? parsed.measures[1][0].start : 0);
  const bpm = parsed.beatsPerMeasure;
  const ticks = [];
  if (countIn || metronome) {
    const first = Math.ceil(lo - countIn - anchor - 1e-6), last = metronome ? hi : lo;
    for (let k = first; anchor + k < last - 1e-6; k++) {
      const beat = anchor + k;
      ticks.push({ at: time(beat), accent: ((k % bpm) + bpm) % bpm === 0, count: beat < lo - 1e-6 ? Math.round(beat - (lo - countIn)) + 1 : null });
    }
  }
  let nextTick = 0, shownTick = 0;

  let next = 0, nextAcc = 0, shown = -1, stopped = false;
  const timer = setInterval(() => {
    const now = Tone.now();
    while (next < notes.length && at(notes[next]) < now + 0.3) {
      const n = notes[next++];
      if (melody && !n.rest && !n.tied) sampler.triggerAttackRelease(noteName(n.midi), melLen(n), at(n), melody);
    }
    while (nextAcc < acc.length && time(acc[nextAcc].start) < now + 0.3) {
      const a = acc[nextAcc++];
      sampler.triggerAttackRelease(noteName(a.midi), accLen(a), time(a.start), 0.38);
    }
    while (nextTick < ticks.length && ticks[nextTick].at < now + 0.3) tick(ticks[nextTick++]);
  }, 40);

  let raf = 0;
  const frame = () => {
    if (stopped) return;
    const now = heard();
    let i = shown;
    while (i + 1 < notes.length && at(notes[i + 1]) <= now) i++;
    if (i !== shown && i >= 0) { shown = i; onNote?.(notes[i]); }
    while (onKey && nextKey < keys.length && keys[nextKey][0] <= now) {
      const [, on, midi, part] = keys[nextKey++];
      const j = down.findIndex(d => d[0] === midi && d[1] === part);
      if (on) down.push([midi, part]); else if (j >= 0) down.splice(j, 1); else continue;
      onKey(midi, on, part);
    }
    while (shownTick < ticks.length && ticks[shownTick].at <= now) onBeat?.(ticks[shownTick++]);
    if (now >= end + 0.2) { stop(); onEnd?.(); return; }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  function stop() {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
    cancelAnimationFrame(raf);
    down.splice(0).forEach(([midi, part]) => onKey(midi, false, part));
    sampler.releaseAll(Tone.now() + 0.05);
  }
  return { stop, duration: end - t0 + countIn * spb, timeOf: at };
}

// The metronome: a short wooden tick, higher on the first beat of a bar. Straight to the speakers.
let clicker = null;
function tick({ at, accent }) {
  clicker ??= new Tone.Synth({
    oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 }, volume: -10,
  }).toDestination();
  clicker.triggerAttackRelease(accent ? 1760 : 1175, 0.03, at, accent ? 1 : 0.6);
}

// What is being heard right now, on the clock notes are scheduled on: Tone.now() runs a little
// ahead (its look-ahead), and the speakers lag a little behind the clock.
const heard = () => Tone.context.currentTime - (Tone.context.rawContext.outputLatency || 0);
export const audioNow = () => (audioState.ready ? heard() : performance.now() / 1000);

// Gramophone mode: narrow the sound and add surface noise.
export function setGramophone(on) {
  if (!tone) return;
  tone.frequency.rampTo(on ? 3200 : 18000, 0.4);
  if (on && !crackle) {
    const hiss = new Tone.Noise('pink');
    const band = new Tone.Filter(2400, 'bandpass');
    const gain = new Tone.Gain(0.025).toDestination();
    hiss.connect(band); band.connect(gain);
    const pops = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.012, sustain: 0 }, volume: -30 }).toDestination();
    const popTimer = setInterval(() => { if (Math.random() < 0.5) pops.triggerAttackRelease(0.01); }, 160);
    hiss.start();
    crackle = { stop() { clearInterval(popTimer); hiss.stop(); [hiss, band, gain, pops].forEach(n => n.dispose()); } };
  } else if (!on && crackle) {
    crackle.stop();
    crackle = null;
  }
}

// The soft rustle of a page being turned: a short burst of filtered noise, straight to the speakers
// (not through the piano's filter, so it stays the same on the gramophone).
let paper = null;
export function rustle(seconds = 0.5) {
  if (!audioState.ready) return;
  if (!paper) {
    const gain = new Tone.Gain(0.05).toDestination();
    const env = new Tone.AmplitudeEnvelope({ attack: 0.06, decay: 0.15, sustain: 0.4, release: 0.25 }).connect(gain);
    const filter = new Tone.Filter({ frequency: 3200, type: 'bandpass', Q: 0.7 }).connect(env);
    const noise = new Tone.Noise('pink').connect(filter).start();
    paper = { env, filter };
  }
  const now = Tone.now();
  // the sound brightens as the page swings up and darkens as it lands
  paper.filter.frequency.cancelScheduledValues(now).setValueAtTime(1800, now)
    .linearRampToValueAtTime(4200, now + seconds * 0.45).linearRampToValueAtTime(1500, now + seconds);
  paper.env.triggerAttackRelease(seconds * 0.7, now);
}
