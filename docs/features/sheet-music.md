# Sheet music cabinet and viewer

The cabinet right of the counter in the shop (`public/art/shop/cabinet.webp`). It holds music cylinders, each with a rolled-up piece of sheet music.

## For the player

1. **Cabinet** (*De bladmuziekkast*): clicking the cabinet in the shop opens its close-up full screen, `public/art/closeups/cabinet.webp`: three shelves of five compartments, each with a brass plaque. Each piece stands in its own compartment as a printed sheet-music book: one of six covers (`cover-1` … `cover-6`), with the title and the composer printed in the cartouche at the top. The plaque under it shows 1–3 stars. The shelves go by difficulty: top shelf ★, middle ★★, bottom ★★★. Clicking a book lifts it out and opens the music.
2. **Picking a book**: the chosen book comes out of its compartment, tilts a little and flies to the middle of the screen, growing as it comes closer. The desk fades in around it and the book lies there **closed**, with *Klik op het boek om het open te slaan* under it.
3. **The book** (*Bladmuziek*, full screen on a wooden desk): the player opens it. Pages turn **from right to left** around the spine, like a real book: first the cover (its inside is an old endpaper), which also slides the book over so the spine is in the middle, then the **title page**. The title page is always the same picture (`cover-inside.webp`); only the title, subtitle and composer printed on it change. Click the composer's name for their [biography](composers.md). Then come the music pages, two at a time: 4 lines of 2 bars each, big, with the title and composer at the top and the page number at the bottom.
   - → / the right brass button / a click on the right-hand page turns forward; ← / the left button / a click on the left-hand page turns back (all the way to closing the book).
   - **Space** or *Speel op de piano* opens the piece on the [piano](piano.md).
   - Every note has a coloured circle with its name under the staff. The colours are the same as on the piano keys.

When the cabinet is opened from the piano (*Kies bladmuziek*), picking a book loads the piece straight into the piano instead.

The covers and the title page use **Playfair Display**, a high-contrast Didone typeface like the printed sheet music of around 1900, still easy to read (`--font-1900` in `css/style.css`).

## How it's built

- `js/ui/library.js`: uses `frame(…, { closeup })` (see [game shell](game-shell.md)) and places the books and plaques on the picture. `COLS` (plaque centres; the books sit `TUBE_DX` further right) and `SHELVES` (y of each shelf edge and plaque row) are measured in pixels of the 1672 × 941 picture and turned into percentages, so everything scales with it; sizes use `cqw` units of the picture box. Pieces go on the shelf of their `level`, at most five per shelf. The covers are `public/art/items/sheet-music/cover-1…6.webp`; `coverFor(piece)` picks one per piece (in turn) and `coverHtml()` builds the cover with its printed text, shared with the reader. The text box sits on the cartouche, in percentages of the cover, so it scales with it.
- `js/ui/library.js` → `flyToCentre()`: a copy of the clicked cover is put on top of everything (`.flying-book`, fixed position, in a box as wide as the cabinet picture so its `cqw` text sizes stay right) and moved with the Web Animations API to `closedCoverRect()` (where the closed book will lie, worked out from the window size the same way as the full-screen stage). Its text is set to the book's full composer name and size, so the swap is invisible. Then the book view opens with `noFade` (it fades in over the cabinet instead of through black; [game shell](game-shell.md)), and the copy fades away on top of the real book.
- `js/ui/sheet.js`: the book view, a full-screen view without a picture (`frame({ full: true })` without `closeup` gives a `.stage.desk`, a wooden desk drawn in CSS).
  - The book is two pages wide (`PAGE` gives the page size in `cqw`); closed (`.closed`) it is shifted left by a quarter so the cover is in the middle, open it slides back so the spine is (a transition on the whole book).
  - Every sheet is a `.leaf` on the right half with a `.front` (right-hand page) and a `.back` (the left-hand page after turning) face, `backface-visibility: hidden`. Leaf 0 is the cover with the endpaper on its back; the pages in reading order (title page, then the music) go on the fronts and backs of the next leaves. Under them, `.book-back` is the back cover with an endpaper. All music pages are engraved up front with `renderPage(host, parsed, i, 4, 2, 560)`: 4 lines of 2 bars on a narrow 560-unit staff, so the notes come out big on a portrait page.
  - Turning is one CSS transition: the leaf hangs on the spine (`transform-origin: 0 50%`) and goes from `rotateY(0)` to `rotateY(-180deg)` in 1.05 s on an ease-in-out curve, inside a `perspective` box, so it lifts towards you and lies down on the left. `turned` counts the leaves on the left; each leaf gets a tiny `translateZ` depending on its side so the piles overlap in the right order. While a leaf is in the air, `.turning` runs a shade over it (`leaf-shade`); every page has a soft shadow along the spine. Only `transform` and `opacity` animate (`will-change: transform`), so it stays smooth.
  - Keyboard: ← → flip, Space → piano (`ui.replace('piano', …)`, so *Terug* from the piano goes back to the cabinet).
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
