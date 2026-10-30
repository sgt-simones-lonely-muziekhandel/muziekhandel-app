# Data layer

**Owners:** Rei, Teo (backend)

Knows about Muziekschatten, RDF and SPARQL. Knows nothing about Phaser. The game only ever sees the plain TypeScript types from `model.ts`.

Planned files:

- `model.ts`: `Work`, `Person`, `Place`, … Each keeps its IRI and `sameAs` links.
- `DataSource.ts`: the interface the game calls, e.g. `getWork(id)`, `getPerson(id)`, `worksBy(personId)`, `relatedPeople(personId)`.
- `StaticSource.ts`: reads the cached JSON in `public/data/`. This is what the game uses normally.
- `SparqlSource.ts`: queries the live endpoint (optional, for showing off).

The interface in `DataSource.ts` is the contract between back end and front end. Agree on it together before building on either side.
