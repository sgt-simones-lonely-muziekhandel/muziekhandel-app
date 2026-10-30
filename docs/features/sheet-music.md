# Sheet music cabinet and viewer

The cabinet right of the counter in the shop (`public/art/shop/cabinet.webp`). It holds music cylinders, each with a rolled-up piece of sheet music.

## For the player

1. **Cabinet** (*De bladmuziekkast*): clicking the cabinet in the shop opens its close-up full screen, `public/art/closeups/cabinet.webp`: three shelves of five compartments, each with a brass plaque. Each piece stands in its own compartment as a printed sheet-music book: one of six covers (`cover-1` … `cover-6`), with the title and the composer printed in the cartouche at the top. The plaque under it shows 1–3 stars. The shelves go by difficulty: top shelf ★, middle ★★, bottom ★★★. Clicking a book lifts it out and opens the music.
2. **Opening**: the chosen book appears in the middle and its cover swings open like a real book, onto the **title page**. The title page is always the same picture (`cover-inside.webp`); only the title, subtitle and composer printed on it change. Click the composer's name for their [biography](composers.md).
3. **Sheet** (*Bladmuziek*): from the title page, → turns to the music, an old paper page with the title and composer at the top.
   - **← →** or the *Vorige* / *Volgende* buttons flip pages, with a small page-turn animation.
   - **Space** or *Speel op de piano* opens the piece on the [piano](piano.md).
   - Every note has a coloured circle with its name under the staff. The colours are the same as on the piano keys.

When the cabinet is opened from the piano (*Kies bladmuziek*), picking a book loads the piece straight into the piano instead.

The covers and the title page use **Playfair Display**, a high-contrast Didone typeface like the printed sheet music of around 1900, still easy to read (`--font-1900` in `css/style.css`).

## How it's built

- `js/ui/library.js`: uses `frame(…, { closeup })` (see [game shell](game-shell.md)) and places the books and plaques on the picture. `COLS` (plaque centres; the books sit `TUBE_DX` further right) and `SHELVES` (y of each shelf edge and plaque row) are measured in pixels of the 1672 × 941 picture and turned into percentages, so everything scales with it; sizes use `cqw` units of the picture box. Pieces go on the shelf of their `level`, at most five per shelf. The covers are `public/art/items/sheet-music/cover-1…6.webp`; `coverFor(piece)` picks one per piece (in turn) and `coverHtml()` builds the cover with its printed text, shared with the reader. The text box sits on the cartouche, in percentages of the cover, so it scales with it.
- `js/ui/sheet.js`: the reader view. Page 0 is the title page (`.title-page`, `cover-inside.webp` with the text on top); the music pages follow. When the view opens, the book scales in (`book-in`) and the cover (`.book-cover`, the same cover as in the cabinet) turns open around its left edge (`open-cover`, a 3D `rotateY`) and is removed when done. Keyboard: ← → flip, Space → piano (`ui.replace('piano', …)`, so *Terug* from the piano goes back to the cabinet).
- `js/notation.js`: a small SVG engraver for single-line melodies in treble clef.
  - Staff with 10-unit line spacing, 4 bars per line; 2 lines per page in the reader, 1 in the piano.
  - Note heads (filled or open), stems up or down depending on the position, flags for eighths and sixteenths, dots, sharps/flats, ledger lines above and below, rests (glyphs from the *Noto Music* font), bar lines, a final double bar, time signature, bar numbers.
  - Bar widths depend on how many notes and how long they are.
  - Each note is a `<g class="note" data-i="…">` with a hidden highlight box; the piano adds `active` (lit up) and `done` (played) classes. `renderPage()` returns a map from note index to element.
  - Note names can be letters (C D E) or solfège (do re mi), see [piano](piano.md).

## Known limits / next steps

- Five compartments per shelf: a sixth piece of the same difficulty doesn't fit yet (it would need a second cabinet page or two cylinders per compartment).

- Melody only, treble clef only: no chords, no bass clef, no key signatures (accidentals are written on every note), no beams (each eighth has its own flag), no ties or lyrics.
- For real scores from Muziekschatten, an engraver like VexFlow or OpenSheetMusicDisplay (MusicXML) would be needed; the highlight hook (`data-i` per note) can stay the same.
