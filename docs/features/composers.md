# Portraits: the team in the shop, the composers on the wall close-up

In the shop, the paintings above the piano are the **four makers of the game**, as oil paintings in old-fashioned clothes (`public/art/portraits/team-1` … `team-4`). Clicking them opens the close-up of the wall, where the composers hang, without name plaques, ten to a wall, to be sorted and filtered on the kind of music; each opens its card with the biography and the music. We have no portraits of the composers, so every composer is the standard silhouette in a wig (`public/art/portraits/unknown.webp`).

## For the player

1. **Shop wall**: the four team paintings above the piano, two by two around the hanging lamp, without name plaques. The hotspot is called *Schilderijen*.
2. **Portrait wall** (*De componisten*), full screen: the close-up `public/art/closeups/gallery-wall.webp` (green damask wall, picture lamp, wainscot) with the composers in gilded frames, two rows of five, slightly crooked like on a real wall, with the standard silhouette and no name (the name is on the card). Pointing at a frame straightens it and makes it glow; click it to open the composer.
   - **Built for many composers**: ten hang on a wall; with more (after the filters), more walls follow, walked with the brass arrows or ← →, with dots under the portraits showing which wall is in view.
   - **Sorting and filtering**: two brass buttons on the wainscot, each showing what is chosen (*Sorteer A – Z ▾*, *Muziek Alles ▾*; a filter in use gets a small red seal). Pressed, a button folds its options open above it on a dark wooden board, the chosen one lit with a ✓; one menu is open at a time, and a click elsewhere, Esc or Backspace fold it up (↑ ↓ move between the options, Enter picks). The options: *Sorteer* (*A – Z*, the default, *Oud → nieuw* by year of birth, *Nieuw → oud*), *Muziek* (*Alles*, *Pianomuziek*, *Symfonieën*, *Opera*, *Ballet*, *Kerkmuziek*, *Concerten*). When nobody fits, a plate on the wall says *Geen componist past hierbij. Kies iets anders.* The choice is kept for the next visit. Every change re-hangs the wall, the frames coming in one after the other.
3. Meneer Simone's topic *Wie zijn die mensen aan de muur?* says the paintings in the shop are the makers of the game, and that clicking them leads to the composers.
4. **Composer card** (a paper card over the dimmed wall):
   - Large portrait with plaque.
   - Large portrait with plaque on the left.
   - **Biography** (*Het verhaal van …*) on the right, in short, simple sentences, a **Wist je dat?** (did you know?) fact, and birth/death dates and places. **Voorlezen** (speaker icon) reads it aloud in Dutch; press it again (*Stoppen*) to stop. Leaving the card stops the voice too.
   - Under it, **Muziek van …**: one card per piece of this composer (their hand-written pieces, which are not in the cabinet: that holds the SOM songs), with its music cylinder, title and subtitle, and two buttons: **Luister** plays it on the [gramophone](gramophone.md), **Bladmuziek** opens the [sheet-music book](sheet-music.md). Composers without pieces yet get a short note from Meneer Simone instead.
   - The family tree that used to be here was removed.

The six composers: Bach, Mozart, Beethoven, Chopin, Verdi, Tchaikovsky (*Tsjaikovski* in Dutch).

## How it's built

`js/ui/gallery.js`: `galleryView()` and `composerView()`. Data in `js/data.js` (see [content data](content-data.md)): `TEAM` lists the four team portraits for the shop wall, with an empty `name` (fill one in and a brass plaque appears under that frame in the shop). The composers have no `portrait`, so `portraitOf(c)` gives `NO_PORTRAIT` (`portraits/unknown.webp`); give a composer a `portrait` and it shows instead (`assets/portraits/*.jpg` are in the repo but not used).

- **Shop wall**: `FRAMES` in `js/shop.js` (centre x, top, height in world units, and the team id); `drawFrame()` skips the plaque when there's no name.
- **Wall close-up**: `galleryView()` uses `frame(…, { closeup })` (see [game shell](game-shell.md)). `COLS` × `ROWS` (5 × 2 = `PER_WALL`) give the frames' centre x and top, `FRAME_H` their height, in pixels of the 1672 × 941 picture; they're turned into percentages so the frames scale with the picture. `choice` holds the sort, the two filters and the wall in view; `shown()` filters and sorts `COMPOSERS`, `hang(from)` puts the wall's composers up (Web Animations fade-in, staggered, sliding in from the side when walking to another wall; not for the first hanging, which happens before the view is in the page, where an animation would stay stuck and leave the wall empty), sets the arrows, dots, the buttons' values and the chosen options. `MENUS` describes the two buttons; `openMenu()` opens one (closing any other) and while it is open listens to keys and clicks on the window first, so they fold the menu instead of leaving the wall. The kinds come from `MUSIC_KINDS` in `js/data.js`, shown only when some composer has them; each composer lists its own in `music`. Which frame each composer gets (`COMPOSER_FRAME`, or one in turn for a composer without), and the size of each frame's opening, come from `js/frames.js` (shared with the shop wall). The portrait is an `<img>` under the frame image, fitted to the opening and rounded for the oval frames.

- **Composer card**: a CSS grid, portrait (`p`) left over two rows, biography (`b`) and music (`m`) on the right. The music cards use `cylinderColor()` and `coverFor()` from `js/ui/library.js`, so the cylinder and the little cover on the button are the same as at the gramophone and in the cabinet.
- On narrow screens portrait, biography and music stack vertically.
- **No portrait**: `portraitOf(c)` in `js/data.js` gives a composer's portrait, or `NO_PORTRAIT` (`public/art/portraits/unknown.webp`, a silhouette in a wig, no one in particular) when they have none. A portrait that won't load switches to it too (`onerror`, on the shop wall, the wall close-up and the card). The makers of the real songs (`creditFor()`) get it as their `portrait`.
- The `tree` data in `js/data.js` is no longer shown.

## Known limits / next steps

- Pieces exist only for Bach, Mozart and Beethoven so far; Chopin, Verdi and Tchaikovsky have a biography only.
- Links between composers (teachers, influences) from the design guide's story flow aren't there yet.
