// The sheet music cabinet, seen up close (public/art/closeups/cabinet): three shelves of five
// compartments, each with a brass plaque. Every piece stands in its own compartment as a printed
// sheet-music cover (public/art/items/sheet-music) with its title and composer in the cartouche;
// the shelf says how hard it is (top ★, middle ★★, bottom ★★★), and so does the plaque.
// Cylinders (public/art/items/cylinder) are still what the gramophone plays.
import { frame, h, esc } from './ui.js';
import { COMPOSERS, PIECES } from '../data.js';

export const CYLINDER_ART = 'public/art/items/cylinder/';
const CYLINDERS = ['red', 'blue', 'green', 'cream'];
// Every piece keeps its own cylinder colour, in the cabinet and at the gramophone.
export const cylinderColor = piece => CYLINDERS[PIECES.indexOf(piece) % CYLINDERS.length];

// ...and its own sheet-music cover.
export const SHEET_ART = 'public/art/items/sheet-music/';
export const coverFor = piece => `${SHEET_ART}cover-${(PIECES.indexOf(piece) % 6) + 1}.webp`;
export const coverHtml = (piece, composer, name = composer.name) => `
  <span class="cover-art"><img src="${coverFor(piece)}" alt="">
    <span class="cover-text"><b>${esc(piece.title)}</b><i>${esc(name)}</i></span></span>`;

// Measured on the close-up (1672 × 941): plaque centres per column (the compartments are TUBE_DX
// further right), and per shelf the y of the shelf edge the cylinders stand on and of the plaques.
const BG_W = 1672, BG_H = 941;
const COLS = [323, 578, 833, 1090, 1345];
const TUBE_DX = 14;
const SHELVES = [{ edge: 244, plaque: 266 }, { edge: 539, plaque: 565 }, { edge: 798, plaque: 824 }];
const X = v => `${v / BG_W * 100}%`, Y = v => `${v / BG_H * 100}%`;

export function libraryView(ui, { forPiano = false } = {}) {
  const { el, stage } = frame(ui, {
    title: forPiano ? 'Kies muziek voor de piano' : 'De bladmuziekkast',
    cls: 'library',
    wide: true,
    closeup: 'public/art/closeups/cabinet.webp',
    full: true,
    tip: 'In elk vakje staat een muziekboek. Klik erop om het open te slaan. Bovenaan staan de makkelijkste stukken, onderaan de moeilijkste.',
  });
  SHELVES.forEach((shelf, row) => {
    const pieces = PIECES.filter(p => Math.min(3, p.level) === row + 1).slice(0, COLS.length);
    pieces.forEach((p, col) => {
      const composer = COMPOSERS.find(c => c.id === p.composer);
      const plaque = h(`<span class="cab-plaque" title="Moeilijkheid">${'★'.repeat(p.level)}</span>`);
      Object.assign(plaque.style, { left: X(COLS[col]), top: Y(shelf.plaque) });
      const tube = h(`
        <button class="tube" title="${esc(p.title)} — ${esc(composer.name)}">${coverHtml(p, composer, composer.short)}</button>`);
      Object.assign(tube.style, { left: X(COLS[col] + TUBE_DX), top: Y(shelf.edge) });
      tube.onclick = () => {
        // the music is pulled out of its compartment, then opened (see sheet.js)
        tube.classList.add('pulled');
        setTimeout(() => {
          if (forPiano) { ui.close(); ui.top?.loadPiece?.(p.id); } // close() pops at once, so top is the piano
          else ui.open('sheet', { pieceId: p.id });
          tube.classList.remove('pulled');
        }, 550);
      };
      stage.append(plaque, tube);
    });
  });
  return { el };
}
