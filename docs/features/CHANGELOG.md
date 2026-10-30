# Changelog

Newest first. Each entry links to the feature document it touches.

## 2026-10-30 — Smaller portraits in the shop, composer card without family tree

Changed:

- [Shop](shop.md): the six composer portraits above the piano are about a quarter smaller and sit on the green wall between the pillars, no longer running into the pillars or the ceiling beam.
- [Composers](composers.md): the composer card no longer shows the family tree. It has the portrait, the biography and, under it, *Muziek van …*: the composer's pieces, each with *Luister* (gramophone) and *Bladmuziek* (sheet-music book).
- [Shopkeeper](shopkeeper.md): his answer about the portraits now mentions the story and the music instead of the family.

## 2026-10-30 — Muziekhandel Simone, bigger help dialog

Changed:

- The shop is now **Muziekhandel Simone** (page title, title screen sign, in-game texts) and the shopkeeper is **Meneer Simone**, matching the sign painted on the shop front ([shopkeeper](shopkeeper.md), [shop](shop.md), [game shell](game-shell.md), [street](street.md)).
- [Shopkeeper](shopkeeper.md): the dialog is bigger and every answer, including the keyboard guide, fits without scrolling on desktop and laptop screens.

## 2026-10-30 — Talking shopkeeper, new help dialog, natural lady cyclist, gramophone room by the clock

Changed:

- [Shopkeeper](shopkeeper.md): his face (`head.webp` / `head-talk.webp` / `head-blink.webp`) talks while his words appear, in the dialog and in the tip medallions, and while *Voorlezen* reads aloud; he blinks now and then. The dialog is redesigned: speech bubble next to his portrait, questions written on the paper like notebook lines instead of white buttons, no scrollbar (long answers scroll inside the bubble with a fade).
- [Cyclists](cyclists.md): the lady is cut in one piece out of her finished drawing, sitting on a bicycle lined up on its hubs; only her boots pedal under the skirt, so she looks like one natural drawing.
- [Gramophone](gramophone.md) and [listening corner](listening-corner.md): the room in the gramophone view is drawn by the same code as the scene, so the window and lamps follow the clock there too; the cylinder stands beside the phonograph. The new cylinder phonograph is drawn down to its base instead of being cut off.
- [Shop](shop.md), [listening corner](listening-corner.md), [game shell](game-shell.md): no more lit-up rectangles around hovered or selected objects and buttons.

## 2026-10-30 — Going through the shop door, keeper dialogue higher

Changed:

- [Street](street.md): going into the shop is a little scene now: the door swings open, warm light falls out, the boy steps over the threshold into the light and the door closes behind him (and the other way round coming out).
- [Shopkeeper](shopkeeper.md): the dialogue with the questions sits higher on the screen instead of at the bottom edge; the tip medallion bottom-left no longer bobs up and down.

## 2026-10-30 — Sheet music as a book, dimmer shop lights

Changed:

- [Sheet music](sheet-music.md): the music is a real book on a wooden desk, full screen. The chosen book flies from the cabinet to the middle of the screen and lies there closed; the player opens it and turns the pages from right to left around the spine with a smooth 3D page turn (→ ← keys, the brass buttons or a click on a page): cover, title page (`cover-inside.webp`), then the music two pages at a time, 4 lines of 2 bars per page with bigger notes.
- [Shop](shop.md): the evening lamps are softer than before, but not dark (a middle setting).
- [Piano](piano.md): the buttons, octave buttons, status line and pedal are sized only in `cqw`, so they stay inside the piano picture on small screens instead of sticking out over the background.
- [Game shell](game-shell.md): `frame({ full: true })` without a close-up picture gives a full-screen wooden desk; `ui.open(…, { noFade: true })` opens a full-screen view without the fade to black.

## 2026-10-30 — Louder piano, light-up keys, cyclist puppets, sheet-music books

Changed:

- [Audio](audio.md): the piano is louder (+8 dB), with a limiter so loud chords don't clip.
- [Piano](piano.md): plain keys without shadows or labels; a key only lights up (with a beam of light and a floating ♪) while it sounds or is the next one to play, together with the note on the sheet. Buttons without emoji, a little bigger.
- [Game shell](game-shell.md): no emoji on any button; no place names top-left (plaque and close-up titles removed).
- [Sheet music](sheet-music.md): the cabinet holds sheet-music books (`items/sheet-music/cover-1…6`) with the title and composer printed on the cover, and stars on the plaques. Opening one swings its cover open onto the title page (`cover-inside.webp`, only the title and composer change). Covers and title page use Playfair Display.
- [Gramophone](gramophone.md): the picture is the listening corner with the chosen cylinder standing big in it, with its label.
- [Cyclists](cyclists.md): the hand-drawn cyclists are replaced by cut-out puppets of the gentleman and the lady (`characters/cyclist-man`, `cyclist-woman`), with turning wheels and crank and legs that follow the pedals.

