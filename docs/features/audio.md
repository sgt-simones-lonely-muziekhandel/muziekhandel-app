# Audio

All music in the game is played on the **Salamander Grand Piano** (a free sampled Yamaha C5 grand) through **Tone.js**.

## For the player

- Sound starts after pressing **Start** on the title screen; browsers only allow audio after a click.
- While the samples download, a chip in the top-right says *Piano wordt gestemd…* ("the piano is being tuned"). Without internet it says the piano couldn't be loaded.
- On the [gramophone](gramophone.md) the same piano sounds muffled and crackly, like an old record.

## How it's built

`js/audio.js`. Tone.js 14.8.49 is loaded from unpkg in `index.html`.

- `initAudio()`: starts the audio context, builds the chain *Sampler (+8 dB) → low-pass filter → reverb (light, 16% wet) → limiter (−1 dB) → speakers*: the samples are quiet on their own, so they're boosted, and the limiter keeps loud chords from clipping, and loads the samples from `https://tonejs.github.io/audio/salamander/` (notes A, C, D#, F# in every octave; Tone fills the gaps by pitch-shifting). Calls `onAudioReady` listeners when done.
- `noteOn(midi)` / `noteOff(midi)`: for the piano keys (sound lasts while the key is held).
- `playPiece(parsed, { onNote, onEnd, tempoScale })`: plays a whole piece.
  - Notes are scheduled 0.3 s ahead by a 40 ms timer, so *stop* is almost instant (nothing far in the future is already queued).
  - A `requestAnimationFrame` loop compares the audio clock with each note's start and calls `onNote(note)` exactly when it sounds, which keeps the lit-up notes in sync with what you hear.
  - Returns `{ stop, duration }`.
- `setGramophone(on)`: lowers the filter to 3.2 kHz and adds pink-noise hiss and random clicks; turning it off removes them.

## Known limits / next steps

- Samples come from the Tone.js site; for production, host them yourself (they're free to redistribute) so the game doesn't depend on that server.
- The gramophone plays the same melody-only data as the piano. Real historic recordings (public-domain 78s, e.g. from the Internet Archive) would make it much richer.
