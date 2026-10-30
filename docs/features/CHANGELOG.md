# Changelog

Newest first. Each entry links to the feature document it touches.

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
