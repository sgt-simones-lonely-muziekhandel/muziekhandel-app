# Sound effects

Small sounds that make the world feel alive: footsteps, the shop door, thunder, paper, and the wind and chimes of the time travel. The footsteps and the time travel's gust are **recordings** (CC0, free to use without credit: [Kenney](https://kenney.nl/assets/impact-sounds) and [BigSoundBank](https://bigsoundbank.com)); the door, thunder and paper are made in code with **Tone.js**. All in `js/sfx.js`, next to the music in [audio](audio.md).

## For the player

- **Footsteps** while the boy walks, one for each foot landing, in time with his legs, soft and low: cobbles in the [1900 street](street.md), a wooden floor in the [shop](shop.md) and the [listening corner](listening-corner.md), a soft squish in the puddles of the [future street](future-street.md).
- **The shop door** creaks open and the bell above it rings, going in and coming out.
- **Thunder** in the future street: a low rumble a moment after each distant lightning flash.
- **Paper** being slid out and picked up when you take sheet music from the cabinet ([sheet music](sheet-music.md); turning the pages already rustles, see `rustle()` in `js/audio.js`).
- **The time travel** ([story](story.md)): one short gust of wind with a little chime in it as the swirl starts, 2.5 seconds; it is quiet again well before the past has fully appeared.

Like the music, nothing sounds until the player has pressed **Start** (browsers only allow sound after a click).

## How it's built

`js/sfx.js` exports one function per sound; each does nothing until the audio context runs.

- **Bus**: everything goes through one gain and a limiter; the bell and chimes also through a little reverb (`room`).
- **Recordings** in `public/audio` (see its README), made by `scripts/import_sounds.py` from the downloads in `design/sounds`, as AAC (`.m4a`) so every browser plays them: five footsteps per ground (Kenney's concrete, wood and grass), and the gust (2.5 s cut from the loudest part of a storm recording and shaped to swell and die away) and chime (*Chimes "Butterfly" #1*, 2.2 s).
- `step(ground)`: one of the five recordings for that ground (never the same twice in a row), a little lower (`playbackRate` 0.62–0.9) and muffled by a low-pass at 1600 Hz, so it sounds soft. The first step loads them. The boy (`js/boy.js`) plays it from `footfall()` when his walk cycle passes a footfall (phase π/2, then every π) while `stride` > 0.5, on his `ground`, which each scene sets.
- `shopDoor()`: a sawtooth hinge creak with a wobbling pitch through a narrow band-pass, and a small brass bell (three sine partials at 1760 Hz × 1, 2.76, 5.4) struck three times as it swings. Called from `goInside()` and when the boy comes back out (`js/street.js`).
- `thunder(delay)`: brown noise through a low-pass that closes from 340 to 120 Hz, with a rumbling loudness curve over 3.5–5.5 s. `js/future.js` calls it 0.6–2 s after each flash.
- `pickUpPaper()`: pink noise through a band-pass that sweeps up and back down, with a little flap at the end. Called when a book is taken from the cabinet (`js/ui/library.js`).
- `timeTravel()`: the gust, with the chime 0.35 s in (softened by a low-pass at 6.5 kHz). `loadTimeTravel()` loads both when the story starts; `Story.sounds()` plays them once, when the story time passes the start of the swirl (`SWIRL`), so it waits with a caption like the picture does.
- **Levels**, as true peaks on the output against a piano note (−7 dB): footsteps about −24 dB, the time travel −14 dB; the door, thunder and paper sit 5–14 dB under the piano.

## Known limits / next steps

- The prologue's lightning and rain have no sound yet, nor the rain in the future street.
- A volume or mute button for the effects.
