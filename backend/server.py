"""The game's back end: a small JSON API over the Muziekschatten data in Virtuoso.

    python3 backend/server.py                                   # http://localhost:8765
    python3 backend/server.py --port 9000 --sparql http://localhost:8890/sparql

The browser never talks to Virtuoso: this server asks it with SPARQL and hands the game composers
and pieces, a cabinet or a wall at a time. It also serves the game's files (--root, default this
checkout), so one command runs everything; on the server nginx serves the files and passes /api/
on to it. Python's standard library only. See docs/features/backend.md.

    GET /api/pieces?page=N       one cabinet: 15 pieces with a printed cover, by title
    GET /api/pieces/<id>         one piece, with all its makers
    GET /api/composers?page=N    one wall: 6 composers, most pieces in the shop first
    GET /api/composers/<id>      one composer, with their pieces in the shop
"""

import argparse
import json
import re
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GRAPH = "http://data.muziekschatten.nl/somlod/"
BASE = "https://data.muziekschatten.nl/som/"
PREFIXES = "PREFIX s: <http://schema.org/>\n"
PIECES_PER_PAGE = 15     # a cabinet: three shelves of five
COMPOSERS_PER_PAGE = 6   # a wall: two rows of three frames
CACHE_SECONDS = 300      # the data hardly changes; Virtuoso is asked again after this
ID = re.compile(r"[A-Za-z0-9]{1,64}")

# A piece in the shop: a composition with a title and a scanned cover (974 of the 2192).
IN_SHOP = "?w a s:MusicComposition ; s:name ?t ; s:thumbnail ?th ."
# What a piece's page shows: these facts, and for links (people, places) their names.
PIECE_FACTS = ("name", "thumbnail", "composer", "lyricist", "editor", "publisher", "locationCreated",
               "datePublished", "dateIssued")
PARTICLES = {"van", "de", "der", "den", "ten", "ter", "te", "het", "'t", "von", "du", "la", "le", "di"}


class Virtuoso:
    """SELECT queries on one graph, the rows as dicts of strings, each answer kept for a while."""

    def __init__(self, endpoint, graph=GRAPH):
        self.endpoint, self.graph = endpoint, graph
        self.cache, self.lock = {}, threading.Lock()

    def select(self, query):
        query = PREFIXES + query
        with self.lock:
            hit = self.cache.get(query)
        if hit and time.monotonic() - hit[0] < CACHE_SECONDS:
            return hit[1]
        url = self.endpoint + "?" + urllib.parse.urlencode({"query": query, "default-graph-uri": self.graph})
        request = urllib.request.Request(url, headers={"Accept": "application/sparql-results+json"})
        with urllib.request.urlopen(request, timeout=30) as response:
            bindings = json.load(response)["results"]["bindings"]
        rows = [{k: v["value"] for k, v in b.items()} for b in bindings]
        with self.lock:
            self.cache[query] = (time.monotonic(), rows)
        return rows


def local_id(iri):
    """https://data.muziekschatten.nl/som/623636 -> 623636"""
    return iri.rsplit("/", 1)[-1]


def iris(ids):
    return " ".join(f"<{BASE}{i}>" for i in ids)


def title_case(words):
    """'JOOP DE' -> 'Joop de': capitals only where a name has them."""
    out = []
    for k, w in enumerate(words.split()):
        out.append(w.lower() if k and w.lower() in PARTICLES else "-".join(p.capitalize() for p in w.split("-")))
    return " ".join(out)


def person_name(raw):
    """A name as the catalogue writes it ('NOIRET, LOUIS', 'Leo Friedman', 'BOS, JO; RAYS, TOM')
    as a full name to read and a short one for plaques: ('Louis Noiret', 'Noiret')."""
    names, shorts = [], []
    for part in (p.strip() for p in raw.split(";")):
        if not part:
            continue
        if "," in part:
            last, first = (s.strip() for s in part.split(",", 1))
        else:
            first, _, last = part.rpartition(" ")
        if part.isupper():
            first, last = title_case(first), title_case(last)
        # 'LINDEN, DOLF VAN DER': the 'van der' belongs to the surname
        words = first.split()
        while words and words[-1].lower() in PARTICLES:
            last = f"{words.pop().lower()} {last}"
        first = " ".join(words)
        names.append(f"{first} {last}".strip())
        shorts.append(last[:1].upper() + last[1:])
    return " & ".join(names) or raw, " & ".join(shorts) or raw


