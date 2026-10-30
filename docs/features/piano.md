# Piano

The second object in the shop, and the heart of the game: play freely, or load a piece and learn it by following the lit-up notes.

## For the player

- **Play** with the computer keyboard, the mouse, a finger on a touch screen, or a real keyboard over USB (*MIDI* button).
- **Kies bladmuziek** opens the [sheet music cabinet](sheet-music.md); the chosen piece appears above the keys.
- **👂 Luister** (or Space): the piano plays the piece. The note that sounds lights up on the sheet *and* on its key at the same time.
- **🎯 Speel mee**: the piano waits. The next note glows on the sheet, and its key glows and gets a bouncing ▼ with the computer key to press. The right key turns green and moves on; a wrong key shakes. At the end: 1–3 stars, depending on mistakes.
- **🐢 Langzaam**: listen at 65% speed.
- **🔤 C D E / do re mi**: switch note names everywhere.
- **❓ Hulp**: the keyboard guide (below).

## The keyboard guide (the picture for learners)

A drawing of the computer keyboard with every key that plays a note painted in that note's colour and labelled with the note name, plus four short rules:

1. Letters are the white keys.
2. Digits (and the keys between them) are the black keys.
3. Top letter row (Q W E…) = high notes, bottom row (Z X C…) = low notes.
4. In *Speel mee*, the note that lights up on the sheet lights up on the piano too: press that key.

The same picture is shown by the [shopkeeper](shopkeeper.md) when asked *Hoe speel ik piano?*.

## Key mapping

The piano covers C3–G5 (19 white keys). Keys are matched by **physical position** (`KeyboardEvent.code`), so the layout works the same on QWERTY, AZERTY, QWERTZ or Italian keyboards. In Chrome/Edge the labels on the piano show the letters printed on the player's own keyboard (`navigator.keyboard.getLayoutMap()`); other browsers show QWERTY labels.

| Row | Keys (QWERTY) | Notes |
|---|---|---|
| Digits | 2 3 · 5 6 7 · 9 0 · = | C#4 D#4 · F#4 G#4 A#4 · C#5 D#5 · F#5 |
| Top letters | Q W E R T Y U I O P [ ] | C4 D4 E4 F4 G4 A4 B4 C5 D5 E5 F5 G5 |
| Home row | S D · G H J · L ; | C#3 D#3 · F#3 G#3 A#3 · C#4 D#4 |
| Bottom letters | Z X C V B N M , . / | C3 D3 E3 F3 G3 A3 B3 C4 D4 E4 |

Middle C (C4) has a small star.

## Note colours

One colour per note letter, used on the sheet, the keys and the guide (`NOTE_COLORS` in `js/music.js`):

C red · D orange · E yellow · F green · G teal · A blue · B purple. Sharps use the colour of their letter.

## How it's built

- `js/ui/piano.js`, `pianoView()`:
  - Keys are DOM elements; black keys are positioned over the gaps between white keys. Pointer events use pointer capture so a key releases even if the finger slides off.
  - Modes: `free`, `listen`, `follow`. *Luister* uses `playPiece()` from [audio](audio.md) with an `onNote` callback that highlights the note and key. *Speel mee* keeps an index into the piece, skips rests, and compares each pressed MIDI number with the target.
  - The score shows one line (4 bars) and turns the page automatically when the highlighted note moves to the next line.
  - Leaving the view (opening the cabinet, *Terug*, Esc) stops playback and releases all keys.
  - MIDI: only requested when the player presses *MIDI*, because browsers show a permission prompt.
- `js/music.js`: pitch parsing (`C#4` → MIDI number and staff position), `KEYMAP`, key labels, note colours and names.

## Known limits / next steps

- Only one note at a time is checked in *Speel mee*; chords would need the data and the check to support them.
- No tempo-based scoring (playing along in rhythm), only right/wrong notes.
- No sustain pedal.
