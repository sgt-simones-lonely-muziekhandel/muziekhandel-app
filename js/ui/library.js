// The sheet music cabinet, seen up close (public/art/closeups/cabinet): three shelves of five
// compartments, each with a brass plaque. Every piece stands in its own compartment as a printed
// sheet-music cover: its printed cover, a drawn one (js/ui/cover.js), or for a composer's piece one
// of the covers in public/art/items/sheet-music with its title and composer in the cartouche;
// the shelf says how hard it is (top ★, middle ★★, bottom ★★★), and so does the plaque. A piece
// from the Muziekschatten data has no level yet: those fill the shelves in order, without stars.
// Cylinders (public/art/items/cylinder) are still what the gramophone plays.
import { frame, h, esc } from './ui.js';
import { PIECES, ALL_PIECES, creditFor } from '../data.js';
import { piecePage } from '../catalogue.js';
import { closedCoverRect } from './sheet.js';
import { designedCover } from './cover.js';
import { pager } from './pager.js';
import { pickUpPaper } from '../sfx.js';

export const CYLINDER_ART = 'public/art/items/cylinder/';
const CYLINDERS = ['red', 'blue', 'green', 'cream'];
// Every piece keeps its own cylinder colour, in the cabinet and at the gramophone.
const hash = s => [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
export const cylinderColor = piece => {
  const i = ALL_PIECES.indexOf(piece);
  return CYLINDERS[(i >= 0 ? i : hash(piece.id)) % CYLINDERS.length];
};

// ...and its own sheet-music cover: a piece from the Muziekschatten data its scanned cover
// (`cover`), a real song its printed cover (the first page of its scan) or, when the scan has none,
// a cover drawn for it; a composer's piece one of six cover pictures with the title and composer
// printed on it.
export const SHEET_ART = 'public/art/items/sheet-music/';
export const coverFor = piece => piece.cover || (piece.scans?.cover
  ? `${piece.scans.dir}page-${piece.scans.pages[0]}.webp`
  : `${SHEET_ART}cover-${(ALL_PIECES.indexOf(piece) % 6) + 1}.webp`);
export const coverHtml = (piece, composer, name = composer.name) => {
  if (piece.cover || piece.scans?.cover) return `<span class="cover-art scan"><img src="${coverFor(piece)}" alt="${esc(piece.title)}"></span>`;
  if (piece.scans) return `<span class="cover-art designed">${designedCover(piece, composer.name)}</span>`;
  return `<span class="cover-art"><img src="${coverFor(piece)}" alt="">
    <span class="cover-text"><b>${esc(piece.title)}</b><i>${esc(name)}</i></span></span>`;
};

// Measured on the close-up (1672 × 941): plaque centres per column (the compartments are TUBE_DX
// further right), and per shelf the y of the shelf edge the cylinders stand on and of the plaques.
const BG_W = 1672, BG_H = 941;
const COLS = [323, 578, 833, 1090, 1345];
const TUBE_DX = 14;
const SHELVES = [{ edge: 244, plaque: 266 }, { edge: 539, plaque: 565 }, { edge: 798, plaque: 824 }];
const X = v => `${v / BG_W * 100}%`, Y = v => `${v / BG_H * 100}%`;

// The chosen book leaves its compartment and flies to the middle of the screen, growing to the size
// of the closed book on the desk; the music view then fades in around it (`noFade`), and the flying
// copy fades away on top of the real one.
function flyToCentre(art, fullName, done) {
  const from = art.getBoundingClientRect();
  const stage = art.closest('.stage');
  const to = closedCoverRect();
  // the copy keeps the cabinet's sizes: it sits in a box as wide as the cabinet picture (cqw units)
  const fly = h(`<div class="flying-book" style="container-type: inline-size; width:${stage.clientWidth}px; left:${from.left}px; top:${from.top}px"></div>`);
  const copy = art.cloneNode(true);
  Object.assign(copy.style, { width: `${from.width}px`, height: `${from.height}px` });
  fly.appendChild(copy);
  document.body.appendChild(fly);
  art.style.visibility = 'hidden';
  const s = to.width / from.width, dx = to.left - from.left, dy = to.top - from.top;
  // print the copy's text as it is on the book on the desk (full name, same size once scaled up)
  const cq = to.height / 44; // the desk's cqw in px (a page is 44cqw high)
  const b = copy.querySelector('.cover-text b'), i = copy.querySelector('.cover-text i');
  if (b) {
    i.textContent = fullName;
    Object.assign(b.style, { fontSize: `${1.9 * cq / s}px`, webkitLineClamp: 'unset' });
    i.style.fontSize = `${1.25 * cq / s}px`;
  }
  const lift = 'drop-shadow(0 0 0 rgba(0,0,0,0))', high = 'drop-shadow(0 30px 30px rgba(0,0,0,.55))';
  fly.animate([
    { transform: 'none', filter: lift },
    { transform: `translate(${dx * 0.08}px, ${dy * 0.08 - 30}px) scale(${1 + (s - 1) * 0.08}) rotate(-4deg)`, filter: high, offset: 0.2 },
    { transform: `translate(${dx}px, ${dy}px) scale(${s})`, filter: high },
  ], { duration: 950, easing: 'cubic-bezier(.45, .05, .2, 1)', fill: 'forwards' }).finished.then(() => {
    done();
    fly.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, delay: 380, fill: 'forwards' })
      .finished.then(() => { fly.remove(); art.style.visibility = ''; });
  });
}

