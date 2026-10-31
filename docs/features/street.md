# Street outside the shop

The past: after the [future street](future-street.md), the player stands on the same canal quay in Middelburg around 1900: the canal in front, a view down a second canal with an arched bridge and a church tower behind, and the music shop on the right.

## For the player

- Walk with ← → (or A / D), or click/tap anywhere on the quay to walk there.
- At the shop door a label says **↑ Naar binnen**; press ↑, Enter, E or Space, or click the shop front, to go inside. The boy walks to the door and stops; the door swings open inwards (it hangs on its right-hand side) and warm light from the shop falls onto the pavement; the boy steps over the threshold, gets a little smaller as he goes in, his feet disappear behind the threshold and he fades into the light; then the door closes behind him and the screen fades to the shop. Coming back out plays the same thing backwards.
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
- **Order**: sky → far → walk → night lights → open door → door hint → boy → cyclists → foreground.
- **Door** (`DOOR`, `doorState()`, `drawDoor()`, `drawBoy()`): a timeline of `DOOR_OPEN` 0.5 s + `DOOR_WALK` 1.0 s + `DOOR_CLOSE` 0.45 s, run backwards when coming out. `doorState()` gives how far the door is open and how far the boy is through. The open door is drawn as the lit room (a warm gradient over the door opening), a pool of light on the pavement (stronger at night), and the door panel cut out of `walk.webp` and squeezed towards its hinges (`cos` of the angle, up to ~72°) and darkened as it turns away. The boy marches on the spot only while stepping through; he is clipped so his feet disappear behind the threshold, shrinks by 16 % and fades in the second half.
- **Positions** measured on `walk.webp` (in world units): the boy's feet at y = 556 along the railing and `SHOP_FOOT_Y` = 570 in front of the shop (`footAt(x)` blends between them from x = 1640 to 1780), the doorstep at `DOOR_SILL`, cyclists at y = 574, the shop door at `DOOR_X = 2072`, the clickable shop front in `SHOP`, the two street lamps in `LAMPS`, the shop windows in `SHOP_LIGHTS`. If the art is replaced, these numbers need to be measured again.
- **Canal water** (`drawWater()`): the water at the bottom of `walk.webp` (from `WATER_TOP`) is drawn a second time in 2-pixel rows, each shifted sideways by two slow sine waves, more towards the front. The reflections wobble while the painting stays the same. Right of `WATER_X0` the stone steps go into the water, so there only the rows below `WATER_STEPS` move. On top, 70 glints (white by day, warm at night) appear and fade on the water.
- **Gas lamps**: every lamp flickers in its own rhythm (`flicker()`: a few fast sine waves and now and then a short dip). By day the lamps are **off**: the pictures have their glass painted lit, so `unlit()` makes a copy of each layer once, with the glass of every lamp (an oval around `NEAR_LAMPS` / `FAR_LAMPS`, `NEAR_GLASS` / `FAR_GLASS` in layer pixels) turned into dark, cool glass: warm or pink bright pixels are pulled to a dim grey-blue keeping their shading, fading out towards the oval's edge. As it gets dark (`lampLevel()`, from darkness 0.25 to 0.7) `drawLitGlass()` paints the lit glass back from the original over it, and the glows come on: the flame, the halo, a pool on the pavement and a wobbling column of light in the canal.
- **Light of the hour** (`timeTinted()`): the pictures are painted in warm late-afternoon light. At sunrise and sunset (`sky.painted`) they show as painted; by day they are cooled to plain daylight (30% less saturated, 6% brighter, a faint sky blue on top), and when the sky gets dark they are tinted dark blue; only where the layer has pixels. The copy is cached and only redrawn when the light changes noticeably, so it costs nothing per frame. Then lamp glows, light pools on the pavement and the shop window glow are added with `globalCompositeOperation = 'lighter'`. The boy and cyclists get a canvas brightness filter.

## Interface with the game

`enter(from)`, `update(dt, input)`, `draw(ctx, view)`, `click(wx, wy)`, `hover(wx, wy)`, `interact()`, `width`, `boy`. The same interface is used by [the shop](shop.md).

## Known limits / next steps

- The painted windows stay lit by day; the daylight grade only cools the golden light. Painted daytime versions of the far and walk layers would look more natural still.
- The scene is one screen-and-a-half wide: there's only one place to go (the shop).
