// The sheet music cabinet, seen up close (public/art/closeups/cabinet): three shelves of five
// compartments, each with a brass plaque. Every piece stands in its own compartment as a printed
// sheet-music cover: its printed cover, a drawn one (js/ui/cover.js), or for a composer's piece one
// of the covers in public/art/items/sheet-music with its title and composer in the cartouche;
// the shelf says how hard it is (top ★, middle ★★, bottom ★★★), and so does the plaque.
// Cylinders (public/art/items/cylinder) are still what the gramophone plays.
import { frame, h, esc } from './ui.js';
import { PIECES, ALL_PIECES, creditFor } from '../data.js';
import { closedCoverRect } from './sheet.js';
import { designedCover } from './cover.js';
import { pickUpPaper } from '../sfx.js';

export const CYLINDER_ART = 'public/art/items/cylinder/';
const CYLINDERS = ['red', 'blue', 'green', 'cream'];
// Every piece keeps its own cylinder colour, in the cabinet and at the gramophone.
export const cylinderColor = piece => CYLINDERS[ALL_PIECES.indexOf(piece) % CYLINDERS.length];

// ...and its own sheet-music cover: a real song shows its printed cover (the first page of its scan)
// or, when the scan has none, a cover drawn for it; a composer's piece one of six cover pictures
// with the title and composer printed on it.
export const SHEET_ART = 'public/art/items/sheet-music/';
export const coverFor = piece => piece.scans?.cover
  ? `${piece.scans.dir}page-${piece.scans.pages[0]}.webp`
  : `${SHEET_ART}cover-${(ALL_PIECES.indexOf(piece) % 6) + 1}.webp`;
export const coverHtml = (piece, composer, name = composer.name) => {
  if (piece.scans?.cover) return `<span class="cover-art scan"><img src="${coverFor(piece)}" alt="${esc(piece.title)}"></span>`;
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

// The cabinets: the songs of the SOM collection, as many cabinets as they fill (each shelf holds
// five songs of its level, so a cabinet has five easy, five middle and five hard ones), then the
// composers' own pieces. The player walks from one to the other with the arrows (or ← →, or a
// swipe); the cabinet in view is remembered for the next visit.
function songCabinets(pieces) {
  const byLevel = [1, 2, 3].map(l => pieces.filter(p => Math.min(3, Math.max(1, p.level || 1)) === l));
  const count = Math.max(1, ...byLevel.map(l => Math.ceil(l.length / COLS.length)));
  return Array.from({ length: count }, (_, k) => ({
    name: count > 1 ? `Liedjes uit de SOM-collectie · kast ${k + 1}` : 'Liedjes uit de SOM-collectie',
    pieces: byLevel.flatMap(l => l.slice(k * COLS.length, (k + 1) * COLS.length)),
  }));
}
const CABINETS = [
  ...songCabinets(PIECES),
  { name: 'Muziek van de componisten', pieces: ALL_PIECES.filter(p => !PIECES.includes(p)) },
].filter(c => c.pieces.length);
let lastCabinet = 0;

// Where each piece stands: on the shelf of its level (top ★ … bottom ★★★), five to a shelf; a piece
// whose shelf is full goes to the nearest shelf with room.
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
    tip: CABINETS.length > 1
      ? 'In elk vakje staat een muziekboek. Klik erop om het open te slaan. Bovenaan staan de makkelijkste stukken, onderaan de moeilijkste. Met de pijlen ga je naar de andere kast.'
      : 'In elk vakje staat een muziekboek. Klik erop om het open te slaan. Bovenaan staan de makkelijkste stukken, onderaan de moeilijkste.',
  });
  let busy = false;
  const pages = CABINETS.map(cab => {
    const page = h('<section class="cab-page"></section>');
    arrange(cab.pieces).forEach((pieces, row) => {
      const shelf = SHELVES[row];
      pieces.forEach((p, col) => {
        const composer = creditFor(p);
        const plaque = h(`<span class="cab-plaque" title="Moeilijkheid">${'★'.repeat(Math.min(3, p.level || 1))}</span>`);
        Object.assign(plaque.style, { left: X(COLS[col]), top: Y(shelf.plaque) });
        const tube = h(`
          <button class="tube" title="${esc(p.title)} — ${esc(composer.name)}">${coverHtml(p, composer, composer.short)}</button>`);
        Object.assign(tube.style, { left: X(COLS[col] + TUBE_DX), top: Y(shelf.edge) });
        tube.onclick = () => {
          if (busy || moving) return;
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
        page.append(plaque, tube);
      });
    });
    stage.appendChild(page);
    return page;
  });

  // Going to another cabinet: both slide sideways together, quick and simple.
  let current = Math.min(lastCabinet, pages.length - 1), moving = false;
  pages.forEach((pg, k) => { pg.hidden = k !== current; });
  if (pages.length > 1) {
    stage.insertAdjacentHTML('beforeend', `
      <button class="cab-nav prev" title="Vorige kast (←)">‹</button>
      <button class="cab-nav next" title="Volgende kast (→)">›</button>
      <div class="cab-sign"><b></b><span class="cab-dots">${pages.map(() => '<i></i>').join('')}</span></div>`);
  }
  const sign = () => {
    if (pages.length < 2) return;
    stage.querySelector('.cab-sign b').textContent = CABINETS[current].name;
    stage.querySelectorAll('.cab-dots i').forEach((d, k) => d.classList.toggle('on', k === current));
    stage.querySelector('.cab-nav.prev').disabled = current === 0;
    stage.querySelector('.cab-nav.next').disabled = current === pages.length - 1;
  };
  sign();
  const go = d => {
    const to = current + d;
    if (moving || to < 0 || to >= pages.length) return;
    moving = true;
    const from = pages[current], next = pages[to];
    next.hidden = false;
    const timing = { duration: 420, easing: 'cubic-bezier(.25, .8, .25, 1)', fill: 'forwards' };
    const away = d > 0 ? -100 : 100;
    from.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${away}%)` }], timing);
    next.animate([{ transform: `translateX(${-away}%)` }, { transform: 'translateX(0)' }], timing).finished.then(() => {
      from.hidden = true;
      from.getAnimations().forEach(a => a.cancel());
      next.getAnimations().forEach(a => a.cancel());
      moving = false;
    });
    current = lastCabinet = to;
    sign();
  };
  if (pages.length > 1) {
    stage.querySelector('.cab-nav.prev').onclick = () => go(-1);
    stage.querySelector('.cab-nav.next').onclick = () => go(1);
    // a swipe across the cabinet walks along too
    let sx = null;
    stage.addEventListener('pointerdown', e => { sx = e.clientX; });
    stage.addEventListener('pointerup', e => {
      if (sx == null) return;
      const dx = e.clientX - sx;
      sx = null;
      if (Math.abs(dx) > 70) go(dx < 0 ? 1 : -1);
    });
  }
  return {
    el,
    onKey(e) {
      if (e.code === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); go(-1); }
    },
  };
}
