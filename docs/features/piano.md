# Piano

The second object in the shop, and the heart of the game: play freely, or load a piece and learn it by following the lit-up notes.

## For the player

- **Play** with the computer keyboard, the mouse, a finger on a touch screen, or a real keyboard over USB (*MIDI* button).
- **All 88 keys** of a grand piano (A0–C8) are on screen and can be clicked or touched.
- **Octaves**: the computer keyboard plays 2½ octaves at a time, marked by a brass bar above those keys. **← / →** or the *◀ Lager* / *Hoger ▶* buttons slide it one octave down or up (3 octaves each way), so every key can be reached; the current range is shown between the buttons (e.g. *C3 – G5*).
- **Pedaal** (sustain pedal): hold **Shift**, or click the brass pedal to lock it down (click again to lift it). While it's down, released notes keep ringing; they stop when the pedal comes up. A real MIDI keyboard's sustain pedal works too.
- **Kies muziek** opens the [sheet music cabinet](sheet-music.md); the chosen piece appears above the keys.
- **Luister** (or Space): the piano plays the piece. The note that sounds lights up on the sheet *and* on its key at the same time.
- **Speel mee**: the piano waits. The next note glows on the sheet and, at the same moment, its key glows with a soft beam of light and shows the computer key to press in a little bouncing card. The right key turns green and moves on; a wrong key shakes. At the end: 1–3 stars, depending on mistakes.
- **Langzaam**: listen at 65% speed.
- **C D E / do re mi**: switch note names everywhere.
- **Hulp**: the keyboard guide (below).

- **Keys and light**: the keys are plain ivory and ebony, without shadows and without labels. A key only lights up, in its note colour, while it sounds: pressed (computer keyboard, mouse, touch, MIDI), played in *Luister*, or waiting to be played in *Speel mee*. Then a beam of light rises from it, its note name shows on the key (white keys), and a little ♪ floats up. During a piece the note on the sheet lights up together with the key.
- **Candles**: in the evening (by the visitor's real clock, like the shop lamps) the two candles on the piano flicker with a faint warm glow, and the room around the piano gets a little darker. In daytime they stay as painted.
- Buttons have text only, no emoji.

## The keyboard guide (the picture for learners)

A drawing of the computer keyboard with every key that plays a note painted in that note's colour and labelled with the note name, plus six short rules:

1. Letters are the white keys.
2. Digits (and the keys between them) are the black keys.
3. Top letter row (Q W E…) = high notes, bottom row (Z X C…) = low notes.
4. ← and → shift the keyboard an octave lower or higher, to reach all 88 keys.
5. Hold Shift for the pedal.
6. In *Speel mee*, the note that lights up on the sheet lights up on the piano too: press that key.

The same picture is shown by the [shopkeeper](shopkeeper.md) when asked *Hoe speel ik piano?*.

## Key mapping

Without an octave shift the computer keyboard covers C3–G5 (19 white keys); each shift moves every key 12 semitones (`KEYS_LOW`, `KEYS_HIGH`, `MAX_SHIFT` in `js/music.js`). Notes that would fall outside A0–C8 do nothing. Keys are matched by **physical position** (`KeyboardEvent.code`), so the layout works the same on QWERTY, AZERTY, QWERTZ or Italian keyboards. In Chrome/Edge the labels on the piano show the letters printed on the player's own keyboard (`navigator.keyboard.getLayoutMap()`); other browsers show QWERTY labels.

| Row | Keys (QWERTY) | Notes |
|---|---|---|
| Digits | 2 3 · 5 6 7 · 9 0 · = | C#4 D#4 · F#4 G#4 A#4 · C#5 D#5 · F#5 |
| Top letters | Q W E R T Y U I O P [ ] | C4 D4 E4 F4 G4 A4 B4 C5 D5 E5 F5 G5 |
| Home row | S D · G H J · L ; | C#3 D#3 · F#3 G#3 A#3 · C#4 D#4 |
| Bottom letters | Z X C V B N M , . / | C3 D3 E3 F3 G3 A3 B3 C4 D4 E4 |
| ← / → | | octave down / up |
| Shift (hold) | | sustain pedal |

Middle C (C4) has a small star.

## Note colours

One colour per note letter, used on the sheet, the keys and the guide (`NOTE_COLORS` in `js/music.js`):

C red · D orange · E yellow · F green · G teal · A blue · B purple. Sharps use the colour of their letter.

## How it's built

- **Full screen** on `public/art/closeups/piano.webp` (see [game shell](game-shell.md)): the music is engraved on the blank sheet on the music desk (two lines at a time; *Kies bladmuziek, of speel maar!* is written there until a piece is chosen), the buttons and the piece name sit on the wooden ledge below it, the 88 keys fill the key slot, and the octave buttons, the status line and the pedal are on the strip at the bottom. Everything is placed in percentages of the picture (CSS under `.piano` in `css/style.css`) and sized in `cqw` only, without pixel minimums (buttons, octave buttons, status line, pedal), so it shrinks and grows with the picture and never sticks out over the background, at any screen size.

- `js/ui/piano.js`, `pianoView()`:
  - Keys are DOM elements for the full range `PIANO_LOW`–`PIANO_HIGH` (A0–C8); black keys are positioned over the gaps between white keys. `buildKeys()` redraws them (hidden note names and key caps, the brass `.kb-window` bar) whenever the octave shift or note names change.
  - **Octave shift**: `shift` is added (× 12) to the `KEYMAP` note of each computer key. `codeNotes` remembers which note each held computer key started, so shifting while a key is down still releases the right note. In *Speel mee* the keyboard slides along by itself when the next note is out of reach.
  - **Pedal**: `setPedal()`. While it's down, `release()` puts notes in `sustained` instead of stopping them; when it comes up, every sustained note that isn't still held is stopped. Shift holds it, the pedal button latches it, MIDI control change 64 drives it from a real keyboard. Pointer events use pointer capture so a key releases even if the finger slides off.
  - Modes: `free`, `listen`, `follow`. *Luister* uses `playPiece()` from [audio](audio.md) with an `onNote` callback that highlights the note and key. *Speel mee* keeps an index into the piece, skips rests, and compares each pressed MIDI number with the target.
  - The score shows one line (4 bars) and turns the page automatically when the highlighted note moves to the next line.
  - Lighting is CSS only: `.down` / `.active` / `.target` colour the key and show its `::before` beam, its `.kname` and (target only) its `.kcap`; `spark(midi)` adds a `.spark` note that floats up and removes itself.
  - Candles: `.candle` elements over the painted flames (`.flame` flicker + `.candle-glow`, blended with `screen`) and a `.night-shade` vignette, shown when `.piano-wrap` has `night` (`skyAt(currentHour()).lampsOn`, see [sky](sky.md)); `--dark` scales the vignette. Test with `?uur=22`.
  - Leaving the view (opening the cabinet, *Terug*, Esc) stops playback and releases all keys.
  - MIDI: only requested when the player presses *MIDI*, because browsers show a permission prompt.
- `js/music.js`: pitch parsing (`C#4` → MIDI number and staff position), `KEYMAP`, key labels, note colours and names.

## Known limits / next steps

- Only one note at a time is checked in *Speel mee*; chords would need the data and the check to support them.
- No tempo-based scoring (playing along in rhythm), only right/wrong notes.
- One pedal only (sustain); no soft or sostenuto pedal.
- On small screens 88 keys are narrow; the note names on white keys are hidden there except middle C and the target note.
