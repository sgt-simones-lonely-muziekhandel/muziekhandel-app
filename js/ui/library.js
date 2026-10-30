// The sheet music cabinet: cardboard tubes on wooden shelves, one shelf per composer.
import { frame, h, esc } from './ui.js';
import { COMPOSERS, piecesBy } from '../data.js';

export function libraryView(ui, { forPiano = false } = {}) {
  const { el, body } = frame(ui, {
    title: forPiano ? 'Kies muziek voor de piano' : 'De bladmuziekkast',
    cls: 'library',
    wide: true,
    tip: 'In elke koker zit bladmuziek. Klik op een koker om hem open te maken. De sterretjes laten zien hoe moeilijk een stuk is.',
  });
  const cabinet = h('<div class="cabinet"></div>');
  for (const c of COMPOSERS) {
    const pieces = piecesBy(c.id);
    if (!pieces.length) continue;
    const shelf = h(`
      <div class="shelf">
        <div class="shelf-plaque">${esc(c.short)}</div>
        <div class="tubes"></div>
      </div>`);
    for (const p of pieces) {
      const tube = h(`
        <button class="tube" style="--hue:${(p.title.length * 37) % 360}">
          <span class="tube-cap"></span>
          <span class="tube-label">
            <strong>${esc(p.title)}</strong>
            <em>${'★'.repeat(p.level)}${'☆'.repeat(3 - p.level)}</em>
          </span>
          <span class="tube-cap end"></span>
        </button>`);
      tube.onclick = () => {
        tube.classList.add('pulled');
        setTimeout(() => {
          if (forPiano) { ui.close(); ui.top?.loadPiece?.(p.id); }
          else ui.open('sheet', { pieceId: p.id });
          tube.classList.remove('pulled');
        }, 520);
      };
      shelf.querySelector('.tubes').appendChild(tube);
    }
    cabinet.appendChild(shelf);
  }
  body.appendChild(cabinet);
  return { el };
}
