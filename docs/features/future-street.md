# Future street (the start)

The first scene of the game. The same canal quay as the [street](street.md), far in the future: the canal has flooded, the houses are ruins, it rains, and the music shop is boarded up behind the water. The boy wears his grey jacket and gas mask. On the quay stands an old crate with phonograph cylinders and sheet music: the only warm light in the street.

## For the player

- Walk with ← → (or A / D), or click/tap anywhere on the quay to walk there. The quay ends at the flood, so the shop can't be reached.
- A yellow arrow bounces above the crate. Close to it a label says **↑ Open de kist**; with the pointer over it, **Een oude kist**.
- Press ↑, Enter, E or Space next to the crate, or click it: the boy walks to it, faces it, and the crate's glow swells until it fills the screen. Then the game goes to the past (for now straight to the [street](street.md); the story with the cylinder and the time travel comes in between later).
- Rain falls the whole time, and every 8–20 seconds distant lightning lights up the sky.

## How it's built

`js/future.js`, class `FutureStreet`. Built like the [street](street.md), from four painted layers in `public/art/future-street/`:

| Layer | File | Drawn |
|---|---|---|
| Sky | `sky.webp` (1672 × 941, opaque) | Screen space, covering the view, sliding a little with the camera and drifting very slowly |
| Far | `far.webp` | Parallax 0.6: ruined houses, the broken bridge, the tower |
| Walk | `walk.webp` | Parallax 1: the quay, fallen lamp, bicycle, loudspeaker post and the boarded-up shop |
| Foreground | `foreground.webp` | Parallax 1, on top: dark ruin silhouettes at both ends |

- **World size and camera**: the same as the street (2160 × 720 units, camera follows the boy).
- **Order**: sky → far → walk → water → crate glow and crate → hint → boy → foreground → rain → lightning.
- **Positions** (world units, measured on `walk.webp`): the boy's feet at `FOOT_Y` = 574, he starts at `START_X` = 560 and can walk up to `WALK_MAX` = 1450 (the flood); the crate stands at `CRATE_X` = 1415, `CRATE_W` = 150 wide, and the boy opens it from `CRATE_STAND`. If the art is replaced, these need to be measured again.
- **The boy**: `new Boy(x, 'kid-future')` (see [player](player.md)), drawn a little darker and greyer (`brightness(0.9) saturate(0.85)`) so he sits in the cold light of the painting.
- **Crate** (`public/art/future-street/crate.webp`): a warm radial glow behind it breathes slowly (`lighter` blending); while opening (`OPEN_TIME` = 1.4 s) it grows to fill the screen, then `game.goTo('street')`.
- **Water** (`drawWater()`): as on the street, the painted water is redrawn in 2-pixel rows shifted by slow sine waves: the canal along the front (from `WATER_TOP`) and, more gently, the flooded street in front of the shop (right of `FLOOD_X0`, between `FLOOD_TOP` and `FLOOD_BOTTOM`). A few warm glints of the last light come and go.
- **Rain** (`drawRain()`): 220 slanted strokes in screen space, falling at slightly different speeds.
- **Lightning** (`drawFlash()`): a cold light added over the whole picture, with a quick double flicker, then fading.

## Testing

`?autostart` starts here. `?autostart&scene=street` skips to the past.

## Known limits / next steps

- The story after opening the crate (crate close-up, the cylinder tube, the swirl into the past, arriving at the shop) is still to be built. The art is in `public/art/intro/` (see the [design guide](../design/README.md)).
- No sound yet: rain, wind and distant thunder would help the mood.
- The boy has no special pose for opening the crate (kneeling, reaching).
