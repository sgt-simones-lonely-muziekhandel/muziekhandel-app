# Content data: composers and pieces

All composers and pieces live in one file, `js/data.js`, so content can be added without touching the game code.

## Composers

`COMPOSERS` is a list of objects:

| Field | Meaning |
|---|---|
| `id` | Short id used everywhere (`'mozart'`) |
| `name`, `short` | Full name, and the short name for plaques and shelves |
| `years`, `title` | "1756 – 1791", and a nickname ("Het wonderkind") |
| `born`, `died` | Date and place |
| `portrait` | Image path |
| `bio`, `fact` | Short biography and a *Wist je dat?* fact, in simple Dutch |
| `tree` | Family: `grandparents?`, `parents`, `siblings`, `spouses`, `children`, `childrenNote?`; each person is `{ name, role, years, g: 'm' \| 'f' }` |

## Pieces

`PIECES` is a list of objects:

| Field | Meaning |
|---|---|
| `id`, `title`, `subtitle` | |
| `composer` | A composer `id` |
| `level` | 1–3 stars |
| `time` | Time signature, e.g. `[3, 4]` |
| `tempo` | Quarter notes per minute |
| `pickup` | Optional upbeat length in quarter notes (Für Elise: `0.5`) |
| `notes` | The melody as text, see below |

### Writing notes

Each note is `pitch:duration`, separated by spaces. `|` bar lines are optional and only help reading; bars are worked out from the time signature.

- Pitch: letter + optional `#` or `b` + octave, e.g. `C4` (middle C), `F#4`, `Bb3`. A rest is `r`.
- Duration: `w` whole, `h.` dotted half, `h` half, `q.` dotted quarter, `q` quarter, `8.` dotted eighth, `8` eighth, `16` sixteenth.

```js
notes: `E4:q E4:q F4:q G4:q | G4:q F4:q E4:q D4:q | C4:q C4:q D4:q E4:q | E4:q. D4:8 D4:h`
```

Notes outside C3–G5 can be written but can't be played on the on-screen piano.

`parsePiece()` in `js/music.js` turns this into notes with MIDI numbers, staff positions, start times and bar numbers, and caches the result.

## Current content (demo)

| Piece | Composer | Level |
|---|---|---|
| Ah, vous dirai-je, Maman (*Altijd is Kortjakje ziek*) | Mozart | ★ |
| Ode an die Freude | Beethoven | ★ |
| Menuet in G (from the Anna Magdalena Bach notebook, probably by Petzold) | Bach | ★★ |
| Eine kleine Nachtmusik (opening) | Mozart | ★★ |
| Für Elise (opening) | Beethoven | ★★★ |

These are melody-only transcriptions written by hand for the prototype. They should be checked by a musician, and replaced or extended with the Muziekschatten data.

Composers: Bach, Mozart, Beethoven, Chopin, Verdi, Tchaikovsky. Facts and family data were checked against common reference sources, but should be reviewed before release.
