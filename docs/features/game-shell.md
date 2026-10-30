# Game shell, input and overlays

The parts that hold everything together: the page, the title screen, the game loop, scene switching, input and the overlay windows.

## For the player

- **Title screen**: a swinging brass shop sign (*Muziekhandel Simone — sinds 1892*) over the dimmed empty shop room (`public/art/shop/back-wall.webp`), a big **▶ Start** button, and the controls in one line.
- **HUD**: only the **?** help button top-right and the piano-loading chip. There is no place name: the pictures show where you are (the place name is only the browser tab title, `setPlace()`).
- **Scene changes** fade to black and back.
- **Windows** (piano, cabinet, …) open on aged paper over a dimmed shop. Every window has **◀ Terug** (back one step) and **✕** (straight back to the shop); **Esc** and **Backspace** also go back.
- **Back in the scenes**: with no window open, **Backspace** or **Esc** go one place back (listening corner → shop → street), and so does the browser's back button / a keyboard's back key (`game.back()`, with a `history` entry the game keeps refilling).
- **Tips** from the shopkeeper (the medallion bottom-left, which stays still) close again with any key or any click outside *Voorlezen*. The tip is typed out while the medallion's face talks (see [shopkeeper](shopkeeper.md)).
- **No focus rectangles**: buttons and books no longer get a gold outline when selected; keyboard focus shows as a slightly brighter button, and the game canvas never shows a focus outline.
- On a phone held upright, a hint asks to turn the screen.

## How it's built

### Page — `index.html`, `css/style.css`

- One full-screen `<canvas>` for the scenes, plus HTML layers for the HUD, overlays, fade and title screen.
- Fonts from Google Fonts: Cinzel Decorative (titles, signs), EB Garamond (headings), Nunito Sans (body text), Caveat (handwritten labels), Noto Music (music symbols).
- **Paper**: `.paper` cards get stains and a vignette, and an SVG `feTurbulence` filter (`#rough`) makes their edges look torn. A noise texture over the whole game gives the paper grain.
- **Buttons** are `.btn.wood` or `.btn.brass`, text only (no emoji; only ‹ › arrows on Terug / Vorige / Volgende), at least 46 px high for small fingers.
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
- **Full screen**: with `full: true` as well (cabinet, portrait wall, [piano](piano.md)), there is no panel: the close-up fills the screen as large as it fits, the leftover edges show a dark blurred copy of it, and only small *Terug* / ✕ buttons sit on top (the view's name is kept for screen readers only). Without a `closeup` picture, `full: true` gives the same stage as a wooden desk drawn in CSS (`.stage.desk`), used by the [sheet music book](sheet-music.md). `ui.open(name, { noFade: true })` fades a full-screen view in over the current one instead of through black (the view below is hidden once it's covered). Opening and closing such a view uses the same fade to black as a scene change (`UI.withFade()` → `game.fade()`), and the picture settles from a slight zoom, so it feels like the camera moved closer rather than a window opening. A paper card opened on top (e.g. a composer) keeps the close-up visible, dimmed, behind it.
- The stack itself changes at once (`open`, `close`, `closeAll`, `replace`), so keys and clicks always go to the right view; only what's on screen waits for the fade.
- Helpers: `h()` (HTML string → element), `esc()` (escape text), `speak()` (Dutch read-aloud).

### Test URL parameters

`?autostart`, `&scene=shop` / `&scene=corner`, `&open=<view>`, `&piece=<id>`, `&composer=<id>`, `&greet`, `?uur=<hour>`. See the [root README](../../README.md).

## Known limits / next steps

- No saved progress (stars, visited objects). `localStorage` would be enough for one device.
- No sound effects (door bell, footsteps, page turn).
- Keyboard focus inside windows works with Tab, but there is no full screen-reader pass yet.
