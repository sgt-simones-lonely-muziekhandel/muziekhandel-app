# Sound effects

Small sounds that make the world feel alive: footsteps, soft rain, thunder, the shop door, paper, and the chimes and gust of the time travel. Footsteps, rain, thunder and the time travel are **recordings** (CC0, free to use without credit: [Kenney](https://kenney.nl/assets/impact-sounds) and [BigSoundBank](https://bigsoundbank.com)); the door and paper are made in code with **Tone.js**. All in `js/sfx.js`, next to the music in [audio](audio.md). Nothing is loud: everything sits well under the music.

## For the player

- **Footsteps** while the boy walks, one for each foot landing, in time with his legs, soft and low: cobbles in the [1900 street](street.md), a wooden floor in the [shop](shop.md) and the [listening corner](listening-corner.md), a soft squish in the puddles of the [future street](future-street.md).
- **The shop door** creaks open and the bell above it rings, going in and coming out.
- **Rain**, soft, wherever it rains on screen, as hard as it rains there: always in the [future street](future-street.md); in the [prologue](prologue.md) growing on the map as the sea rises and in the 2126 shot; in the [story](story.md) until the past takes over. Never in the past.
- **Thunder** a moment after every lightning flash: in the future street, and the two flashes in the prologue's 2126 shot. In the future street also now and then a rumble from further away, without a flash (every 20–40 s).
- **Paper** being slid out and picked up when you take sheet music from the cabinet ([sheet music](sheet-music.md); turning the pages already rustles, see `rustle()` in `js/audio.js`).
- **The time travel** ([story](story.md)): a sparkling chime as the lid pops off the tube and the light pours out; one short gust of wind with a little chime in it as the swirl starts, 2.5 seconds; it is quiet again well before the past has fully appeared.

Like the music, nothing sounds until the player has pressed **Start** (browsers only allow sound after a click).

## How it's built

`js/sfx.js` exports one function per sound; each does nothing until the audio context runs.

- **Bus**: everything goes through one gain and a limiter; the bell and chimes also through a little reverb (`room`).
- **Recordings** in `public/audio` (see its README), made by `scripts/import_sounds.py` from the downloads in `design/sounds`, as AAC (`.m4a`) so every browser plays them: five footsteps per ground (Kenney's concrete, wood and grass), rain and three thunders (`weather/`), and the sparkle, gust (2.5 s cut from the loudest part of a storm recording and shaped to swell and die away) and chime (`time-travel/`).
- `step(ground)`: one of the five recordings for that ground (never the same twice in a row), a little lower (`playbackRate` 0.62–0.9) and muffled by a low-pass at 1600 Hz, so it sounds soft. The first step loads them. The boy (`js/boy.js`) plays it from `footfall()` when his walk cycle passes a footfall (phase π/2, then every π) while `stride` > 0.5, on his `ground`, which each scene sets.
- `shopDoor()`: a sawtooth hinge creak with a wobbling pitch through a narrow band-pass, and a small brass bell (three sine partials at 1760 Hz × 1, 2.76, 5.4) struck three times as it swings. Called from `goInside()` and when the boy comes back out (`js/street.js`).
- `thunder(delay, strength)`: one of three recorded rumbles (5–11 s, tails faded out), not one that is still playing, `delay` seconds from now, quieter for a lower `strength`. `loadThunder()` loads them ahead (the future street and the films call it when they start). `js/future.js` calls it 0.6–2 s after each flash, and with strength 0.5 every 20–40 s on its own; `Prologue.tick()` after each of its `FLASHES`.
- `rain(level)`: a 20 s recorded loop of rain on puddles (its end blended into its start, so there's no seam), as loud as `level` (0–1). The scene sets it every frame; when nobody does for 0.3 s it fades out and is cleaned up by itself, so leaving a rainy scene stops it. The future street sets 1. In the films `Film.drawRain()` notes how hard it rains on screen (its alpha, times the shot's fade), and `Film.update()` sets the rain to that (0.3 = 1).
- `pickUpPaper()`: pink noise through a band-pass that sweeps up and back down, with a little flap at the end. Called when a book is taken from the cabinet (`js/ui/library.js`).
- `tubeSparkle()`: a bright recorded chime (*Chimes "Dream" #1*, 2.3 s), with only its very top taken off. `timeTravel()`: the gust, with the little chime 0.35 s in (softened by a low-pass at 6.5 kHz). `loadTimeTravel()` loads them when the story starts; `Story.sounds()` plays the sparkle at `LID_POP` and the gust at the start of the swirl (`SWIRL`), each once, when the story time passes it, so they wait with a caption like the picture does.
- **Levels**, as true peaks on the output against a piano note (−7 dB): rain −26 dB at its hardest, footsteps about −24, thunder −16 (−22 far away), the tube sparkle −19, the gust −14; the door and paper sit 5–14 dB under the piano.

## Known limits / next steps

- A volume or mute button for the effects.
