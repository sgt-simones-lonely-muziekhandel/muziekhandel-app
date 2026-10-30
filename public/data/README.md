# Cached data

**Owners:** Rei, Teo (backend)

JSON exported from Muziekschatten ahead of time by `scripts/fetch-data` (to be written). The game reads these files instead of calling SPARQL live, so the demo works even without internet or when the endpoint is slow.

Use the same shape as the composers and pieces in `js/data.js` (see [`docs/features/content-data.md`](../../docs/features/content-data.md)), so the game can load them in place of the demo set. Extra fields, such as the Muziekschatten IRI of each work and person, are welcome; agree on them with the front end.