def split_title(raw):
    """A catalogue title: the title itself, then '|a' a translated title, '|p' what kind of piece
    and '|n' names. Returns the title and a subtitle made of the translation and the kind."""
    parts = re.split(r"\s*\|([a-z])\s*", raw)
    extra = dict(zip(parts[1::2], (p.strip() for p in parts[2::2])))
    return parts[0].strip(" /:"), " · ".join(t for t in (extra.get("a"), extra.get("p")) if t)


def publisher_name(raw):
    """'Antwerpen : Schlager Editie' -> 'Schlager Editie, Antwerpen'"""
    place, _, name = raw.rpartition(" : ")
    return f"{name.strip()}, {place.strip()}" if place else raw


def year(text):
    """'cop. 1923' -> '1923'; '[19--?]' -> None"""
    match = re.search(r"\b(1[5-9]\d\d|20\d\d)\b", text or "")
    return match.group(1) if match else None


def page_number(query):
    try:
        return max(0, int(query.get("page", ["0"])[0]))
    except ValueError:
        return 0


def pages(total, size):
    return max(1, -(-total // size))


def pieces(db, ids):
    """The pieces with these ids, in this order, as the game shows them."""
    if not ids:
        return []
    rows = db.select(f"""
        SELECT ?w ?p ?o ?name WHERE {{
          VALUES ?w {{ {iris(ids)} }}
          VALUES ?p {{ {" ".join("s:" + f for f in PIECE_FACTS)} }}
          ?w ?p ?o . OPTIONAL {{ ?o s:name ?name }}
        }}""")
    facts = {}
    for r in rows:
        key = r["p"].rsplit("/", 1)[-1]
        value = {"id": local_id(r["o"]), "name": r["name"]} if "name" in r else r["o"]
        facts.setdefault(local_id(r["w"]), {}).setdefault(key, []).append(value)

    def people(f, key):
        out = []
        for p in sorted(f.get(key, []), key=lambda p: p["name"] if isinstance(p, dict) else p):
            if isinstance(p, dict):
                name, short = person_name(p["name"])
                out.append({"id": p["id"], "name": name, "short": short})
        return out

    result = []
    for i in ids:
        f = facts.get(i, {})
        title, subtitle = split_title(min(f.get("name", [""])))
        names = lambda key: [p["name"] for p in f.get(key, []) if isinstance(p, dict)]
        result.append({
            "id": i,
            "iri": BASE + i,
            "title": title,
            "subtitle": subtitle,
            "cover": min(f.get("thumbnail", [None]), key=str),
            "year": next((y for y in map(year, f.get("datePublished", []) + f.get("dateIssued", [])) if y), None),
            "composers": people(f, "composer"),
            "lyricists": people(f, "lyricist"),
            "arrangers": people(f, "editor"),
            "publisher": next(map(publisher_name, sorted(names("publisher"))), None),
            "place": min(names("locationCreated"), default=None),
            "notes": None,  # the note data follows later
        })
    return result


def pieces_page(db, page):
    total = int(db.select(f"SELECT (COUNT(DISTINCT ?w) AS ?n) WHERE {{ {IN_SHOP} }}")[0]["n"])
    if page >= pages(total, PIECES_PER_PAGE):  # past the last cabinet (and Virtuoso won't sort that far)
        return {"page": page, "pages": pages(total, PIECES_PER_PAGE), "total": total, "pieces": []}
    rows = db.select(f"""
        SELECT ?w WHERE {{
          {{ SELECT ?w (MIN(STR(?t)) AS ?title) WHERE {{ {IN_SHOP} }} GROUP BY ?w }}
        }} ORDER BY LCASE(?title) ?w LIMIT {PIECES_PER_PAGE} OFFSET {page * PIECES_PER_PAGE}""")
    return {"page": page, "pages": pages(total, PIECES_PER_PAGE), "total": total,
            "pieces": pieces(db, [local_id(r["w"]) for r in rows])}


def piece(db, i):
    found = pieces(db, [i])
    return found[0] if found[0]["title"] else None


def composers(db, ids, counts=None):
    """The composers with these ids, in this order."""
    if not ids:
        return []
    rows = db.select(f"""
        SELECT ?c ?name ?born ?died WHERE {{
          VALUES ?c {{ {iris(ids)} }}
          ?c s:name ?name . OPTIONAL {{ ?c s:birthDate ?born }} OPTIONAL {{ ?c s:deathDate ?died }}
        }}""")
    found = {}
    for r in rows:
        c = found.setdefault(local_id(r["c"]), {"names": set(), "born": set(), "died": set()})
        c["names"].add(r["name"])
        for k in ("born", "died"):
            if year(r.get(k)):
                c[k].add(year(r[k]))
    result = []
    for i in ids:
        c = found.get(i)
        if not c:
            continue
        name, short = person_name(min(c["names"]))
        born, died = min(c["born"], default=None), min(c["died"], default=None)
        result.append({
            "id": i, "iri": BASE + i, "name": name, "short": short,
            "born": born, "died": died,
            "years": f"{born or '?'} – {died or ''}".strip() if born or died else "",
            "pieceCount": (counts or {}).get(i),
        })
    return result


def composers_page(db, page):
    total = int(db.select(f"SELECT (COUNT(DISTINCT ?c) AS ?n) WHERE {{ {IN_SHOP} ?w s:composer ?c }}")[0]["n"])
    if page >= pages(total, COMPOSERS_PER_PAGE):
        return {"page": page, "pages": pages(total, COMPOSERS_PER_PAGE), "total": total, "composers": []}
    rows = db.select(f"""
        SELECT ?c (COUNT(DISTINCT ?w) AS ?n) WHERE {{ {IN_SHOP} ?w s:composer ?c }}
        GROUP BY ?c ORDER BY DESC(?n) ?c LIMIT {COMPOSERS_PER_PAGE} OFFSET {page * COMPOSERS_PER_PAGE}""")
    counts = {local_id(r["c"]): int(r["n"]) for r in rows}
    return {"page": page, "pages": pages(total, COMPOSERS_PER_PAGE), "total": total,
            "composers": composers(db, list(counts), counts)}


def composer(db, i):
    rows = db.select(f"""
        SELECT ?w WHERE {{
          {{ SELECT ?w (MIN(STR(?t)) AS ?title) WHERE {{ {IN_SHOP} ?w s:composer <{BASE}{i}> }} GROUP BY ?w }}
        }} ORDER BY LCASE(?title) ?w""")
    ids = [local_id(r["w"]) for r in rows]
    found = composers(db, [i], {i: len(ids)})
    return {**found[0], "pieces": pieces(db, ids)} if found else None


ROUTES = [
    (re.compile(r"/api/pieces/?"), lambda db, query: pieces_page(db, page_number(query))),
    (re.compile(rf"/api/pieces/({ID.pattern})"), lambda db, query, i: piece(db, i)),
    (re.compile(r"/api/composers/?"), lambda db, query: composers_page(db, page_number(query))),
    (re.compile(rf"/api/composers/({ID.pattern})"), lambda db, query, i: composer(db, i)),
]


class Handler(SimpleHTTPRequestHandler):
    """The game's files, and /api/ answered from Virtuoso."""

    def __init__(self, *args, db, **kwargs):
        self.db = db
        super().__init__(*args, **kwargs)

    def do_GET(self):
        url = urllib.parse.urlsplit(self.path)
        if url.path.startswith("/api/"):
            self.api(url.path, urllib.parse.parse_qs(url.query))
        else:
            super().do_GET()

    def api(self, path, query):
        for pattern, answer in ROUTES:
            match = pattern.fullmatch(path)
            if match:
                try:
                    body = answer(self.db, query, *match.groups())
                except (urllib.error.URLError, TimeoutError, KeyError, ValueError) as e:
                    self.log_error("Virtuoso: %s", e)
                    return self.json(HTTPStatus.BAD_GATEWAY, {"error": "Virtuoso is not answering"})
                if body is None:
                    return self.json(HTTPStatus.NOT_FOUND, {"error": "not found"})
                return self.json(HTTPStatus.OK, body)
        self.json(HTTPStatus.NOT_FOUND, {"error": "no such API"})

    def json(self, status, body):
        data = json.dumps(body, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(data)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--sparql", default="http://localhost:8890/sparql", help="Virtuoso's SPARQL endpoint")
    parser.add_argument("--root", type=Path, default=ROOT, help="the game's files (default: this checkout)")
    args = parser.parse_args()
    db = Virtuoso(args.sparql)
    server = ThreadingHTTPServer((args.host, args.port), partial(Handler, db=db, directory=str(args.root)))
    print(f"Muziekhandel on http://{args.host}:{args.port} (data from {args.sparql})")
    server.serve_forever()


if __name__ == "__main__":
    main()
