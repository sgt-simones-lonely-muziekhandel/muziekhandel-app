// Overlay stack: every interactive object opens a "view" on top of the shop.
import { libraryView } from './library.js';
import { sheetView } from './sheet.js';
import { pianoView } from './piano.js';
import { galleryView, composerView } from './gallery.js';
import { gramophoneView } from './gramophone.js';
import { keeperView } from './keeper.js';

const VIEWS = {
  library: libraryView, sheet: sheetView, piano: pianoView,
  gallery: galleryView, composer: composerView, gramophone: gramophoneView, keeper: keeperView,
};

export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Read Dutch text aloud for kids who can't read yet.
export function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[^\p{L}\p{N}\s.,!?'"()-]/gu, ''));
  u.lang = 'nl-NL';
  const v = speechSynthesis.getVoices().find(v => v.lang?.startsWith('nl'));
  if (v) u.voice = v;
  u.rate = 0.95;
  speechSynthesis.speak(u);
}

/** The standard paper frame around a view: back button, title, body, keeper tip. */
export function frame(ui, { title, cls = '', tip, wide = false }) {
  const el = h(`
    <div class="view ${cls}">
      <div class="panel paper ${wide ? 'wide' : ''}">
        <header class="panel-head">
          <button class="btn wood back" data-act="back"><span class="ico">◀</span> Terug</button>
          <h2>${esc(title)}</h2>
          <button class="btn wood close" data-act="close" title="Terug naar de winkel">✕</button>
        </header>
        <div class="panel-body"></div>
      </div>
      ${tip ? `<button class="keeper-tip" title="Vraag het Meneer Van der Velde"><span class="keeper-face"></span></button>
      <div class="tip-bubble paper" hidden><p></p><button class="btn wood small speak">🔊 Voorlezen</button></div>` : ''}
    </div>`);
  el.querySelector('[data-act=back]').onclick = () => ui.close();
  el.querySelector('[data-act=close]').onclick = () => ui.closeAll();
  if (tip) {
    const bubble = el.querySelector('.tip-bubble');
    bubble.querySelector('p').textContent = tip;
    el.querySelector('.keeper-tip').onclick = () => { bubble.hidden = !bubble.hidden; };
    bubble.querySelector('.speak').onclick = () => speak(tip);
  }
  return { el, body: el.querySelector('.panel-body'), panel: el.querySelector('.panel') };
}

export class UI {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById('overlay');
    this.stack = [];
  }

  get isOpen() { return this.stack.length > 0; }
  get top() { return this.stack[this.stack.length - 1]; }

  open(name, opts = {}) {
    const view = VIEWS[name](this, opts);
    view.name = name;
    if (this.top) { this.top.el.hidden = true; this.top.onHide?.(); }
    this.stack.push(view);
    this.root.appendChild(view.el);
    this.root.hidden = false;
    requestAnimationFrame(() => view.el.classList.add('in'));
    view.onShow?.();
    return view;
  }

  // Replace the top view (e.g. library → sheet when picking a scroll).
  replace(name, opts = {}) {
    const old = this.stack.pop();
    if (old) { old.destroy?.(); old.el.remove(); }
    if (this.top) this.top.el.hidden = true;
    return this.open(name, opts);
  }

  close() {
    const v = this.stack.pop();
    if (!v) return;
    v.destroy?.();
    v.el.remove();
    if (this.top) { this.top.el.hidden = false; this.top.onShow?.(); }
    else this.root.hidden = true;
  }

  closeAll() { while (this.stack.length) this.close(); }

  key(e) {
    if (e.code === 'Escape') { e.preventDefault(); this.close(); return; }
    this.top?.onKey?.(e);
  }

  keyUp(e) { this.top?.onKeyUp?.(e); }
}
