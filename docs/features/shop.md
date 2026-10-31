# Shop interior

Inside *Muziekhandel Simone*: an empty painted room, furnished with separate pieces of art, with four things to use, the door out to the street, and a way through to the [listening corner](listening-corner.md) on the right.

## For the player

- Walk around like on the street, or click an object to walk to it and open it.
- Pointing at an object, or standing next to it, shows a paper label above it (no lit-up rectangle around it). When the boy stands next to it the label starts with ↑: press ↑ / Enter / E / Space to use it.
- On the first visit, Meneer Simone greets the player.

Left to right:

| Object | Art | Opens |
|---|---|---|
| Door | part of `back-wall.webp` | Back to the [street](street.md) |
| Portraits: the four makers of the game, two by two above the piano | `shop/frames/*.webp` + `portraits/team-*.webp` | Close-up of the [portrait wall](composers.md) (`closeups/gallery-wall.webp`), then *De makers van dit spel* |
| Upright piano | `shop/piano.webp` | [Piano](piano.md) |
| Counter with the shopkeeper behind it | `shop/counter.webp`, `characters/shopkeeper/full.webp` | [Shopkeeper](shopkeeper.md) |
| Cabinet, right of the counter | `shop/cabinet.webp` | Close-up of the [sheet music cabinet](sheet-music.md) (`closeups/cabinet.webp`) with the cylinders from `items/cylinder/` |
| Right edge (*Luisterhoek →*) | — | The [listening corner](listening-corner.md) with the gramophone |

Walking past the cabinet to the right edge (→ held, or a click on the edge) also goes to the listening corner.

## How it's built

`js/shop.js`, class `Shop`. All art is in `public/art/`.

- **Room**: `shop/back-wall.webp` (1774 × 887) is drawn at 1440 × 720 world units. The floor starts at about y = 570; the furniture stands on y ≈ 620–640 and the boy walks in front of it with his feet at y = 692.
- **Furniture** (`FURNITURE`): each piece has an x position, the y of its bottom edge and a width; its height follows the image's proportions. Pieces get a soft shadow on the floor and are drawn left to right.
- **Counter**: `counter.webp` has three panels; the middle one is cut out on a canvas (`counterArt()`, from the middle of one pillar to the middle of the next, which match), and the music book that lay across the cut is put back whole. So the counter is narrower (436 units) but just as tall: its desk top (y ≈ 469) is just below the window sill.
- **Against the wall**: the piano (320 wide) and the cabinet (270 wide) stand on the floor right in front of the skirting (`wall: true`, bottom at y ≈ 597; the skirting meets the floor at y ≈ 575). Instead of a big floor shadow they get a dark halo on the wall around them and a thin shadow where they meet the floor. The counter (with the shopkeeper, 162 wide) stands further into the room. The portraits hang a little higher so their plaques clear the piano.
- **Shopkeeper**: drawn before the counter so the counter hides his legs; placed so his waist is at the desk top, and clipped at the counter's bottom edge.
- **Frames** (`FRAMES`, sized to fit on the green wall panel between the pillars and under the ceiling beam, x ≈ 345–710, heights 62–74 units; with `FRAME_TYPES` and `TEAM_FRAME` from `js/frames.js`, shared with the [portrait wall close-up](composers.md)): four frames above the piano, two by two close together around the hanging lamp (centres x 446 and 560, tops 126 and 212), 80 units high. They hang **behind** the lamp: `LAMP` is the lamp cut out of `back-wall.webp` (`public/art/shop/lamp.webp`, made by `scripts/cut_shop_lamp.py`: everything in its box that isn't the dark green wallpaper, plus the dark outline right around it), drawn again at its own place right after the frames. Five gilded frame images with a transparent opening. For each frame the opening was measured in pixels (`inner`); the team portrait is drawn behind it, clipped to an oval or rectangle and scaled to cover the opening, and the frame is drawn on top with a drop shadow. A small brass plaque hangs under a frame only when that portrait has a `name` in `TEAM`.
- **Evening lights**: the shop uses the same real-time sky as the [street](street.md) (`skyAt(currentHour())`). As it gets dark the room is tinted dark blue (the boy a little less, with a brightness filter), and when the street lamps go on (`sky.lampsOn`) the three hanging lamps (`LAMPS`, measured on `back-wall.webp`) light up: a bulb, soft cones of light (several overlapping cones, so the edges are soft), a glow on the wall and a pool on the floor. They are kept fairly soft (an old shop lit by a few bulbs), between too bright and too dark, get brighter as it gets darker and hum very slightly. Test with `?uur=21`.
- **Foreground**: only the left 600 units of `shop/foreground.webp` (hanging lamp, plant, chair) are drawn over the boy and the furniture; the right part (music stand) would hide the cabinet.
- **Hotspots** (`HOTSPOTS`): rectangles in world units. Each rectangle has its own `stands` x position where the boy walks to. Finding, highlighting and labelling them is shared with the listening corner in `js/hotspots.js` (`hitSpot`, `nearestSpot` — closest stand within 80 units, used by ↑ / Enter — `clickSpots`, `drawLabel`). The dashed gold outline around hovered or nearby objects was removed. The cat on the piano is a spot of its own (`CAT`, label *Poes*): clicking it meows at once (see [sound effects](sound-effects.md)) and a little *Miauw!* floats up beside it (`drawMeow()`); it has no stand, so the keyboard never picks it instead of the piano.
- **Fitting**: the shop sets `fitWidth = 1440`. On screens around 16:9 the game scales the room to show it whole, with thin bars above and below, instead of scrolling (see [game shell](game-shell.md)). On narrow screens the camera still follows the boy.

If a piece of art is replaced or moved, update its numbers in `FURNITURE` / `FRAMES` and the matching rectangle in `HOTSPOTS`.

## Known limits / next steps

- The shopkeeper doesn't move yet. The body parts and heads in `characters/shopkeeper/` could be rigged to make him blink, talk, wave and point at objects.
- The portraits are generated reference art, not real paintings.
- The cat on the piano is part of the piano image, so it doesn't move.
