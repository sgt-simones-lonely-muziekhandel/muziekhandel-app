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

export function libraryView(ui, { forPiano = false } = {}) {
  const { el, stage } = frame(ui, {
    title: forPiano ? 'Kies muziek voor de piano' : 'De bladmuziekkast',
    cls: 'library',
    wide: true,
    closeup: 'public/art/closeups/cabinet.webp',
    full: true,
    tip: 'In elk vakje staat een muziekboek. Klik erop om het open te slaan. Bovenaan staan de makkelijkste stukken, onderaan de moeilijkste.',
  });
  let busy = false;
  SHELVES.forEach((shelf, row) => {
    const pieces = PIECES.filter(p => Math.min(3, p.level) === row + 1).slice(0, COLS.length);
    pieces.forEach((p, col) => {
      const composer = creditFor(p);
      const plaque = h(`<span class="cab-plaque" title="Moeilijkheid">${'★'.repeat(p.level)}</span>`);
      Object.assign(plaque.style, { left: X(COLS[col]), top: Y(shelf.plaque) });
      const tube = h(`
        <button class="tube" title="${esc(p.title)} — ${esc(composer.name)}">${coverHtml(p, composer, composer.short)}</button>`);
      Object.assign(tube.style, { left: X(COLS[col] + TUBE_DX), top: Y(shelf.edge) });
      tube.onclick = () => {
        if (busy) return;
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
      stage.append(plaque, tube);
    });
  });
  return { el };
}
