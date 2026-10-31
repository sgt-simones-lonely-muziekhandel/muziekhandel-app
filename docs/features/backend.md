# Back end: the Muziekschatten data from Virtuoso

The shop's sheet music and composers come from the Muziekschatten data in our Virtuoso instance. The browser never talks to Virtuoso: a small back end (`backend/server.py`) asks it with SPARQL and answers the game with JSON, a cabinet or a wall at a time.

## For the player

- The sheet-music cabinet holds the collection's sheet music, fifteen pieces to a cabinet; the arrows walk along the cabinets (*Kast 1 van 65*). Every book has its real scanned cover.
- The portrait wall holds the composers of that music, six to a wall, those with the most pieces first (*Muur 1 van 38*). A composer's card lists all their pieces in the shop.
- A book's title page names all the makers: composer, words, arrangement, publisher and year. The notes aren't there yet: the book ends with a page saying they're coming, and there's no *Speel op de piano* button.
- While something is looked up, Meneer Simone says so; if the back end or Virtuoso doesn't answer, he says that too, and the rest of the game keeps working.

## How it's built

- **Back end**: `backend/server.py`, Python's standard library only. It serves the game's files too (`--root`), so one command runs everything locally. Answers from Virtuoso are kept for 5 minutes.

  | Request | Answer |
  |---|---|
  | `GET /api/pieces?page=N` | `{ page, pages, total, pieces }`: one cabinet, 15 pieces by title |
  | `GET /api/pieces/<id>` | one piece |
  | `GET /api/composers?page=N` | `{ page, pages, total, composers }`: one wall, 6 composers, most pieces first |
  | `GET /api/composers/<id>` | one composer, with `pieces` |

  A piece: `{ id, iri, title, subtitle, cover, year, composers, lyricists, arrangers, publisher, place, notes: null }`; the people are `{ id, name, short }`. A composer: `{ id, iri, name, short, born, died, years, pieceCount }`. Ids are the last part of the Muziekschatten IRI (`https://data.muziekschatten.nl/som/510906` → `510906`). A page past the last one is empty; an unknown id is a 404; Virtuoso not answering is a 502.
- **Which data**: the `http://data.muziekschatten.nl/somlod/` graph (schema.org). A piece in the shop is a `schema:MusicComposition` with a `schema:name` and a `schema:thumbnail` (the scanned cover): 974 of the 2192 compositions. Its composers are its `schema:composer`s.
- **Tidying the catalogue**: names come as the catalogue writes them and are turned into reading order (`NOIRET, LOUIS` → *Louis Noiret*, short *Noiret*; `LINDEN, DOLF VAN DER` → *Dolf van der Linden*, *Van der Linden*). A title's catalogue codes are split off: `|a` (translated title) and `|p` (kind of piece) become the subtitle, `|n` (names) is dropped. A year is the first four-digit year in `datePublished` / `dateIssued` (`cop. 1923` → 1923, `[19--?]` → none).
- **Front end**: `js/catalogue.js` asks the back end (each question once) and turns its pieces into the shape of [`js/data.js`](content-data.md): `composer` is the first composer's id, `maker` that composer (for `creditFor()`), `credit` all their names. Everything that came in is remembered, so `pieceById()` finds a piece once its cabinet was seen. `js/ui/pager.js` walks along the cabinets and walls, filling each one when it's reached (and the next one straight away).
- **Locally**: `python3 backend/server.py` or `nix run`, with Virtuoso on `localhost:8890` (an SSH tunnel to the server: `ssh -N -L 8890:localhost:8890 root@hackalod.kernelmaft.com`). `--sparql` (or `SPARQL=` for `nix run`) points elsewhere.
- **On the server**: the flake's NixOS module runs the back end as the `muziekhandel-api` service on 127.0.0.1:8766 and nginx passes `/api/` to it. Virtuoso stays reachable from the server only.

## Known limits / next steps

- No notes yet: the pieces can be read, not played. The piano's own cabinet still holds the songs that have notes (`js/som-scores.js` and the composers' pieces in `js/data.js`). When note files come, the back end can add them to a piece as `notes` and the book, the piano and the gramophone will use them.
- No stories, portraits or dates for most composers: only 8 of the 223 have a birth year in the data. Stories are to come from Wikidata.
- The covers are small (212 × 312 px), a little soft in the open book.
- 65 cabinets are many to walk through with arrows: a search, or a choice of pieces, would help.
- The same title can stand in the cabinet several times: separate catalogue records (editions, arrangements) of one song.
- A composer written in two ways (`DAVIDS, LOUIS` and `Louis Davids`) is two composers.
