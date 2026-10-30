# Game shell, input and overlays

The parts that hold everything together: the page, the title screen, the game loop, scene switching, input and the overlay windows.

## For the player

- **Title screen**: a swinging brass shop sign (*Muziekhandel Van der Velde — sinds 1892*) over the dimmed empty shop room (`public/art/shop/back-wall.webp`), a big **▶ Start** button, and the controls in one line.
- **HUD**: a brass plaque top-left with the current place, the **?** help button top-right, and the piano-loading chip.
- **Scene changes** fade to black and back.
- **Windows** (piano, cabinet, …) open on aged paper over a dimmed shop. Every window has **◀ Terug** (back one step) and **✕** (straight back to the shop); **Esc** also goes back.
- On a phone held upright, a hint asks to turn the screen.

## How it's built

### Page — `index.html`, `css/style.css`

- One full-screen `<canvas>` for the scenes, plus HTML layers for the HUD, overlays, fade and title screen.
- Fonts from Google Fonts: Cinzel Decorative (titles, signs), EB Garamond (headings), Nunito Sans (body text), Caveat (handwritten labels), Noto Music (music symbols).
- **Paper**: `.paper` cards get stains and a vignette, and an SVG `feTurbulence` filter (`#rough`) makes their edges look torn. A noise texture over the whole game gives the paper grain.
- **Buttons** are `.btn.wood` or `.btn.brass`, always icon + text, at least 46 px high for small fingers.
- Colours are CSS variables taken from the design guide palette.

### Game loop — `js/main.js`

- `Game` owns the canvas, the scenes (`street`, `shop`, `corner`), the camera and the input state.
- **Scaling**: scenes are 720 virtual pixels high and scaled to the window height; the width you see depends on the screen. A scene with `fitWidth` (the shop, the listening corner) is scaled to fit its full width instead when that leaves only small bars. Rendering uses the device pixel ratio (max 2) for sharp lines.
- **Camera** follows the boy and stops at the scene edges.
- `goTo(name)` fades out, swaps the scene, refits the canvas and calls `scene.enter(from)` with the name of the scene the player came from (the shop uses it to put the boy at the right edge when he comes back from the corner).
- **Input**: ← → / A D walk; ↑ / Enter / E / W / Space use the nearest object; pointer clicks walk or use; pointer hover changes the cursor. When a window is open, keys go to that window instead.
- `idleTime` counts seconds without input (used by the [cyclists](cyclists.md)).

### Overlays — `js/ui/ui.js`

- `UI` keeps a **stack of views**. `open(name, opts)` pushes a view and hides the one below; `close()` pops it and shows the previous one; `replace()` swaps the top view (sheet → piano); `closeAll()` returns to the shop.
- A view is `{ el, onKey, onKeyUp, onShow, onHide, destroy }`. `frame()` builds the standard paper panel with back/close buttons and the shopkeeper tip.
- **Close-ups**: `frame(ui, { closeup: 'public/art/closeups/….webp' })` gives a dark wooden panel around that picture instead of paper, and returns a `stage`: a box with the picture's proportions (1672 × 941), as big as fits the window. Things on it are placed in percentages of the picture and sized in `cqw` (the stage is a size container), so they stay on the right spot at any size. Used by the [cabinet](sheet-music.md) and the [portrait wall](composers.md).
- Helpers: `h()` (HTML string → element), `esc()` (escape text), `speak()` (Dutch read-aloud).

### Test URL parameters

`?autostart`, `&scene=shop` / `&scene=corner`, `&open=<view>`, `&piece=<id>`, `&composer=<id>`, `&greet`, `?uur=<hour>`. See the [root README](../../README.md).

## Known limits / next steps

- No saved progress (stars, visited objects). `localStorage` would be enough for one device.
- No sound effects (door bell, footsteps, page turn).
- Keyboard focus inside windows works with Tab, but there is no full screen-reader pass yet.