Added:

- [Piano](piano.md): in the evening the candles flicker with a faint glow and the room around the piano darkens a little.
- [Listening corner](listening-corner.md): follows the real time of day: night sky in the window, darker room, glowing lamps.
- [Game shell](game-shell.md): Backspace / Esc / the browser's back button go one place back; shopkeeper tips close with any key or click.

## 2026-10-30 — Full-screen close-ups, furniture against the wall

Changed:

- [Piano](piano.md): full screen on the piano close-up (`closeups/piano.webp`): music on the music desk, keys in the key slot, buttons on the wood. No window frame.
- [Composers](composers.md) and [sheet music cabinet](sheet-music.md): the close-ups fill the screen too. Opening and closing them fades to black like a scene change ([game shell](game-shell.md)).
- [Shop](shop.md): the piano and the cabinet stand against the back wall, with a soft shadow on the wall.

## 2026-10-30 — Shop sizes and evening lights

Changed:

- [Shop](shop.md): bigger piano, cabinet and shopkeeper; the counter is narrower (its middle panel is cut out) but keeps its height, with the desk top just below the window.

Added:

- [Shop](shop.md): in the evening (real time) the room darkens and the three hanging lamps light up, with soft cones of light, a glow on the wall and pools on the floor.

## 2026-10-30 — Taller counter, door entrance, cylinders at the gramophone

Changed:

- [Shop](shop.md): the counter is bigger, its desk top now just below the window sill; the shopkeeper moved up with it, the piano is a little narrower and further left, and the cabinet stands right behind the counter's end.
- [Player](player.md): standing still, the boy's feet are apart instead of crossed.
- [Street](street.md): the boy follows the pavement, which runs lower in front of the shop, and no longer stands on top of the door: he steps onto the doorstep and fades into the shop (and steps out the same way).
- [Gramophone](gramophone.md): records are replaced by the music cylinders from `items/cylinder/`, in the same colours as in the cabinet; the chosen cylinder lies on the gramophone and turns while it plays. In the [listening corner](listening-corner.md) the crate is now *Cilinders*; the [shopkeeper](shopkeeper.md) talks about cylinders.

## 2026-10-30 — New boy, living street

Changed:

- [Player](player.md): the boy is now the `characters/kid-past` character, built as a cut-out puppet from his separate pieces. The walk is posed every frame (swinging and bending legs, swinging arms, body bob, lean), eases in and out, and he breathes when standing still. Before, an 8-frame sprite was played at a fixed pace and looked stiff.
- [Street](street.md): the canal water ripples and sparkles; the gas lamps (on the quay and across the canal) flicker, glow softly by day and reflect in the water at night.

Removed:

- `assets/boy-walk.png` and its step in `tools/build_assets.py` ([assets](assets.md)).

## 2026-10-30 — Full piano: 88 keys, octaves, pedal

Fixed:

- [Piano](piano.md): only C3–G5 could be played. The piano now has all 88 keys (A0–C8). ← / → (or *Lager* / *Hoger*) shift the computer keyboard by an octave, shown by a brass bar over the keys it reaches; *Speel mee* shifts it by itself when needed.
- [Piano](piano.md): there was no pedal. Shift is now the sustain pedal, and the brass pedal under the keys can be clicked to lock it; a MIDI keyboard's pedal works too. The keyboard guide and the shopkeeper's tip explain both.

## 2026-10-30 — Close-ups for the cabinet and the portrait wall

Changed:

- [Sheet music cabinet](sheet-music.md): opens on the close-up `closeups/cabinet.webp`. Each piece is a cylinder in its own compartment, with the composer on the brass plaque; the shelves go by difficulty (★ top, ★★ middle, ★★★ bottom).
- [Composers](composers.md): *Componisten* opens the close-up `closeups/gallery-wall.webp` with the six portraits in the shop's gilded frames.
- [Game shell](game-shell.md): `frame()` has a `closeup` option (wooden panel around a picture, with a `stage` to place things on in percentages).

Added:

