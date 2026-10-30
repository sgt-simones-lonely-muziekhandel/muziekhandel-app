# Real-time sky

The sky above the street matches the visitor's real local time: dawn, day, sunset, evening and night.

## For the player

- Morning: blue sky with a warm horizon, the sun rising on the left.
- Day: bright blue, white clouds.
- Sunset: orange horizon, pink clouds.
- Night: dark blue, twinkling stars, a crescent moon, lit windows and street lamps.

## How it's built

`js/sky.js`.

- `KEYS` is a list of keyframes: `[hour, topColour, horizonColour, darkness]`. `skyAt(hour)` finds the two keyframes around the current hour and blends the colours and darkness linearly.
- `skyAt()` also returns where the sun (about 6:30–20:00) or the moon is along its arc (0 → 1), and `lampsOn` (darkness above 0.3).
- `currentHour()` reads the local clock (hours + minutes / 60). The street calls it every frame, so the sky changes on its own while the page is open.
- The street uses `dark` to darken the scene and decide which lights glow (see [street](street.md)).

## Testing

Add `?uur=` to the URL to fake the time, for example `index.html?uur=21.5` for 21:30 or `?uur=6.5` for sunrise.

## Known limits / next steps

- Sunrise and sunset are fixed times, not calculated for Amsterdam's season. A small sun-position formula with the date could make them exact.
- The shop interior doesn't change with the time: its windows always show dusk.
