# Street outside the shop

The first scene. The player stands on a canal quay in Amsterdam around 1900: the canal in front, a view down a second canal with an arched bridge and a church tower behind, and the music shop on the right.

## For the player

- Walk with ← → (or A / D), or click/tap anywhere on the quay to walk there.
- At the shop door a label says **↑ Naar binnen**; press ↑, Enter, E or Space, or click the shop front, to go inside. The boy walks to the door, steps up onto the doorstep and fades into the doorway; coming back out, he steps out of the door the same way.
- The pavement follows the painting: along the railing, then a little lower in front of the shop, so the boy walks along the shop front instead of over it.
- Until the player reaches the door, a yellow arrow bounces above it so even a five-year-old knows where to go.
- Standing still for a few seconds brings out [cyclists](cyclists.md).
- The sky and the light follow the real time of day (see [sky](sky.md)).

## How it's built

`js/street.js`, class `Street`. The scene is made of four painted layers from `public/art/past-street/`:

| Layer | File | Size | Drawn |
|---|---|---|---|
| Sky | `sky.webp` | 1672 × 941, opaque sunset | Screen space, blended with the real-time sky gradient (see [sky](sky.md)) |
| Far | `far.webp` | 2172 × 724, transparent sky | Parallax 0.6: houses, trees, bridge and tower across the canal |
| Walk | `walk.webp` | 2172 × 724, transparent above | Parallax 1: the quay the boy walks on, with lamps, bench, bike, flower boxes and the shop |
| Foreground | `foreground.webp` | 2172 × 724, transparent middle | Parallax 1, on top of everything: black silhouettes (lamp, trees, posts) framing the left and right ends |

- **World size**: the layers are scaled from 724 to 720 px high, so the world is 2160 × 720 units. The camera follows the boy and stops at the edges; on very wide screens the scene is centred.
- **Start position**: the boy starts at x = 1150, so on a normal screen the shop is already in view on the right.
- **Order**: sky → far → walk → night lights → door hint → boy → cyclists → foreground.
- **Positions** measured on `walk.webp` (in world units): the boy's feet at y = 556 along the railing and `SHOP_FOOT_Y` = 570 in front of the shop (`footAt(x)` blends between them from x = 1640 to 1780), the doorstep at `DOOR_SILL`, cyclists at y = 574, the shop door at `DOOR_X = 2072`, the clickable shop front in `SHOP`, the two street lamps in `LAMPS`, the shop windows in `SHOP_LIGHTS`. If the art is replaced, these numbers need to be measured again.
- **Canal water** (`drawWater()`): the water at the bottom of `walk.webp` (from `WATER_TOP`) is drawn a second time in 2-pixel rows, each shifted sideways by two slow sine waves, more towards the front. The reflections wobble while the painting stays the same. Right of `WATER_X0` the stone steps go into the water, so there only the rows below `WATER_STEPS` move. On top, 70 glints (white by day, warm at night) appear and fade on the water.
- **Gas lamps**: every lamp flickers in its own rhythm (`flicker()`: a few fast sine waves and now and then a short dip). By day the two quay lamps and the six lamps across the canal (`FAR_LAMPS`, drawn in the far layer so they move with it) glow softly; in the evening the glow grows, lights a pool on the pavement and throws a wobbling column of light into the canal.
- **Night**: when the sky gets dark, the far and walk layers are tinted dark blue only where they have pixels (`nightTinted()`). The tinted copy is cached and only redrawn when the darkness changes by 2% or more, so it costs nothing per frame. Then lamp glows, light pools on the pavement and the shop window glow are added with `globalCompositeOperation = 'lighter'`. The boy and cyclists get a canvas brightness filter.

## Interface with the game

`enter(from)`, `update(dt, input)`, `draw(ctx, view)`, `click(wx, wy)`, `hover(wx, wy)`, `interact()`, `width`, `boy`. The same interface is used by [the shop](shop.md).

## Known limits / next steps

- The painted layers are lit for golden hour (warm lamps, lit windows) at every time of day; the tint only darkens them at night. A daytime version of the far and walk layers could be cross-faded in by day.
- The sign on the shop in the art says **MUZIEKHANDEL SIMONE**, while the game text says *Muziekhandel Van der Velde*. One of the two needs to change.
- The scene is one screen-and-a-half wide: there's only one place to go (the shop).
