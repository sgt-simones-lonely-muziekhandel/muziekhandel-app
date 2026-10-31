# Sound effects

Small sounds that make the world feel alive: footsteps, the shop door, thunder, paper, and the wind and chimes of the time travel. They are made in code with **Tone.js** (no recordings to download or license), in `js/sfx.js`, next to the music in [audio](audio.md).

## For the player

- **Footsteps** while the boy walks, one for each foot landing, in time with his legs: cobbles in the [1900 street](street.md), a wooden floor in the [shop](shop.md) and the [listening corner](listening-corner.md), splashy puddles in the [future street](future-street.md).
- **The shop door** creaks open and the bell above it rings, going in and coming out.
- **Thunder** in the future street: a low rumble a moment after each distant lightning flash.
- **Paper** being slid out and picked up when you take sheet music from the cabinet ([sheet music](sheet-music.md); turning the pages already rustles, see `rustle()` in `js/audio.js`).
- **The time travel** ([story](story.md)): sparkling chimes when the crate opens, when the lid pops off the tube and while the swirl sweeps across; wind that starts softly when the tube opens, blows hardest during the swirl and dies down towards the sunset.

Like the music, nothing sounds until the player has pressed **Start** (browsers only allow sound after a click).

## How it's built

`js/sfx.js` exports one function per sound; each does nothing until the audio context runs.

- **Bus**: everything goes through one gain and a limiter; the bell and chimes also through a little reverb (`room`).
- `step(ground)`: a pink-noise scuff through a band-pass filter plus a soft `MembraneSynth` thump; `GROUND` sets the colour per surface (`stone`, `wood`, `wet`, which adds a small splash). Every step varies a little in pitch and loudness. The boy (`js/boy.js`) plays it from `footfall()` when his walk cycle passes a footfall (phase π/2, then every π) while `stride` > 0.5, on his `ground`, which each scene sets.
- `shopDoor()`: a sawtooth hinge creak with a wobbling pitch through a narrow band-pass, and a small brass bell (three sine partials at 1760 Hz × 1, 2.76, 5.4) struck three times as it swings. Called from `goInside()` and when the boy comes back out (`js/street.js`).
- `thunder(delay)`: brown noise through a low-pass that closes from 340 to 120 Hz, with a rumbling loudness curve over 3.5–5.5 s. `js/future.js` calls it 0.6–2 s after each flash.
- `pickUpPaper()`: pink noise through a band-pass that sweeps up and back down, with a little flap at the end. Called when a book is taken from the cabinet (`js/ui/library.js`).
- `sparkle({ n, spread, rising, level })`: FM bell notes from a pentatonic scale (E6–A7), rising one after another.
- `wind(level)`: pink noise through a wide band-pass (the rush) and a narrow one (the whistle), both drifting with slow LFOs. The film sets the level every frame; when nobody does for 0.3 s (the film ended or was skipped) the wind fades out and is cleaned up by itself. `Story.sounds()` plays the chimes as the story time passes each beat (`CRATE_FLASH`, `LID_POP`, `SWIRL`, `AHEAD`) and shapes the wind from the tube and travel shots.
- **Levels**, measured on the output against a piano note (about −14 dB peak): footsteps about −27 dB, paper −28, chimes −22, wind −24 at its strongest, door −19, thunder −18 to −21.

## Known limits / next steps

- The prologue's lightning and rain have no sound yet, nor the rain in the future street.
- A volume or mute button for the effects.
