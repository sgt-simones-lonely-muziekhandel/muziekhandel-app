# De notenles: music theory for beginners

A short course for children who have never read music. Nine chapters, each a few sentences of simple Dutch and something to try right away, with the notes looking and sounding as everywhere in the game.

## For the player

Open it with **Notenles** on the [piano](piano.md), or ask [Meneer Simone](shopkeeper.md) *Ik weet nog niks van muziek. Help!* (button *Naar de notenles*).

On the left the chapters, numbered (the open one red, the ones already read green); on the right the chapter: its title, the text, **Voorlezen** (reads it aloud), and a box with something to try. *‹ Vorige* / *Volgende ›* or ← → go through them.

| # | Chapter | To try |
|---|---|---|
| 1 | *Wat is een noot?* High and low; low on the left of the piano, high on the right | 🐻 *Laag*, 🐦 *Hoog*, and *Van laag naar hoog* runs up three octaves on a little keyboard |
| 2 | *Zeven namen*: C D E F G A B, do re mi; after B it starts again; every note has its colour | Seven coloured tiles and a keyboard; *Zeg do re mi* switches the names (for the whole game) |
| 3 | *Witte en zwarte toetsen*: groups of two and three black keys; C is left of the two | *Zoek de C!*: find the three C's on a three-octave keyboard (a wrong key shakes) |
| 4 | *De notenbalk*: five lines, on a line or between, higher is higher, the treble clef, middle C on its own little line | The C major scale on a staff: click a note to hear it, *Speel de toonladder* |
| 5 | *Hoe lang duurt een noot?*: whole 4, half 2, quarter 1, eighth ½, the dot | A bar of each, *Speel en tel mee* with a 1 2 3 4 counter lighting the beat |
| 6 | *Even stil: de rust*: rests have a length too | A tune with rests, with the counter |
| 7 | *Kruis ♯ en mol ♭*: a step up or down; C♯ and D♭ are the same key | Buttons C, C♯, D, D♭, E, E♭ light their key |
| 8 | *Maten en tellen*: bars, bar lines, 4/4 like a march, 3/4 like a waltz | A march in 4/4 and a waltz in 3/4, each with its counter |
| 9 | *Nu jij!* | Play *Altijd is Kortjakje ziek* (C C G G A A G) by pressing the key that lights up; then *Naar de piano* puts it on the piano |

## How it's built

`js/ui/lessons.js`, `lessonsView()`, the view `lessons` (a wide paper panel, `frame()`).

- `CHAPTERS`: `{ title, text, build(lesson) }`; `build` returns the elements for the try-box. `show(i)` stops what is playing, fills the page and marks the list.
- `miniKeys(lo, hi, { names, onPress })`: a small keyboard of DOM buttons in the note colours (`NOTE_COLORS`); with `names` every key carries its name in its colour, the black keys too (*C♯*, *D♯*…, smaller); a press plays the key (`strike()` from [audio](audio.md)) and lights it (`.lit`); `light(midi, ms, cls)` lights a key from code (`.nope` for a wrong key, `.target` / `.found` for the games).
- `staff(notes, { time, tempo, bars })`: a line of music from a note string in the format of [content data](content-data.md), engraved by `renderPage()` from `js/notation.js`, so it looks like the sheet on the piano; a click on a note plays it and makes it glow (`.hit`).
- `lesson.play(staff, counter)`: plays the staff with `playPiece()`, lighting each note as it sounds; the counter's beat lights up every beat (timers of `secPerBeat`).
- Without the piano samples yet, a line says *De piano wordt nog gestemd…*.
- CSS under *De notenles* in `css/style.css`; on screens ≤ 800 px wide the chapter list becomes a row above the page.
