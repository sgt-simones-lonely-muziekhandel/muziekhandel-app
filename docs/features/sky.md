# Real-time sky

The sky above the street matches the visitor's real local time: dawn, day, sunset, evening and night.

## For the player

- Morning: blue sky with a warm horizon, the sun rising on the left (it comes up from behind the houses).
- Day: bright blue, white clouds, the painted sun (`sky/sun`) high in the sky.
- Sunset: orange horizon, pink clouds; the sun is bigger and warmer near the horizon.
- Evening: only a few of the brightest stars come out, one by one.
- Night: dark blue, more stars (still only about two dozen, mostly small points, a few sparkling ones), twinkling by fading in and out; the moon in **today's real phase** (crescent, half, gibbous or full, lit on the right while it grows and on the left while it shrinks, none at new moon) with a soft glow; lit windows and street lamps.

## How it's built

`js/sky.js`.

- `KEYS` is a list of keyframes: `[hour, topColour, horizonColour, darkness]`. `skyAt(hour)` finds the two keyframes around the current hour and blends the colours and darkness linearly.
- `skyAt()` also returns where the sun (about 6:30–20:00) or the moon is along its arc (0 → 1), `lampsOn` (darkness above 0.3) and `phase`, the moon's phase from `moonPhase()` (0 new, 0.5 full: days since a known new moon, 6 January 2000, modulo the lunar month of 29.53 days).
- `currentHour()` reads the local clock (hours + minutes / 60). The street calls it every frame, so the sky changes on its own while the page is open.
- `skyAt()` also returns `painted` (0–1): how much of the painted sunset sky (`public/art/past-street/sky.webp`) to show as it is. It is 1 from about 18:30 to 20:20, fades in from 17:20 and out until 21:25, and reaches 0.8 at dawn (6:20–7:10).
- The street draws, in order (`Street.drawSky()`):
  1. the colour gradient for the hour, then the sky bodies (`Street.drawSkyBodies()`, art from `public/art/sky/`):
     - **stars**: 24, each with a picture (`star-1`/`star-2` small points, `star-3`…`star-6` sparkling, every sixth star), a size, and the darkness at which it comes out (`from`, 0.35–0.95), so the evening has only a few; they twinkle by fading and growing a little, drawn with `lighter`;
     - **sun** (`sun`, 170 units, `lighter`): bigger and tinted warmer (canvas `filter`) the lower it is;
     - **moon**: `moon-glow` (`lighter`, stronger the fuller the moon), then the phase picture chosen by the lit fraction `(1 − cos 2π·phase) / 2`: `moon-1` crescent, `moon-2` half, `moon-3` gibbous, `moon-4` full (none below 3%). The pictures are cut to the lit part, so their right edge is placed on the disc's right edge (58 units across); for a waning moon (`phase > 0.5`) it is mirrored;
  2. the painted sky blended in for its clouds only: `soft-light` at 80% by day (soft clouds in a blue sky) or `luminosity` at 30% at night (dark cloud shapes), weighted by `1 − painted`;
  3. the painted sky as it is, at opacity `painted`.
  The painting slides a little with the camera for depth.
- The street uses `dark` to darken the scene and decide which lights glow (see [street](street.md)).

## Testing

Add `?uur=` to the URL to fake the time, for example `index.html?uur=21.5` for 21:30 or `?uur=6.5` for sunrise, and `?maan=` for the moon's phase (`0.25` first quarter, `0.5` full, `0.8` a waning crescent).

## Known limits / next steps

- Sunrise and sunset are fixed times, not calculated for Middelburg's season. A small sun-position formula with the date could make them exact.
- The shop interior doesn't change with the time: its windows always show dusk.
