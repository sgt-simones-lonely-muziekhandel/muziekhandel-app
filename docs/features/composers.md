# Composers: portraits, biography and family tree

The portraits on the shop wall above the piano. Clicking them opens a close-up of the wall; each portrait there opens the composer's story and family.

## For the player

1. **Portrait wall** (*De componisten*), full screen: the close-up `public/art/closeups/gallery-wall.webp` (green damask wall, picture lamp, wainscot) with the six portraits in the same gilded frames as in the shop, two rows of three, slightly crooked like on a real wall, each with a brass name plaque. Pointing at a frame straightens it and makes it glow; click it to open the composer.
2. **Composer card** (a paper card over the dimmed wall):
   - Large portrait with plaque.
   - **Family tree**: oval medallions on golden branches. Top: (grand)parents. Middle: brothers and sisters, the composer (glowing gold frame) and spouse(s) joined by a ♥. Bottom: children. A handwritten note covers special cases ("…and 16 other children", "never married").
   - **Biography** in short, simple sentences, a **Wist je dat?** (did you know?) fact, and birth/death dates and places.
   - 🔊 **Voorlezen** reads the story aloud in Dutch.
   - Buttons for the composer's pieces: 📜 open the [sheet music](sheet-music.md), 🎵 listen on the [gramophone](gramophone.md).

The six composers: Bach, Mozart, Beethoven, Chopin, Verdi, Tchaikovsky (*Tsjaikovski* in Dutch).

## How it's built

`js/ui/gallery.js`: `galleryView()` and `composerView()`. Data in `js/data.js` (see [content data](content-data.md)).

- **Wall close-up**: `galleryView()` uses `frame(…, { closeup })` (see [game shell](game-shell.md)). `HANG` gives each frame's centre x, top and height in pixels of the 1672 × 941 picture; they're turned into percentages so the frames scale with the picture. Which frame each composer gets, and the size of each frame's opening, come from `js/frames.js` (shared with the shop wall). The portrait is an `<img>` under the frame image, fitted to the opening and rounded for the oval frames.

- The tree is laid out with normal HTML rows (flexbox). After layout, `drawBranches()` measures where each medallion ended up and draws the branches in an SVG behind them, as curved golden lines with a dark shadow. A `ResizeObserver` redraws them when the window changes.
- Relatives get a sepia silhouette (man or woman); the composer uses the portrait.
- On narrow screens the portrait, tree and biography stack vertically.

## Known limits / next steps

- Relatives have silhouettes, not portraits.
- The tree has three generations at most (four for Beethoven, with his grandfather). Larger families like the Bachs are shortened.
- Pieces exist only for Bach, Mozart and Beethoven so far; Chopin, Verdi and Tchaikovsky have a biography only.
- Links between composers (teachers, influences) from the design guide's story flow aren't there yet.
