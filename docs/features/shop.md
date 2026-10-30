# Shop interior

Inside *Muziekhandel Van der Velde*: a painted room with five things to use, plus the door out.

## For the player

- Walk around like on the street, or click an object to walk to it and open it.
- Pointing at an object, or standing next to it, makes it glow with a moving dashed gold outline and shows a paper label. When the boy stands next to it the label starts with ↑: press ↑ / Enter / E / Space to use it.
- On the first visit, Meneer Van der Velde greets the player.

| Object | Opens |
|---|---|
| Door (left) | Back to the [street](street.md) |
| Bookcase with rolled sheet music | [Sheet music cabinet](sheet-music.md) |
| Portraits on the wall | [Composers](composers.md) |
| Grand piano | [Piano](piano.md) |
| Shopkeeper at the counter | [Shopkeeper](shopkeeper.md) |
| Gramophone (right) | [Gramophone](gramophone.md) |

## How it's built

`js/shop.js`, class `Shop`, background `assets/shop-interior.jpg` (1440 × 720).

- **Hotspots** (`HOTSPOTS`) are rectangles in background-image pixels, so they stay on the painted objects at any screen size. Each has a `stand` x position where the boy walks to, and an `action`.
- **Nearest object**: `nearSpot` returns the hotspot whose `stand` is within 90 px of the boy; that's what ↑ / Enter uses.
- **Plaques**: some painted plaques under the portraits have spelling mistakes ("Beethoveum", "Vivaldt"). Clean brass plaques are drawn over them (`PLAQUES`).
- **Fitting**: the shop sets `fitWidth = 1440`. On screens around 16:9 the game scales the room to show it whole, with thin bars above and below, instead of scrolling (see [game shell](game-shell.md)). On narrow screens the camera still follows the boy.

## Known limits / next steps

- The shopkeeper is part of the background, so he can't move or talk with his mouth. A cut-out of him on white (2–3 poses) would let him wave and point.
- Two of the painted portraits are labelled "Vivaldi" and "Händel" as a guess; they aren't the six composers in the gallery. A version of the room with empty frames would let the real gallery portraits hang on the wall.
