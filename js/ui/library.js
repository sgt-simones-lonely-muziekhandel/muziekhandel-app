// The sheet music cabinet, seen up close (public/art/closeups/cabinet): three shelves of five
// compartments, each with a brass plaque. Every piece is a music cylinder (public/art/items/cylinder)
// in its own compartment; the shelf says how hard it is: top ★, middle ★★, bottom ★★★.
import { frame, h, esc } from './ui.js';
import { COMPOSERS, PIECES } from '../data.js';

export const CYLINDER_ART = 'public/art/items/cylinder/';
const CYLINDERS = ['red', 'blue', 'green', 'cream'];
const ART = CYLINDER_ART;
// Every piece keeps its own cylinder colour, in the cabinet and at the gramophone.
export const cylinderColor = piece => CYLINDERS[PIECES.indexOf(piece) % CYLINDERS.length];

// Measured on the close-up (1672 × 941): plaque centres per column (the compartments are TUBE_DX
// further right), and per shelf the y of the shelf edge the cylinders stand on and of the plaques.
const BG_W = 1672, BG_H = 941;
const COLS = [323, 578, 833, 1090, 1345];
const TUBE_DX = 30;
const SHELVES = [{ edge: 244, plaque: 266 }, { edge: 539, plaque: 565 }, { edge: 798, plaque: 824 }];
const X = v => `${v / BG_W * 100}%`, Y = v => `${v / BG_H * 100}%`;

export function libraryView(ui, { forPiano = false } = {}) {
  const { el, stage } = frame(ui, {
    title: forPiano ? 'Kies muziek voor de piano' : 'De bladmuziekkast',
    cls: 'library',
    wide: true,
    closeup: 'public/art/closeups/cabinet.webp',
    tip: 'In elke koker zit opgerolde bladmuziek. Klik op een koker om hem open te maken. Bovenaan staan de makkelijkste stukken, onderaan de moeilijkste.',
  });
  SHELVES.forEach((shelf, row) => {
    const pieces = PIECES.filter(p => Math.min(3, p.level) === row + 1).slice(0, COLS.length);
    pieces.forEach((p, col) => {
      const composer = COMPOSERS.find(c => c.id === p.composer);
      const color = cylinderColor(p);
      const plaque = h(`<span class="cab-plaque">${esc(composer.short)}</span>`);
      Object.assign(plaque.style, { left: X(COLS[col]), top: Y(shelf.plaque) });
      const tube = h(`
        <button class="tube" title="${esc(p.title)}">
          <img class="cyl" src="${ART}${color}.webp" alt="">
          <span class="tube-label">
            <strong>${esc(p.title)}</strong>
            <em>${'★'.repeat(p.level)}${'☆'.repeat(3 - p.level)}</em>
          </span>
        </button>`);
      Object.assign(tube.style, { left: X(COLS[col] + TUBE_DX), top: Y(shelf.edge) });
      tube.onclick = () => {
        // the lid comes off, then the music is pulled out
        tube.classList.add('pulled');
        tube.querySelector('.cyl').src = `${ART}open.webp`;
        setTimeout(() => {
          if (forPiano) { ui.close(); ui.top?.loadPiece?.(p.id); }
          else ui.open('sheet', { pieceId: p.id });
          tube.classList.remove('pulled');
          tube.querySelector('.cyl').src = `${ART}${color}.webp`;
        }, 650);
      };
      stage.append(plaque, tube);
    });
  });
  return { el };
}