- `js/frames.js`: the frame measurements and which frame each composer hangs in, shared by the shop wall and the gallery close-up ([shop](shop.md)).

## 2026-10-30 — Shop rearranged, listening corner

Added:

- [Listening corner](listening-corner.md): a new room to the right of the shop (`closeups/gramophone-corner.webp`) with the gramophone on the round table and a crate of records; both open the [gramophone](gramophone.md). Walk left (or click the left edge) to go back.
- `js/hotspots.js`: hotspot finding, highlight outline and paper label, shared by the shop and the corner.

Changed:

- [Shop](shop.md): the counter is bigger (in scale with the shopkeeper), the cabinet stands right of the counter, all six portraits hang above the piano, and the gramophone is gone from the shop. Walking off the right edge leads to the listening corner.
- [Shopkeeper](shopkeeper.md): his answers describe the new layout and send the player right for the gramophone.
- [Game shell](game-shell.md): third scene `corner`; `enter(from)` gets the previous scene's name.

## 2026-10-30 — New shop furniture

Changed:

- [Shop](shop.md): the single painted interior is replaced by the room built from `public/art/shop/`: the empty `back-wall`, then (left to right) the `cabinet`, the `piano`, the `counter` with the shopkeeper behind it, and the `gramophone`, with `foreground` silhouettes in front. Hotspots and walking spots were re-placed on the new furniture.
- [Composers](composers.md) now hang on the shop wall: the six portraits sit inside the gilded `shop/frames`, with brass name plaques (Bach, Mozart, Beethoven, Chopin above the piano; Verdi, Tchaikovsky above the gramophone). The painted plaque fixes are gone.
- [Sheet music cabinet](sheet-music.md): the CSS tubes are replaced by the cylinder images from `public/art/items/cylinder/`; clicking one shows the opened cylinder before the music opens.
- [Shopkeeper](shopkeeper.md): his face in the help medallions is now `characters/shopkeeper/head.webp`.
- [Game shell](game-shell.md): the title screen uses the new shop room as background.

Removed:

- `assets/shop-interior.jpg` and its step in `tools/build_assets.py` ([assets](assets.md)).

## 2026-10-30 — Painted Amsterdam street

Changed:

- [Street](street.md): the code-drawn houses, canal and bridge are replaced by the four painted layers in `public/art/past-street/` (sky, far, walk, foreground) with parallax. The walk layer has the shop, so door, lamps and window glows were re-measured on it. The world is now 2160 units wide instead of 3400.
- [Sky](sky.md): the painted sunset sky shows as it is around sunrise and sunset; by day and night it is blended into the real-time gradient for its clouds. The flat code-drawn clouds are gone.
- Night lighting now tints the painted layers (cached per darkness level) instead of drawing a dark rectangle over the scene.
- [Cyclists](cyclists.md) ride on the new quay and are drawn larger.
- The boy starts closer to the shop, so it's visible from the first frame.

## 2026-10-30 — First playable version

Added:

- [Street](street.md) in Amsterdam around 1900, with canal crossing, houses and the music shop.
- [Real-time sky](sky.md) that follows the visitor's local time.
- [Cyclists](cyclists.md) who ride past while the player is idle.
- [Player character](player.md) from the 8-frame walk cycle.
- [Shop interior](shop.md) with five interactive objects.
- [Sheet music cabinet and viewer](sheet-music.md) with page flipping and Space-to-piano.
- [Piano](piano.md) with free play, *Luister* (listen) and *Speel mee* (play along), keyboard guide and MIDI input.
- [Audio](audio.md): Salamander Grand Piano via Tone.js, plus a gramophone sound.
- [Composers](composers.md): portrait wall, biography and family tree for six composers.
- [Gramophone](gramophone.md) record player.
- [Shopkeeper](shopkeeper.md) who greets and helps the player, with read-aloud.
- [Game shell](game-shell.md): title screen, scene switching, overlay stack, input.
- [Content data](content-data.md): six composers, five demo pieces.
- [Assets](assets.md) and `tools/build_assets.py` to rebuild them.

Fixes made while testing the first version:

- Shop scales to show the whole room on 16:9 screens instead of cutting off the gramophone.
- Hotspot labels no longer get cut off at the edge of the screen.
- Night window glow follows arched window tops.
- Piano view shows one line of music, so score and keyboard fit on one screen.
- Gramophone art is cropped to remove the Italian labels baked into the image.
- Shopkeeper's greeting is gender-neutral ("Zeg het maar!").
- Portrait-orientation hint on phones.
