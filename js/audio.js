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
 */
export function playPiece(parsed, { onNote, onKey, onEnd, tempoScale = 1 } = {}) {
  if (!audioState.ready) { onEnd?.(); return { stop() {} }; }
  const spb = parsed.secPerBeat / tempoScale;
  const sampler = voice; // the instrument it started with plays it to the end
  const t0 = Tone.now() + 0.15;
  const off = parsed.offset;
  let next = 0, nextAcc = 0, shown = -1, stopped = false;
  const notes = parsed.notes, accomp = parsed.accomp;
  const beats = Math.max(off + parsed.totalBeats, ...accomp.map(a => a.start + a.dur));
  const end = t0 + beats * spb;
  const at = n => t0 + (off + n.start) * spb;
  const melLen = n => n.sound * spb * 0.92, accLen = a => a.dur * spb * 0.95;

  // every key down / up, in time order (an up before a down at the same moment)
  const keys = [];
  for (const n of notes) if (!n.rest && !n.tied) keys.push([at(n), true, n.midi, 'melody'], [at(n) + melLen(n), false, n.midi, 'melody']);
  for (const a of accomp) keys.push([t0 + a.start * spb, true, a.midi, 'accomp'], [t0 + a.start * spb + accLen(a), false, a.midi, 'accomp']);
  keys.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  let nextKey = 0;
  const down = [];

  const timer = setInterval(() => {
    const now = Tone.now();
    while (next < notes.length && at(notes[next]) < now + 0.3) {
      const n = notes[next++];
      if (!n.rest && !n.tied) sampler.triggerAttackRelease(noteName(n.midi), melLen(n), at(n), 0.75);
    }
    while (nextAcc < accomp.length && t0 + accomp[nextAcc].start * spb < now + 0.3) {
      const a = accomp[nextAcc++];
      sampler.triggerAttackRelease(noteName(a.midi), accLen(a), t0 + a.start * spb, 0.38);
    }
  }, 40);

  let raf = 0;
  const tick = () => {
    if (stopped) return;
    const now = Tone.now();
    let i = shown;
    while (i + 1 < notes.length && at(notes[i + 1]) <= now) i++;
    if (i !== shown && i >= 0) { shown = i; onNote?.(notes[i]); }
    while (onKey && nextKey < keys.length && keys[nextKey][0] <= now) {
      const [, on, midi, part] = keys[nextKey++];
      const j = down.findIndex(d => d[0] === midi && d[1] === part);
      if (on) down.push([midi, part]); else if (j >= 0) down.splice(j, 1); else continue;
      onKey(midi, on, part);
    }
    if (now >= end + 0.2) { stop(); onEnd?.(); return; }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  function stop() {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
    cancelAnimationFrame(raf);
    down.splice(0).forEach(([midi, part]) => onKey(midi, false, part));
    sampler.releaseAll(Tone.now() + 0.05);
  }
  return { stop, duration: beats * spb };
}

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
