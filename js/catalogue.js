// The shop's sheet music and its composers, from the Muziekschatten data: the game's back end
// (backend/server.py) asks Virtuoso and answers a cabinet or a wall at a time. Everything that came
// in is remembered, so pieceById() (js/data.js) knows a piece once its cabinet has been seen.
// A piece has no notes yet (`notes: null`): those follow later.
const API = 'api/';
const pieces = new Map(), composers = new Map(), asked = new Map();

// The same question is asked only once (a failed one may be asked again).
function get(path) {
  if (!asked.has(path)) {
    asked.set(path, fetch(API + path).then(r => {
      if (!r.ok) throw new Error(`${path}: ${r.status}`);
      return r.json();
    }).catch(e => { asked.delete(path); throw e; }));
  }
  return asked.get(path);
}

// A piece as js/data.js describes one: `composer` is its first composer's id and `maker` that
// composer, for labels (creditFor); `credit` names all of them.
function toPiece(p) {
  const first = p.composers[0];
  const piece = {
    ...pieces.get(p.id),
    ...p,
    composer: first?.id ?? null,
    maker: first ? { ...first, years: composers.get(first.id)?.years || '' } : null,
    credit: p.composers.map(c => c.name).join(', ') || 'Onbekende maker',
    creditShort: first?.short || '',
  };
  pieces.set(piece.id, piece);
  return piece;
}

export const cachedPiece = id => pieces.get(id);
export const cachedComposer = id => composers.get(id);

// One cabinet: { page, pages, total, pieces }
export const piecePage = page => get(`pieces?page=${page}`).then(d => ({ ...d, pieces: d.pieces.map(toPiece) }));
export const loadPiece = id => get(`pieces/${encodeURIComponent(id)}`).then(toPiece);

// One wall: { page, pages, total, composers }
export const composerPage = page => get(`composers?page=${page}`);
// A composer with their pieces; no story yet (`bio`), that comes from Wikidata later.
export const loadComposer = id => get(`composers/${encodeURIComponent(id)}`).then(c => {
  const composer = { ...c, title: '', bio: '', fact: '', pieces: c.pieces.map(toPiece) };
  composers.set(id, composer);
  return composer;
});
