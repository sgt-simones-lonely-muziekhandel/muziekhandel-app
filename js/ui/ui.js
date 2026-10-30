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

/**
 * The standard paper frame around a view: back button, title, body, keeper tip.
 * With `closeup` (an image in public/art/closeups) the panel is a dark wooden frame around that picture
 * instead, and `stage` is a box with the picture's proportions to position things on in percentages.
 * With `full` as well, there is no frame at all: the picture fills the screen (the edges that don't fit
 * are filled with a blurred copy), with only small Terug / ✕ buttons and the place name on top, so it
 * feels like the camera moved in rather than a window opening. `body` is then the stage.
 */
export function frame(ui, { title, cls = '', tip, wide = false, closeup = null, full = false }) {
  const tipHtml = tip ? `<button class="keeper-tip" title="Vraag het Meneer Van der Velde"><span class="keeper-face"></span></button>
      <div class="tip-bubble paper" hidden><p></p><button class="btn wood small speak">Voorlezen</button></div>` : '';
  const buttons = {
    back: '<button class="btn wood back" data-act="back"><span class="ico">‹</span> Terug</button>',
    close: '<button class="btn wood close" data-act="close" title="Terug naar de winkel">✕</button>',
  };
  const el = full && closeup ? h(`
    <div class="view full ${cls}">
      <div class="full-bg"></div>
      <div class="stage"></div>
      <header class="full-hud">${buttons.back}<h2 class="full-title visually-hidden">${esc(title)}</h2>${buttons.close}</header>
      ${tipHtml}
    </div>`) : h(`
    <div class="view ${cls}">
      <div class="panel ${closeup ? 'closeup' : 'paper'} ${wide ? 'wide' : ''}">
        <header class="panel-head">${buttons.back}<h2>${esc(title)}</h2>${buttons.close}</header>
        <div class="panel-body"></div>
      </div>
      ${tipHtml}
    </div>`);
  el.querySelector('[data-act=back]').onclick = () => ui.close();
  el.querySelector('[data-act=close]').onclick = () => ui.closeAll();
  if (tip) {
    const bubble = el.querySelector('.tip-bubble');
    bubble.querySelector('p').textContent = tip;
    // An open tip goes away with any key or any click elsewhere (Escape/Backspace then only close the tip).
    const hideTip = () => {
      bubble.hidden = true;
      removeEventListener('keydown', onTipKey, true);
      removeEventListener('pointerdown', onTipDown, true);
    };
    const onTipKey = e => {
      if (['Escape', 'Backspace'].includes(e.code)) { e.preventDefault(); e.stopImmediatePropagation(); }
      hideTip();
    };
    const onTipDown = e => { if (!e.target.closest('.speak, .keeper-tip')) hideTip(); };
    el.querySelector('.keeper-tip').onclick = () => {
      if (!bubble.hidden) return hideTip();
      bubble.hidden = false;
      addEventListener('keydown', onTipKey, true);
      addEventListener('pointerdown', onTipDown, true);
    };
    el.hideTip = hideTip;
    bubble.querySelector('.speak').onclick = () => speak(tip);
  }
  let stage = el.querySelector('.stage');
  if (closeup) {
    if (!stage) { stage = h('<div class="stage"></div>'); el.querySelector('.panel-body').appendChild(stage); }
    stage.style.backgroundImage = `url(${closeup})`;
    el.querySelector('.full-bg')?.style.setProperty('background-image', `url(${closeup})`);
  }
  const body = full ? stage : el.querySelector('.panel-body');
  return { el, body, stage, panel: el.querySelector('.panel') };
}

export class UI {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById('overlay');
    this.stack = [];
  }

  get isOpen() { return this.stack.length > 0; }
  get top() { return this.stack[this.stack.length - 1]; }

  // Full-screen views come and go with the same fade to black as a scene change.
  withFade(isFull, fn) {
    if (isFull) this.game.fade(fn); else fn();
  }

  open(name, opts = {}, replacing = null) {
    const view = VIEWS[name](this, opts);
    view.name = name;
    const below = this.top;
    this.stack.push(view);
    const isFull = view.el.classList.contains('full');
    this.withFade(isFull || replacing?.el.classList.contains('full'), () => {
      replacing?.el.remove();
      // a paper card over a full-screen close-up keeps the close-up visible, dimmed, behind it
      if (below && (isFull || !below.el.classList.contains('full'))) { below.el.hidden = true; below.onHide?.(); }
      this.root.appendChild(view.el);
      this.root.hidden = false;
      requestAnimationFrame(() => view.el.classList.add('in'));
      view.onShow?.();
    });
    return view;
  }

  // Replace the top view (e.g. library → sheet when picking a scroll).
  replace(name, opts = {}) {
    const old = this.stack.pop();
    old?.destroy?.();
    return this.open(name, opts, old);
  }

  // The stack changes at once (so keys and clicks go to the right view); what's on screen
  // changes after the fade when a full-screen view is involved.
  close() {
    const v = this.stack.pop();
    if (!v) return;
    v.el.hideTip?.();
    v.destroy?.();
    const next = this.top;
    const isFull = v.el.classList.contains('full') || next?.el.classList.contains('full');
    this.withFade(isFull, () => {
      v.el.remove();
      if (next && this.top === next) { next.el.hidden = false; next.onShow?.(); }
      if (!this.stack.length) this.root.hidden = true;
    });
  }

  closeAll() {
    const views = this.stack.splice(0);
    views.forEach(v => { v.el.hideTip?.(); v.destroy?.(); });
    this.withFade(views.some(v => v.el.classList.contains('full')), () => {
      views.forEach(v => v.el.remove());
      if (!this.stack.length) this.root.hidden = true;
    });
  }

  key(e) {
    if (e.code === 'Escape' || e.code === 'Backspace') { e.preventDefault(); this.close(); return; }
    this.top?.onKey?.(e);
  }

  keyUp(e) { this.top?.onKeyUp?.(e); }
}
