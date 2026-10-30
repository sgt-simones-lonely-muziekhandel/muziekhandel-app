# Street outside the shop

The first scene. The player stands on a canal street in Amsterdam around 1900: a canal crossing with a bridge on the left, a row of canal houses on the right, and *Muziekhandel Van der Velde* among them.

## For the player

- Walk with ← → (or A / D), or click/tap anywhere on the street to walk there.
- At the shop door a label says **↑ Naar binnen**; press ↑, Enter, E or Space, or click the shop front, to go inside.
- Until the player reaches the door, a yellow arrow bounces above it so even a five-year-old knows where to go.
- Standing still for a few seconds brings out [cyclists](cyclists.md).

## How it's built

`js/street.js`, class `Street`. Everything is drawn live on the canvas every frame; there's no background image.

- **World**: 3400 × 720 virtual pixels. The ground line is at y = 640. The canvas scales the virtual height to the window height (see [game shell](game-shell.md)), and the camera follows the boy.
- **Layers, back to front**, each with its own parallax factor:
  1. Sky, sun/moon, stars, clouds (screen space; see [sky](sky.md))
  2. Distant skyline with a Westertoren-like tower (0.25)
  3. Canal: far-bank houses, trees, water with shimmer, a moored boat (0.55)
  4. Main layer (1.0): bridge railing, houses, shop, cobbles, bridge front with arches, street lamps, the boy, cyclists
  5. Foreground silhouettes: a tree top-left and grass tufts at the bottom (1.3), for the *Valiant Hearts* framing from the design guide
- **Hand-drawn look**: `wobPath()` draws polygons whose edges are split into short segments with a small random jitter, then filled and inked with a thick dark outline. The jitter comes from a seeded random generator (`rng(seed)`), re-created each frame, so the wobble is the same every frame and doesn't flicker.
- **Houses** are generated once by `buildHouses()` from a fixed seed: width, height, gable type (`step`, `neck`, `bell`, `spout`, `cornice`), brick or plaster colour, arched windows, shutters. The range left of the shop is filled exactly up to the shop, so the row has no gaps.
- **The shop** (`drawShop`) is a fixed, hand-placed facade: green shopfront, gold sign in Cinzel Decorative, two warmly lit display windows (sheet music, a violin, a gramophone horn), the door and a hanging sign with a note. The door is at `DOOR_X` (exported).
- **Cobbles** are a pattern tile rendered once into an offscreen canvas.
- **Night**: when the sky is dark, a blue overlay goes over the main layer, then lit windows, display windows and lamp glows are added with `globalCompositeOperation = 'lighter'`. The boy and cyclists are drawn after the overlay with a canvas brightness filter, so they stay readable.
- **Amsterdammertjes**: the red-brown street posts along the pavement.

## Interface with the game

`enter(from)`, `update(dt, input)`, `draw(ctx, view)`, `click(wx, wy)`, `hover(wx, wy)`, `interact()`, `width`, `boy`. The same interface is used by [the shop](shop.md).

## Known limits / next steps

- The street is drawn in code, not painted. A layered illustration (sky, far, middle, foreground as separate transparent images) would look closer to the mood boards and still keep the dynamic sky and parallax.
- No pedestrians, birds or sounds yet.
- The canal crossing is decorative; the player can't go anywhere but the shop.
