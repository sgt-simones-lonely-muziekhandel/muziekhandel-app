# Changelog

Newest first. Each entry links to the feature document it touches.

## 2026-10-31 — Two sheet-music cabinets, a gramophone chest that glides

Added:

- [Sheet music](sheet-music.md): a second cabinet, *Muziek van de componisten*, beside *Liedjes uit de SOM-collectie*: 20 pieces in all. Brass arrows, ← / → or a swipe switch between them with a short sideways slide; a sign names the cabinet.

Changed:

- [Gramophone](gramophone.md): no scrollbar; only the chest of cylinders scrolls, gliding with the wheel, draggable with the mouse, fading at the edges.

## 2026-10-31 — Learning a song on the piano, composers back on the wall, a better close button

Added:

- [Piano](piano.md): learning a song step by step. *Speel mee* shows the next note too, the accompaniment answers each right note, and a wrong key twice gives a hint (higher / lower, which key). New **In de maat**: a count-in, then the accompaniment in time while the player plays the melody, every note judged on time, early, late or missed. **Oefenen**: tempo 50–100%, practise four bars at a time (or the whole piece), repeat, accompaniment, metronome. The result card gives stars, details, a tip and the next step; stars are kept per piece and stretch.
- [Audio](audio.md): `playPiece()` plays a stretch, counts in, ticks a metronome and can leave the melody to the player; the lights follow what is heard (the audio clock minus the speakers' latency) instead of running 0.1 s early.

Changed:

- [Piano](piano.md): the *MIDI* and *C D E* buttons are gone. The empty music desk asks *Wat wil je doen?*: *Een liedje leren* (choose sheet music) or *Gewoon spelen*. The instrument plaque reads *Instrument · Piano ▾*, without flashing (not when it first appears, nor while an instrument loads).
- [Composers](composers.md): the shop wall keeps the team's paintings; the wall close-up shows the six composers again, with their name plaques, biographies and music, all with the standard silhouette (we have no portraits of them). The *De makers van dit spel* card is gone.
- [Shopkeeper](shopkeeper.md): the ✕ is a round brass button on the paper's corner instead of a small cross on the speech bubble.

## 2026-10-31 — Painted sun, real moon phases, a few stars

Changed:

- [Sky](sky.md): the street's sky uses the painted art in `public/art/sky/`: the sun (warmer near the horizon), the moon in today's real phase with its glow (mirrored while waning), and about two dozen twinkling stars that come out one by one, only a few in the evening. `?maan=` fakes the phase.

## 2026-10-31 — Only the gramophone opens the music

Changed:

- [Listening corner](listening-corner.md): the chest of cylinders is no longer clickable; only the gramophone opens the music.

## 2026-10-31 — Sheet music: only the original, pages that bend

Changed:

- [Sheet music](sheet-music.md) / [real sheet music](som-scores.md): the book of a real song holds only the original scan pages, with no drawn cover, endpaper or caption; the first page (printed cover, or the album's cover) lies on top.
- [Sheet music](sheet-music.md): the pages bend like paper while they turn, with moving light, a shadow on the page underneath and a soft rustle ([audio](audio.md) `rustle()`). They can be dragged with the mouse or a finger, and a corner lifts when pointed at.

## 2026-10-31 — Help button only in the shop

Changed:

- [Game shell](game-shell.md): the **?** help button is only shown while the boy is inside the shop (and its listening corner); on the streets and in the films it is hidden.
- [Shop](shop.md): the four paintings above the piano hang closer together, around the hanging lamp.

## 2026-10-31 — The team on the portrait wall

Changed:

- [Portrait wall](composers.md): the shop wall and the gallery close-up show the four makers of the game (`portraits/team-1` … `team-4`) instead of the six composers, without composer names; clicking a painting opens *De makers van dit spel* with all four. Meneer Simone explains who they are. Name plaques appear once names are filled in in `TEAM` (`js/data.js`). The composer cards stay in the code but are no longer reachable from the shop.

## 2026-10-31 — A silhouette for composers without a portrait

Added:

- [Composers](composers.md): a composer without a portrait, or whose portrait won't load, gets a silhouette in a wig (`portraits/unknown`) on the shop wall, the wall close-up and the composer card.

## 2026-10-31 — The gramophone on its cabinet

Changed:

- [Listening corner](listening-corner.md): the gramophone is drawn whole, cabinet and all, standing on the floor between the chest and the armchair (the room's picture no longer has the round table it used to stand on).

## 2026-10-31 — More instruments on the piano

Added:

- [Piano](piano.md) / [audio](audio.md): an instrument plaque next to the pedal opens a choice of 21 instruments by family (orgel, harmonium, viool, cello, contrabas, harp, gitaren, fluit, klarinet, fagot, saxofoon, trompet, hoorn, trombone, tuba, xylofoon…) from the tonejs-instruments sample library (CC BY 3.0). Keys, *Luister* and *Speel mee* play on the chosen instrument; leaving the piano goes back to the piano sound.

## 2026-10-31 — Cascades in the intro, a smaller cylinder in the gramophone

Changed:

- [Prologue](prologue.md): a cascade of music notes and golden sparks streams across the screen with every wipe, in its direction; the captions' words come in one by one from left to right.
- [Gramophone](gramophone.md): the chosen cylinder in the showcase is smaller, with room around it and its label in view.

## 2026-10-31 — Notenles, the piano on its new picture, sliding intro, Overslaan

Added:

- [De notenles](lessons.md): music theory for complete beginners in nine short chapters (high and low, the seven names, black and white keys, the staff, note lengths, rests, sharps and flats, bars and counting, a first tune), each with something to try. From the piano (*Notenles*) and from Meneer Simone.
- [Prologue](prologue.md) / [game shell](game-shell.md): **Overslaan** replaces the help button during the films and skips them (Esc too).

Changed:

- [Piano](piano.md): placed on the new close-up picture: the keys fit the key slot under the red felt, the controls sit on the board under the keys. The buttons are redrawn as small screwed-on plaques (ebony and brass) in proportion to the picture.
- [Prologue](prologue.md): the shots slide into each other behind a seam of golden light with the time-travel swirl, from the right and then from the left, instead of dissolving.
- [Game shell](game-shell.md): the title screen is set in Playfair Display.

## 2026-10-31 — The whole SOM collection in the shop

Added:

- [Real sheet music](som-scores.md): the ten tunes of the *Album voor Mandoline en Viool* (one page each, melody only), so the cabinet holds the 15 songs of our SOM collection, five per shelf. The import works out each song's difficulty from its melody and ranks them into ★ / ★★ / ★★★.
- [Real sheet music](som-scores.md) / [sheet music](sheet-music.md): songs without a printed cover get a drawn one (`js/ui/cover.js`, inline SVG): title, makers' names, an instrument, no portrait. An album tune's book starts with the album's own cover.

Changed:

- [Content data](content-data.md): `PIECES` is the SOM songs; the composers' hand-written pieces are only on their cards in the [portrait gallery](composers.md). `scans.pages` is a list of page numbers, so the album's tunes share one scan folder.
- [Real sheet music](som-scores.md): the period and the rights are settled (we have an agreement with SOM), so those caveats are gone.

## 2026-10-31 — Real songs: every key lights up, scan-only books, back to the book, pipeline in the repo

Changed:

- [Piano](piano.md) / [audio](audio.md): in *Luister* every key lights up while it sounds, the accompaniment too (softer), so what you see is what you hear. `playPiece()` has an `onKey` callback.
- [Sheet music](sheet-music.md) / [real sheet music](som-scores.md): the book of a real song is only the original scan; its coloured notes are on the piano.
- [Sheet music](sheet-music.md) / [piano](piano.md): *Speel op de piano* opens the piano over the book, so *Terug* comes back to the same page, and the piano has a *Bladmuziek* button to see the book again.

Added:

- [Real sheet music](som-scores.md): the sheet2midi pipeline (`convert.py`, `merge.py`) and its validated scores are in `tools/sheet2midi/`; the scans and raw output stay out of git. `convert.py` finds Audiveris on Windows, macOS and Linux. `import_scores.py` reads from there by default.

## 2026-10-31 — Real sheet music from the SOM collection

Added:

- [Real sheet music](som-scores.md): five real songs from the SOM collection, imported from the hand-checked scores of sheet2midi by the new `scripts/import_scores.py`. They stand in the cabinet with their printed covers; the book has the vocal melody in coloured notes and then the pages of the original scan; the piano teaches the melody; *Luister* and the gramophone play it with the real piano accompaniment.

Changed:

- [Content data](content-data.md) / [sheet music](sheet-music.md): the note format has triplets (`ht qt 8t 16t`), `16.`, `32` and ties (`~`); the engraver draws a 3 over triplets and tie arcs. Pieces can have makers without a composer card (`credit`), an accompaniment and scan pages.
- [Audio](audio.md): `playPiece()` plays a tied chain as one note and plays an accompaniment under the melody.

## 2026-10-31 — Piano: the sheet plays along, buttons inside the picture

Changed:

- [Piano](piano.md): in free play with a piece loaded, the sheet now follows what is played: the next note of the piece turns green when played and the sheet moves on; any other key makes its note glow on the page. The lit note in *Luister* and *Speel mee* is stronger (coloured head, band and bigger name circle).
- [Piano](piano.md): the button bar, octave buttons, status line and pedal were re-measured on the picture and now sit fully on the wooden ledge and the strip under the keys, inside the carved sides.

## 2026-10-31 — Light from inside the tube

Fixed:

- [Story](story.md): when the lid comes off, the light now pours out of the inside of the tube (the opening glows and the rays rise out of it) instead of shining from behind the tube.

## 2026-10-31 — Slower films that wait for a click

Changed:

- [Prologue](prologue.md) and [story](story.md): slower, for five-year-olds. Each caption now waits until the player clicks or taps (a pulsing ▶ appears on it after a moment), and the next thing (the crate opening, the lid popping, the swirl, the sea rising) only happens after the click. The picture keeps moving gently while it waits. Keys no longer skip, and clicking without a caption does nothing. Dissolves between shots are slower too.

## 2026-10-31 — Prologue: Amsterdam today, the sea rising, the year 2126

Added:

- [Prologue](prologue.md): the game now opens with a short film before the [future street](future-street.md): Amsterdam today, an old map of the Netherlands where the sea creeps in while the year counts from 2026 to 2126, and the flooded street in smoky air with the boy appearing on the quay. It tells kids where and when they are and why the city is flooded, calm and never scary.

Changed:

- [Story](story.md): the shared parts (timeline, dissolves, captions, rain, dust) moved to `js/film.js`, used by the story and the prologue. Captions are centred on the paper and wrap onto more lines when long.
- [Game shell](game-shell.md): the first scene is `prologue`; `?autostart&scene=future` skips it.

## 2026-10-31 — Gramophone without floating notes

Changed:

- [Gramophone](gramophone.md): no more music notes floating up from the cylinder while it plays.

## 2026-10-30 — Gramophone showcase

Changed:

- [Gramophone](gramophone.md): the picture of the room on the left is replaced by a dark showcase with a warm spotlight; the chosen cylinder stands big in the centre of it, opened, with its lid beside it and its label underneath. The light breathes while the music plays.

## 2026-10-30 — Gramophone: no title, labels under the cylinders, lids that pop off

Changed:

- [Gramophone](gramophone.md): the hard-to-read *De grammofoon* title is gone (only *Terug* and ✕ remain). The title and composer tags now sit under each cylinder instead of over it. Choosing a cylinder animates its box: it jumps, the lid (`<colour>-lid`) flies off and lands next to it, and the box shows the wax cylinder inside (`<colour>-open`); choosing another one or stopping puts the lid back on.
- [Game shell](game-shell.md): `frame()` has a `hideTitle` option.

## 2026-10-30 — Story: hands in the corner, the boy on the quay, a soft ending

Changed:

- [Story](story.md): the hands with the tube come in from the bottom-left corner instead of the middle, so the sleeves run off the edges. In the time travel the boy stands on the quay (pinned to the painting) instead of floating over the canal. The shot of the boy walking to the shop is gone: after the swirl the camera drifts towards the sunset and the picture dissolves slowly into the [street](street.md). Captions moved to the bottom right.
- [Game shell](game-shell.md): `game.goTo(name, { dissolve: seconds })` cross-fades into the next scene instead of fading through black.

## 2026-10-30 — The time-travel story

Added:

- [Story](story.md): after opening the crate, a short anime-like film of four painted shots that drift, zoom and dissolve into each other: the crate opening in a golden flash, the hands opening a cylinder tube with light, notes and sheet music pouring out, a swirl of light sweeping the flooded street into the past, and the boy walking up to the shop. Captions on paper strips; a click skips to the next shot. Then the game continues on the [street](street.md).

Changed:

- [Future street](future-street.md): opening the crate now plays the story instead of going straight to the street.

## 2026-10-30 — The game starts in the future

Added:

- [Future street](future-street.md): the game now starts on the flooded, ruined quay in the future, with the boy in his gas mask. Rain, distant lightning, rippling flood water. The shop can't be reached; instead a glowing crate stands on the quay, and opening it leads to the past (for now straight to the [street](street.md); the story in between comes later).

Changed:

- [Player](player.md): `new Boy(x, kit)` takes the character folder (`'kid-past'` by default, `'kid-future'` for the future); both share the same joints.
- [Game shell](game-shell.md): the first scene is `future`; `?autostart&scene=street` starts in the past.
## 2026-10-30 — Smaller portraits in the shop, composer card without family tree

Changed:

- [Shop](shop.md): the six composer portraits above the piano are about a quarter smaller and sit on the green wall between the pillars, no longer running into the pillars or the ceiling beam.
- [Composers](composers.md): the composer card no longer shows the family tree. It has the portrait, the biography and, under it, *Muziek van …*: the composer's pieces, each with *Luister* (gramophone) and *Bladmuziek* (sheet-music book).
- [Shopkeeper](shopkeeper.md): his answer about the portraits now mentions the story and the music instead of the family.

## 2026-10-30 — Muziekhandel Simone, bigger help dialog

Changed:

- The shop is now **Muziekhandel Simone** (page title, title screen sign, in-game texts) and the shopkeeper is **Meneer Simone**, matching the sign painted on the shop front ([shopkeeper](shopkeeper.md), [shop](shop.md), [game shell](game-shell.md), [street](street.md)).
- [Shopkeeper](shopkeeper.md): the dialog is bigger and every answer, including the keyboard guide, fits without scrolling on desktop and laptop screens.

## 2026-10-30 — Talking shopkeeper, new help dialog, natural lady cyclist, gramophone room by the clock

Changed:

- [Shopkeeper](shopkeeper.md): his face (`head.webp` / `head-talk.webp` / `head-blink.webp`) talks while his words appear, in the dialog and in the tip medallions, and while *Voorlezen* reads aloud; he blinks now and then. The dialog is redesigned: speech bubble next to his portrait, questions written on the paper like notebook lines instead of white buttons, no scrollbar (long answers scroll inside the bubble with a fade).
- [Cyclists](cyclists.md): the lady is cut in one piece out of her finished drawing, sitting on a bicycle lined up on its hubs; only her boots pedal under the skirt, so she looks like one natural drawing.
- [Gramophone](gramophone.md) and [listening corner](listening-corner.md): the room in the gramophone view is drawn by the same code as the scene, so the window and lamps follow the clock there too; the cylinder stands beside the phonograph. The new cylinder phonograph is drawn down to its base instead of being cut off.
- [Shop](shop.md), [listening corner](listening-corner.md), [game shell](game-shell.md): no more lit-up rectangles around hovered or selected objects and buttons.

## 2026-10-30 — Going through the shop door, keeper dialogue higher

Changed:

- [Street](street.md): going into the shop is a little scene now: the door swings open, warm light falls out, the boy steps over the threshold into the light and the door closes behind him (and the other way round coming out).
- [Shopkeeper](shopkeeper.md): the dialogue with the questions sits higher on the screen instead of at the bottom edge; the tip medallion bottom-left no longer bobs up and down.

## 2026-10-30 — Sheet music as a book, dimmer shop lights

Changed:

- [Sheet music](sheet-music.md): the music is a real book on a wooden desk, full screen. The chosen book flies from the cabinet to the middle of the screen and lies there closed; the player opens it and turns the pages from right to left around the spine with a smooth 3D page turn (→ ← keys, the brass buttons or a click on a page): cover, title page (`cover-inside.webp`), then the music two pages at a time, 4 lines of 2 bars per page with bigger notes.
- [Shop](shop.md): the evening lamps are softer than before, but not dark (a middle setting).
- [Piano](piano.md): the buttons, octave buttons, status line and pedal are sized only in `cqw`, so they stay inside the piano picture on small screens instead of sticking out over the background.
- [Game shell](game-shell.md): `frame({ full: true })` without a close-up picture gives a full-screen wooden desk; `ui.open(…, { noFade: true })` opens a full-screen view without the fade to black.

## 2026-10-30 — Louder piano, light-up keys, cyclist puppets, sheet-music books

Changed:

- [Audio](audio.md): the piano is louder (+8 dB), with a limiter so loud chords don't clip.
- [Piano](piano.md): plain keys without shadows or labels; a key only lights up (with a beam of light and a floating ♪) while it sounds or is the next one to play, together with the note on the sheet. Buttons without emoji, a little bigger.
- [Game shell](game-shell.md): no emoji on any button; no place names top-left (plaque and close-up titles removed).
- [Sheet music](sheet-music.md): the cabinet holds sheet-music books (`items/sheet-music/cover-1…6`) with the title and composer printed on the cover, and stars on the plaques. Opening one swings its cover open onto the title page (`cover-inside.webp`, only the title and composer change). Covers and title page use Playfair Display.
- [Gramophone](gramophone.md): the picture is the listening corner with the chosen cylinder standing big in it, with its label.
- [Cyclists](cyclists.md): the hand-drawn cyclists are replaced by cut-out puppets of the gentleman and the lady (`characters/cyclist-man`, `cyclist-woman`), with turning wheels and crank and legs that follow the pedals.

Added:

- [Piano](piano.md): in the evening the candles flicker with a faint glow and the room around the piano darkens a little.
- [Listening corner](listening-corner.md): follows the real time of day: night sky in the window, darker room, glowing lamps.
- [Game shell](game-shell.md): Backspace / Esc / the browser's back button go one place back; shopkeeper tips close with any key or click.

## 2026-10-30 — Full-screen close-ups, furniture against the wall

Changed:

- [Piano](piano.md): full screen on the piano close-up (`closeups/piano.webp`): music on the music desk, keys in the key slot, buttons on the wood. No window frame.
- [Composers](composers.md) and [sheet music cabinet](sheet-music.md): the close-ups fill the screen too. Opening and closing them fades to black like a scene change ([game shell](game-shell.md)).
- [Shop](shop.md): the piano and the cabinet stand against the back wall, with a soft shadow on the wall.

## 2026-10-30 — Shop sizes and evening lights

Changed:

- [Shop](shop.md): bigger piano, cabinet and shopkeeper; the counter is narrower (its middle panel is cut out) but keeps its height, with the desk top just below the window.

Added:

- [Shop](shop.md): in the evening (real time) the room darkens and the three hanging lamps light up, with soft cones of light, a glow on the wall and pools on the floor.

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
