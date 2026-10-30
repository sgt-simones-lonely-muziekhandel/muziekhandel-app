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

// The shopkeeper's portraits (.keeper-face) talk and blink: `.talking` shows head-talk.webp,
// `.blink` head-blink.webp (see css). Preloaded so the first swap doesn't flash.
for (const n of ['head', 'head-talk', 'head-blink']) new Image().src = `public/art/characters/shopkeeper/${n}.webp`;
setInterval(() => {
  for (const f of document.querySelectorAll('.keeper-face:not(.talking)')) {
    if (Math.random() < 0.5) continue;
    f.classList.add('blink');
    setTimeout(() => f.classList.remove('blink'), 140);
  }
}, 2600);

// Move `face`'s mouth at a speaking rhythm until the returned function is called.
export function talk(face) {
  if (!face) return () => {};
  let open = false, timer = 0;
  const step = () => {
    open = !open;
    face.classList.toggle('talking', open);
    timer = setTimeout(step, open ? 90 + Math.random() * 90 : 60 + Math.random() * 80);
  };
  step();
  return () => { clearTimeout(timer); face.classList.remove('talking'); };
}

// Write `text` into `p` letter by letter while `face` talks, pausing (mouth shut) after a sentence
// or comma. A click on the text shows it all at once. Returns a function that stops it.
export function typeText(p, text, face) {
  let i = 0, timer = 0, quiet = null, at = performance.now();
  const hush = () => { quiet?.(); quiet = null; };
  const finish = () => {
    clearTimeout(timer); hush();
    p.textContent = text;
    p.removeEventListener('click', finish);
  };
  const next = () => {
    // letters are due at fixed times, so a late timer (a busy frame) catches up instead of slowing down
    while (i < text.length && performance.now() >= at) {
      const c = text[i++];
      at += /[.!?]/.test(c) ? 380 : c === ',' ? 180 : 28;
    }
    p.textContent = text.slice(0, i);
    if (i >= text.length) return finish();
    if (/[.!?,]/.test(text[i - 1])) hush(); else quiet ??= talk(face);
    timer = setTimeout(next, at - performance.now());
  };
  p.addEventListener('click', finish);
  next();
  return finish;
}

// The icon on the read-aloud buttons.
export const SPEAKER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

// Read Dutch text aloud for kids who can't read yet; `face` talks while the voice speaks.
let quietSpeaker = () => {};
export function speak(text, face) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  quietSpeaker();
  const u = new SpeechSynthesisUtterance(text.replace(/[^\p{L}\p{N}\s.,!?'"()-]/gu, ''));
  u.lang = 'nl-NL';
  const v = speechSynthesis.getVoices().find(v => v.lang?.startsWith('nl'));
  if (v) u.voice = v;
  u.rate = 0.95;
  if (face) {
    u.onstart = () => { quietSpeaker(); quietSpeaker = talk(face); };
    u.onend = u.onerror = () => { quietSpeaker(); quietSpeaker = () => {}; };
  }
  speechSynthesis.speak(u);
}

/**
 * The standard paper frame around a view: back button, title, body, keeper tip.
 * With `closeup` (an image in public/art/closeups) the panel is a dark wooden frame around that picture
 * instead, and `stage` is a box with the picture's proportions to position things on in percentages.
 * With `full` as well, there is no frame at all: the picture fills the screen (the edges that don't fit
 * are filled with a blurred copy), with only small Terug / ✕ buttons and the place name on top, so it
 * feels like the camera moved in rather than a window opening. `body` is then the stage.
 * `full` without a `closeup` gives the same full-screen stage on a wooden desk (`.stage.desk`).
 */
export function frame(ui, { title, cls = '', tip, wide = false, closeup = null, full = false }) {
  const tipHtml = tip ? `<button class="keeper-tip" title="Vraag het Meneer Simone"><span class="keeper-face"></span></button>
      <div class="tip-bubble paper" hidden><p></p><button class="keeper-listen speak">${SPEAKER}Voorlezen</button></div>` : '';
  const buttons = {
    back: '<button class="btn wood back" data-act="back"><span class="ico">‹</span> Terug</button>',
    close: '<button class="btn wood close" data-act="close" title="Terug naar de winkel">✕</button>',
  };
  const el = full ? h(`
    <div class="view full ${cls}">
      <div class="full-bg"></div>
      <div class="stage ${closeup ? '' : 'desk'}"></div>
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
    const tipFace = el.querySelector('.keeper-tip .keeper-face');
    let stopTyping = () => {};
    // An open tip goes away with any key or any click elsewhere (Escape/Backspace then only close the tip).
    const hideTip = () => {
      bubble.hidden = true;
      stopTyping();
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
      // the shopkeeper says it: the words appear as his mouth moves
      stopTyping = typeText(bubble.querySelector('p'), tip, tipFace);
      addEventListener('keydown', onTipKey, true);
      addEventListener('pointerdown', onTipDown, true);
    };
    el.hideTip = hideTip;
    bubble.querySelector('.speak').onclick = () => speak(tip, tipFace);
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
    // `noFade`: the view fades in over the one below (which goes away once it's covered) instead of
    // through black, e.g. when the music book has just flown to the centre of the screen
    const noFade = opts.noFade && !replacing;
    this.withFade(!noFade && (isFull || replacing?.el.classList.contains('full')), () => {
      replacing?.el.remove();
      // a paper card over a full-screen close-up keeps the close-up visible, dimmed, behind it
      if (below && (isFull || !below.el.classList.contains('full'))) {
        const hide = () => { if (this.stack.includes(view)) { below.el.hidden = true; below.onHide?.(); } };
        if (noFade) setTimeout(hide, 500); else hide();
      }
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
