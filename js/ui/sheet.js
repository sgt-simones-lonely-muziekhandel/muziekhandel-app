// Reading a piece: flip pages with ← →, Space takes it to the piano.
import { frame, h, esc } from './ui.js';
import { pieceById, composerById } from '../data.js';
import { parsePiece } from '../music.js';
import { renderPage, pageCount } from '../notation.js';

export function sheetView(ui, { pieceId }) {
  const piece = pieceById(pieceId);
  const parsed = parsePiece(piece);
  const composer = composerById(piece.composer);
  const pages = pageCount(parsed);
  let page = 0;

  const { el, body } = frame(ui, {
    title: 'Bladmuziek',
    cls: 'sheet',
    wide: true,
    tip: 'Blader met de pijltjes ← en →. Druk op de spatiebalk om dit stuk op de piano te spelen. Elke noot heeft een eigen kleur, net als de toetsen van de piano!',
  });
  body.appendChild(h(`
    <div class="sheet-wrap">
      <article class="sheet-page">
        <div class="sheet-title">
          <h3>${esc(piece.title)}</h3>
          <p class="sheet-sub">${esc(piece.subtitle || '')}</p>
          <button class="composer-link">${esc(composer.name)} <span>(${esc(composer.years)})</span></button>
        </div>
        <div class="staff-host"></div>
        <div class="page-no"></div>
      </article>
      <nav class="sheet-nav">
        <button class="btn wood prev"><span class="ico">◀</span> Vorige</button>
        <button class="btn brass play"><span class="ico">🎹</span> Speel op de piano <kbd>spatie</kbd></button>
        <button class="btn wood next">Volgende <span class="ico">▶</span></button>
      </nav>
    </div>`));
  const host = body.querySelector('.staff-host');
  const article = body.querySelector('.sheet-page');

  const show = (dir = 0) => {
    renderPage(host, parsed, page);
    body.querySelector('.page-no').textContent = `blad ${page + 1} van ${pages}`;
    body.querySelector('.prev').disabled = page === 0;
    body.querySelector('.next').disabled = page === pages - 1;
    if (dir) {
      article.classList.remove('turn-l', 'turn-r');
      void article.offsetWidth;
      article.classList.add(dir > 0 ? 'turn-r' : 'turn-l');
    }
  };
  const flip = d => {
    const p = Math.max(0, Math.min(pages - 1, page + d));
    if (p !== page) { page = p; show(d); }
  };
  const toPiano = () => ui.replace('piano', { pieceId });

  body.querySelector('.prev').onclick = () => flip(-1);
  body.querySelector('.next').onclick = () => flip(1);
  body.querySelector('.play').onclick = toPiano;
  body.querySelector('.composer-link').onclick = () => ui.open('composer', { composerId: composer.id });
  show();

  return {
    el,
    onKey(e) {
      if (e.code === 'ArrowLeft') { e.preventDefault(); flip(-1); }
      if (e.code === 'ArrowRight') { e.preventDefault(); flip(1); }
      if (e.code === 'Space') { e.preventDefault(); toPiano(); }
    },
  };
}
