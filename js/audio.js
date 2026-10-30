// Salamander Grand Piano via Tone.js, plus a "gramophone" colouring with crackle.

const SALAMANDER = 'https://tonejs.github.io/audio/salamander/';

let sampler = null;
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
    const reverb = new Tone.Reverb({ decay: 2.4, wet: 0.16 }).toDestination();
    tone = new Tone.Filter(18000, 'lowpass').connect(reverb);
    sampler = new Tone.Sampler({ urls: salamanderUrls(), baseUrl: SALAMANDER, release: 1.2 }).connect(tone);
    await Tone.loaded();
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

export function noteOn(midi, velocity = 0.8) {
  if (!audioState.ready) return;
  sampler.triggerAttack(noteName(midi), Tone.now(), velocity);
}

export function noteOff(midi) {
  if (!audioState.ready) return;
  sampler.triggerRelease(noteName(midi), Tone.now() + 0.05);
}

export function strike(midi, seconds = 0.6, velocity = 0.8) {
  if (!audioState.ready) return;
  sampler.triggerAttackRelease(noteName(midi), seconds, Tone.now(), velocity);
}

/**
 * Play a parsed piece. Notes are scheduled a little ahead of time so a stop() is
 * near-instant. onNote(note) fires when each note starts sounding.
 */
export function playPiece(parsed, { onNote, onEnd, tempoScale = 1 } = {}) {
  if (!audioState.ready) { onEnd?.(); return { stop() {} }; }
  const spb = parsed.secPerBeat / tempoScale;
  const t0 = Tone.now() + 0.15;
  let next = 0, shown = -1, stopped = false;
  const notes = parsed.notes;
  const end = t0 + parsed.totalBeats * spb;

  const timer = setInterval(() => {
    const now = Tone.now();
    while (next < notes.length && t0 + notes[next].start * spb < now + 0.3) {
      const n = notes[next++];
      if (!n.rest) sampler.triggerAttackRelease(noteName(n.midi), n.dur * spb * 0.92, t0 + n.start * spb, 0.75);
    }
  }, 40);

  let raf = 0;
  const tick = () => {
    if (stopped) return;
    const now = Tone.now();
    let i = shown;
    while (i + 1 < notes.length && t0 + notes[i + 1].start * spb <= now) i++;
    if (i !== shown) { shown = i; onNote?.(notes[i]); }
    if (now >= end + 0.2) { stop(); onEnd?.(); return; }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  function stop() {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
    cancelAnimationFrame(raf);
    sampler.releaseAll(Tone.now() + 0.05);
  }
  return { stop, duration: parsed.totalBeats * spb };
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