// The cabinets. In the shop: the sheet music of the Muziekschatten collection, fifteen pieces to a
// cabinet, fetched from the back end (js/catalogue.js) as the player walks along. Choosing music for
// the piano: the pieces the game can play (they have notes): the songs of the SOM collection, as many
// cabinets as they fill (each shelf holds five songs of its level, so a cabinet has five easy, five
// middle and five hard ones), then the composers' own pieces. The cabinet in view is remembered for
// the next visit.
function songCabinets(pieces) {
  const byLevel = [1, 2, 3].map(l => pieces.filter(p => Math.min(3, Math.max(1, p.level || 1)) === l));
  const count = Math.max(1, ...byLevel.map(l => Math.ceil(l.length / COLS.length)));
  return Array.from({ length: count }, (_, k) => ({
    name: count > 1 ? `Liedjes uit de SOM-collectie · kast ${k + 1}` : 'Liedjes uit de SOM-collectie',
    pieces: byLevel.flatMap(l => l.slice(k * COLS.length, (k + 1) * COLS.length)),
  }));
}
const PIANO_CABINETS = [
  ...songCabinets(PIECES),
  { name: 'Muziek van de componisten', pieces: ALL_PIECES.filter(p => !PIECES.includes(p)) },
].filter(c => c.pieces.length);
const lastCabinet = { shop: 0, piano: 0 };

// Where each piece stands: on the shelf of its level (top ★ … bottom ★★★), five to a shelf; a piece
// whose shelf is full goes to the nearest shelf with room, and one without a level to the first.
function arrange(pieces) {
  const rows = SHELVES.map(() => []);
  for (const p of pieces) {
    const want = Math.min(3, Math.max(1, p.level || 1)) - 1;
    const row = [want, want + 1, want - 1, want + 2, want - 2].find(r => rows[r] && rows[r].length < COLS.length);
    if (row != null) rows[row].push(p);
  }
  return rows;
}

export function libraryView(ui, { forPiano = false } = {}) {
  const { el, stage } = frame(ui, {
    title: forPiano ? 'Kies muziek voor de piano' : 'De bladmuziekkast',
    cls: 'library',
    wide: true,
    closeup: 'public/art/closeups/cabinet.webp',
    full: true,
    tip: forPiano && PIANO_CABINETS.length < 2
      ? 'In elk vakje staat een muziekboek. Klik erop om het open te slaan. Bovenaan staan de makkelijkste stukken, onderaan de moeilijkste.'
      : forPiano
        ? 'In elk vakje staat een muziekboek. Klik erop om het open te slaan. Bovenaan staan de makkelijkste stukken, onderaan de moeilijkste. Met de pijlen ga je naar de andere kast.'
        : 'In elk vakje staat een muziekboek uit de verzameling van de winkel. Klik erop om het open te slaan. Met de pijlen loop je langs de kasten.',
  });
  let busy = false, nav = null;
  // one compartment per piece, with its plaque
  const shelve = (page, pieces) => {
    arrange(pieces).forEach((row, r) => {
      const shelf = SHELVES[r];
      row.forEach((p, col) => {
        const composer = creditFor(p);
        if (p.level) {
          const plaque = h(`<span class="cab-plaque" title="Moeilijkheid">${'★'.repeat(Math.min(3, p.level))}</span>`);
          Object.assign(plaque.style, { left: X(COLS[col]), top: Y(shelf.plaque) });
          page.append(plaque);
        }
        const tube = h(`
          <button class="tube" title="${esc(p.title)} — ${esc(composer.name)}">${coverHtml(p, composer, composer.short)}</button>`);
        Object.assign(tube.style, { left: X(COLS[col] + TUBE_DX), top: Y(shelf.edge) });
        tube.onclick = () => {
          if (busy || nav?.moving) return;
          busy = true;
          setTimeout(() => { busy = false; }, 1400);
          pickUpPaper();
          if (!forPiano) { flyToCentre(tube.querySelector('.cover-art'), composer.name, () => ui.open('sheet', { pieceId: p.id, noFade: true })); return; }
          // for the piano: the music is pulled out of its compartment and goes onto the piano
          tube.classList.add('pulled');
          setTimeout(() => {
            ui.close(); ui.top?.loadPiece?.(p.id); // close() pops at once, so top is the piano
            tube.classList.remove('pulled');
          }, 550);
        };
        page.append(tube);
      });
    });
  };
  const mode = forPiano ? 'piano' : 'shop';
  const walk = (count, label, fill) => {
    nav = pager(stage, { count, cls: 'cab-page', what: 'kast', label, fill, start: lastCabinet[mode], onMove: i => { lastCabinet[mode] = i; } });
  };

  if (forPiano) {
    walk(PIANO_CABINETS.length, i => PIANO_CABINETS[i].name, (i, page) => shelve(page, PIANO_CABINETS[i].pieces));
  } else {
    // the first cabinet tells how many there are
    const note = h('<p class="stage-note">Meneer Simone zoekt de bladmuziek op…</p>');
    stage.appendChild(note);
    piecePage(0).then(first => {
      note.remove();
      walk(first.pages, i => `Kast ${i + 1} van ${first.pages}`, (i, page) => piecePage(i).then(
        d => shelve(page, d.pieces),
        () => page.appendChild(h('<p class="stage-note">Deze kast klemt. Probeer het straks nog eens.</p>'))));
    }, () => {
      note.textContent = 'De bladmuziekkast zit op slot: Meneer Simone kan de muziek nu niet vinden. Probeer het straks nog eens.';
    });
  }
  return {
    el,
    onKey(e) { nav?.onKey(e); },
  };
}
