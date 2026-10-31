# Audio

All music in the game is played on the **Salamander Grand Piano** (a free sampled Yamaha C5 grand) through **Tone.js**. On the [piano](piano.md) the player can switch to 20 other instruments from the **tonejs-instruments** sample library.

## For the player

- Sound starts after pressing **Start** on the title screen; browsers only allow audio after a click.
- While the samples download, a chip in the top-right says *Piano wordt gestemd…* ("the piano is being tuned"). Without internet it says the piano couldn't be loaded.
- On the [gramophone](gramophone.md) the same piano sounds muffled and crackly, like an old record.

## How it's built

`js/audio.js`. Tone.js 14.8.49 is loaded from unpkg in `index.html`.

- `initAudio()`: starts the audio context, builds the chain *Sampler (+8 dB) → low-pass filter → reverb (light, 16% wet) → limiter (−1 dB) → speakers*: the samples are quiet on their own, so they're boosted, and the limiter keeps loud chords from clipping, and loads the samples from `https://tonejs.github.io/audio/salamander/` (notes A, C, D#, F# in every octave; Tone fills the gaps by pitch-shifting). Calls `onAudioReady` listeners when done.
- `noteOn(midi)` / `noteOff(midi)`: for the piano keys (sound lasts while the key is held).
- `playPiece(parsed, { onNote, onKey, onEnd, tempoScale })`: plays a whole piece: the melody (velocity 0.75; a tied chain once, as long as all its notes) and, for [real songs](som-scores.md), the piano accompaniment under it (velocity 0.38), with the melody starting `parsed.offset` beats in. `duration` covers both. `onNote(note)` fires as each melody note (or rest) starts; `onKey(midi, down, part)` fires for every key going down and coming up, `part` `'melody'` or `'accomp'` (keys still down get their up on `stop()`).
  - Notes are scheduled 0.3 s ahead by a 40 ms timer, so *stop* is almost instant (nothing far in the future is already queued).
  - A `requestAnimationFrame` loop compares the audio clock with each note's start and calls `onNote(note)` exactly when it sounds, which keeps the lit-up notes in sync with what you hear.
  - Returns `{ stop, duration }`.
- `setInstrument(id)`: what `noteOn`, `noteOff`, `strike` and new `playPiece` calls sound on (`voice`). `'piano'` is the Salamander sampler; any other id from `js/instruments.js` gets its own `Tone.Sampler` from `https://nbrosowsky.github.io/tonejs-instruments/samples/<id>/` (sharps written `s`, e.g. `Fs3.mp3`) into the same filter/reverb/limiter chain, built on first use and cached (a failed load is forgotten so it can be tried again). Returns a promise; rejects when audio isn't ready yet. A playing piece keeps the voice it started with.
- `rustle(seconds)`: the sound of a page being turned in the [sheet-music book](sheet-music.md): pink noise through a band-pass filter that brightens and darkens, under a short envelope, straight to the speakers.
- `playPiece()` for practising: `from` / `to` (beats of the melody) play only that stretch (from the start including the introduction); `countIn` beats of ticks come first and `metronome` ticks through the music (`onBeat({ count, accent })` on every tick; ticks follow the bars, a higher one on the first beat); `melody: 0` leaves the melody to the player. It returns `timeOf(note)` too, when the note sounds.
- The lights follow what is **heard**: `heard()` is the audio clock (`Tone.context.currentTime`) minus the speakers' `outputLatency`, not `Tone.now()`, which runs 0.1 s ahead (its look-ahead). `audioNow()` gives the same clock to the piano, to judge playing in time.
- The metronome tick: a short triangle-wave *tick* (1760 Hz on the first beat, 1175 Hz on the others), straight to the speakers.
- `setGramophone(on)`: lowers the filter to 3.2 kHz and adds pink-noise hiss and random clicks; turning it off removes them.

## Credits

- Salamander Grand Piano by Alexander Holm (CC BY 3.0).
- Other instruments: [tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments) by Nicholas Brosowsky; the samples are CC BY 3.0 (from the Philharmonia Orchestra and other free sources), the code MIT. CC BY means the game must credit them visibly (e.g. on a credits page) before release.

## Known limits / next steps

- The instrument samples load from GitHub Pages; host them yourself for production. Some (electric guitar and bass) are modern and don't fit 1900, but they are fun for children; drop them from `INSTRUMENTS` if wanted.
- The gramophone and the lessons always use the piano.

- Samples come from the Tone.js site; for production, host them yourself (they're free to redistribute) so the game doesn't depend on that server.
- The gramophone plays the same data as the piano: the melody, with the real piano accompaniment for the songs that have one. Real historic recordings (public-domain 78s, e.g. from the Internet Archive) would make it much richer.
