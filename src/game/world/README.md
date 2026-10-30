# World

**Owners:** Amber, Antonio (front end)

The walkable scenes' shared building blocks:

- a base for side-scrolling scenes: parallax layers (`sky`, `far`, `walk`, `foreground` from `public/art/`), camera, walking line;
- the player puppet (parts from `public/art/characters/`);
- clickable hotspots (door, piano, cabinet, …) with hover highlight and click-to-walk.

Scene layouts (which layers, where each hotspot is) should be data, not code, so new art can be swapped in without touching logic.
