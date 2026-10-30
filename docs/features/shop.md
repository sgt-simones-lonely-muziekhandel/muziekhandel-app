# Shop interior

Inside *Muziekhandel Van der Velde*: an empty painted room, furnished with separate pieces of art, with four things to use, the door out to the street, and a way through to the [listening corner](listening-corner.md) on the right.

## For the player

- Walk around like on the street, or click an object to walk to it and open it.
- Pointing at an object, or standing next to it, makes it glow with a moving dashed gold outline and shows a paper label. When the boy stands next to it the label starts with ↑: press ↑ / Enter / E / Space to use it.
- On the first visit, Meneer Van der Velde greets the player.

Left to right:

| Object | Art | Opens |
|---|---|---|
| Door | part of `back-wall.webp` | Back to the [street](street.md) |
| Portraits: all six composers in a gallery wall above the piano | `shop/frames/*.webp` + `assets/portraits/*` | Close-up of the portrait wall (`closeups/gallery-wall.webp`), then each [composer](composers.md) |
| Upright piano | `shop/piano.webp` | [Piano](piano.md) |
| Counter with the shopkeeper behind it | `shop/counter.webp`, `characters/shopkeeper/full.webp` | [Shopkeeper](shopkeeper.md) |
| Cabinet, right of the counter | `shop/cabinet.webp` | Close-up of the [sheet music cabinet](sheet-music.md) (`closeups/cabinet.webp`) with the cylinders from `items/cylinder/` |
| Right edge (*Luisterhoek →*) | — | The [listening corner](listening-corner.md) with the gramophone |

Walking past the cabinet to the right edge (→ held, or a click on the edge) also goes to the listening corner.

## How it's built

`js/shop.js`, class `Shop`. All art is in `public/art/`.

- **Room**: `shop/back-wall.webp` (1774 × 887) is drawn at 1440 × 720 world units. The floor starts at about y = 570; the furniture stands on y ≈ 620–640 and the boy walks in front of it with his feet at y = 692.
- **Furniture** (`FURNITURE`): each piece has an x position, the y of its bottom edge and a width; its height follows the image's proportions. Pieces get a soft shadow on the floor and are drawn left to right.
- **Counter**: 632 units wide, so its desk top (y ≈ 469) is just below the window sill. It stands a little in front of the cabinet's left edge, so it is drawn after the cabinet. To make room, the piano is 280 wide and stands at x = 340, and the portraits moved 20 units left with it.
- **Shopkeeper**: drawn before the counter so the counter hides his legs. He is placed so his waist lines up with the desk top, and the drawing is clipped at the counter's bottom edge.
- **Frames** (`FRAMES`, with `FRAME_TYPES` and `COMPOSER_FRAME` from `js/frames.js`, shared with the [portrait wall close-up](composers.md)): a gallery wall above the piano, two frames in the top row (left and right of the hanging lamp) and four below. Five gilded frame images with a transparent opening. For each frame the opening was measured in pixels (`inner`); the composer portrait is drawn behind it, clipped to an oval or rectangle and scaled to cover the opening, and the frame is drawn on top with a drop shadow. A small brass plaque with the composer's short name hangs under each frame.
- **Foreground**: only the left 600 units of `shop/foreground.webp` (hanging lamp, plant, chair) are drawn over the boy and the furniture; the right part (music stand) would hide the cabinet.
- **Hotspots** (`HOTSPOTS`): rectangles in world units. Each rectangle has its own `stands` x position where the boy walks to. Finding, highlighting and labelling them is shared with the listening corner in `js/hotspots.js` (`hitSpot`, `nearestSpot` — closest stand within 80 units, used by ↑ / Enter — `clickSpots`, `drawOutline`, `drawLabel`).
- **Fitting**: the shop sets `fitWidth = 1440`. On screens around 16:9 the game scales the room to show it whole, with thin bars above and below, instead of scrolling (see [game shell](game-shell.md)). On narrow screens the camera still follows the boy.

If a piece of art is replaced or moved, update its numbers in `FURNITURE` / `FRAMES` and the matching rectangle in `HOTSPOTS`.

## Known limits / next steps

- The shopkeeper art is a side view with his hands behind his back; he looks left towards the door. He doesn't move yet. The body parts in `characters/shopkeeper/` (head, torso, arms, legs) could be rigged to make him wave, nod and point at objects.
- The portraits are generated reference art, not real paintings.
- The cat on the piano is part of the piano image, so it doesn't move.
