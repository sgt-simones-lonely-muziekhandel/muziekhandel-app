// Overlay stack: every interactive object opens a "view" on top of the shop.
import { libraryView } from './library.js';
import { sheetView } from './sheet.js';
import { pianoView } from './piano.js';
import { galleryView, composerView } from './gallery.js';
import { gramophoneView } from './gramophone.js';
import { keeperView } from './keeper.js';
import { lessonsView } from './lessons.js';

const VIEWS = {
  library: libraryView, sheet: sheetView, piano: pianoView,
  gallery: galleryView, composer: composerView, gramophone: gramophoneView, keeper: keeperView, lessons: lessonsView,
};

export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

// Smooth scrolling for a list without a scrollbar: a mouse wheel glides there instead of jumping
// (a trackpad already glides, so its small steps are left alone), the mouse can drag the list and
// fling it, and `.more-up` / `.more-down` say whether there is more to see above or below.
export function smoothScroll(el) {
  let target = 0, raf = 0, drag = null, dragged = false;
  const max = () => el.scrollHeight - el.clientHeight;
  const clamp = v => Math.max(0, Math.min(max(), v));
  const edges = () => {
    el.classList.toggle('more-up', el.scrollTop > 2);
    el.classList.toggle('more-down', el.scrollTop < max() - 2);
  };
  const glide = () => {
    if (raf) return;
    const step = () => {
      const d = target - el.scrollTop;
      if (Math.abs(d) < 0.5) { el.scrollTop = target; raf = 0; return; }
      el.scrollTop += d * 0.16;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };
  el.addEventListener('wheel', e => {
    if (e.ctrlKey || max() <= 0) return;
    const dy = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * el.clientHeight : e.deltaY;
    if (e.deltaMode === 0 && Math.abs(dy) < 40) return; // a trackpad: native scrolling glides already
    e.preventDefault();
    if (!raf) target = el.scrollTop;
    target = clamp(target + dy * 1.2);
    glide();
  }, { passive: false });
  el.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    cancelAnimationFrame(raf); raf = 0;
    drag = { y: e.clientY, top: el.scrollTop, v: 0, t: performance.now(), last: e.clientY };
    dragged = false;
  });
  el.addEventListener('pointermove', e => {
    if (!drag) return;
    if (!dragged && Math.abs(e.clientY - drag.y) < 6) return;
    if (!dragged) { dragged = true; el.classList.add('dragging'); el.setPointerCapture(e.pointerId); }
    const now = performance.now();
    drag.v = (e.clientY - drag.last) / Math.max(1, now - drag.t);
    drag.last = e.clientY; drag.t = now;
    el.scrollTop = clamp(drag.top - (e.clientY - drag.y));
  });
  const end = () => {
    if (!drag) return;
    if (dragged) { target = clamp(el.scrollTop - drag.v * 320); glide(); }
    drag = null;
    el.classList.remove('dragging');
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('lostpointercapture', end);
  // a drag is not a click on what it started on
  el.addEventListener('click', e => { if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; } }, true);
  el.addEventListener('scroll', edges, { passive: true });
  new ResizeObserver(edges).observe(el);
  requestAnimationFrame(edges);
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

// The keys that step back out of a view (one view at a time, down to the scene).
export const BACK_KEYS = ['ArrowDown', 'Escape', 'Backspace'];

// The icon on the read-aloud buttons.
export const SPEAKER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

const STOP_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>';

// The most natural Dutch voice the browser has: the neural "Natural"/online voices (Edge), Google's
// (Chrome), the enhanced/premium ones (macOS, iOS), then any Dutch voice, nl-NL before nl-BE.
// The voices load late in some browsers, so this is asked again when they arrive.
let voice = null;
function pickVoice() {
  const nl = speechSynthesis.getVoices().filter(v => /^nl/i.test(v.lang));
  const score = v => (/natural|online|neural/i.test(v.name) ? 40 : 0) + (/google/i.test(v.name) ? 30 : 0)
    + (/premium|enhanced|siri/i.test(v.name) ? 20 : 0) + (/nl[-_]NL/i.test(v.lang) ? 5 : 0)
    + (/claire|fenna|colette|xander|maarten/i.test(v.name) ? 2 : 0);
  voice = nl.sort((a, b) => score(b) - score(a))[0] || null;
}
if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
  // nothing keeps talking in a tab that isn't looked at
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopSpeaking(); });
}

// Read Dutch text aloud for kids who can't read yet; `face` talks while the voice speaks. With
// `button` (the Voorlezen button) it is a toggle: while reading the button says Stoppen, and
// pressing it again stops. Read a sentence at a time: it sounds less run-on, and long texts
// don't get cut off (Chrome stops a single long utterance after about 15 seconds).
let quietSpeaker = () => {};
let reading = null; // what is being read: { button, label }, one object per speak()
export function speak(text, face, button) {
  if (!('speechSynthesis' in window)) return;
  const again = button && reading?.button === button;
  stopSpeaking();
  if (again) return;
  reading = { button, label: button?.innerHTML };
  if (button) {
    button.innerHTML = `${STOP_ICON}Stoppen`;
    button.classList.add('speaking');
  }
  const clean = text.replace(/[^\p{L}\p{N}\s.,!?'"()-]/gu, '').replace(/\s+/g, ' ').trim();
  const sentences = clean.match(/[^.!?]+[.!?]*/g)?.map(s => s.trim()).filter(Boolean) || [];
  const me = reading;
  sentences.forEach((s, i) => {
    const u = new SpeechSynthesisUtterance(s);
    u.lang = voice?.lang || 'nl-NL';
    if (voice) u.voice = voice;
    // the robotic voices sound friendlier a touch slower; the natural ones need no help
    u.rate = voice && /natural|online|neural|google|premium|enhanced/i.test(voice.name) ? 0.97 : 0.9;
    // (a cancelled reading still ends its sentences, a moment later: it leaves the next one alone)
    u.onstart = () => { if (face && reading === me) { quietSpeaker(); quietSpeaker = talk(face); } };
    u.onend = u.onerror = () => {
      if (reading !== me) return;
      if (face) { quietSpeaker(); quietSpeaker = () => {}; }
      if (i === sentences.length - 1) stopSpeaking();
    };
    speechSynthesis.speak(u);
  });
}

// Stop reading aloud (the views call this whenever the player goes somewhere else).
export function stopSpeaking() {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  quietSpeaker();
  quietSpeaker = () => {};
  if (reading?.button) {
    reading.button.innerHTML = reading.label;
    reading.button.classList.remove('speaking');
  }
  reading = null;
}

/**
 * The standard paper frame around a view: the back button (top left; ↓ does the same), title, body,
 * keeper tip.
 * With `closeup` (an image in public/art/closeups) the panel is a dark wooden frame around that picture
 * instead, and `stage` is a box with the picture's proportions to position things on in percentages.
 * With `full` as well, there is no frame at all: the picture fills the screen (the edges that don't fit
 * are filled with a blurred copy), with only the round back button and the place name on top, so it
 * feels like the camera moved in rather than a window opening. `body` is then the stage.
 * `full` without a `closeup` gives the same full-screen stage on a wooden desk (`.stage.desk`).
 * `hideTitle` keeps the title for screen readers only (the panel then has just the two buttons).
 */
export function frame(ui, { title, cls = '', tip, wide = false, closeup = null, full = false, hideTitle = false }) {
  const tipHtml = tip ? `<button class="keeper-tip" title="Vraag het Meneer Simone"><span class="keeper-face"></span></button>
      <div class="tip-bubble paper" hidden><p></p><button class="keeper-listen speak">${SPEAKER}Voorlezen</button></div>` : '';
  const buttons = {
    back: '<button class="brass-round back" data-act="back" title="Terug (↓)" aria-label="Terug"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>',
  };
  const el = full ? h(`
    <div class="view full ${cls}">
      <div class="full-bg"></div>
      <div class="stage ${closeup ? '' : 'desk'}"></div>
      <header class="full-hud">${buttons.back}<h2 class="full-title visually-hidden">${esc(title)}</h2></header>
      ${tipHtml}
    </div>`) : h(`
    <div class="view ${cls}">
      <div class="panel ${closeup ? 'closeup' : 'paper'} ${wide ? 'wide' : ''} ${hideTitle ? 'no-title' : ''}">
        <header class="panel-head">${buttons.back}<h2 class="${hideTitle ? 'visually-hidden' : ''}">${esc(title)}</h2><span class="head-balance"></span></header>
        <div class="panel-body"></div>
      </div>
      ${tipHtml}
    </div>`);
  el.querySelector('[data-act=back]').onclick = () => ui.close();
  if (tip) {
    const bubble = el.querySelector('.tip-bubble');
    const tipFace = el.querySelector('.keeper-tip .keeper-face');
    let stopTyping = () => {};
    // An open tip goes away with any key or any click elsewhere (Escape/Backspace then only close the tip).
    const hideTip = () => {
      bubble.hidden = true;
      stopTyping();
      stopSpeaking();
      removeEventListener('keydown', onTipKey, true);
      removeEventListener('pointerdown', onTipDown, true);
    };
    const onTipKey = e => {
      if (BACK_KEYS.includes(e.code)) { e.preventDefault(); e.stopImmediatePropagation(); }
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
    bubble.querySelector('.speak').onclick = e => speak(tip, tipFace, e.currentTarget);
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

// A card that says Meneer Simone is looking something up (a piece or composer from the back end).
// When `promise` comes in, `then` puts the real view in its place, unless the player has gone
// somewhere else meanwhile; if it fails, the card says so.
export function waitView(ui, title, promise, then) {
  const { el, body } = frame(ui, { title, cls: 'waiting' });
  const note = h('<p class="wait-note">Meneer Simone zoekt het even op…</p>');
  body.appendChild(note);
  const view = { el };
  promise.then(() => { if (ui.top === view) then(); }, () => {
    note.textContent = 'Meneer Simone kan het nu niet vinden. Probeer het straks nog eens.';
  });
  return view;
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
    stopSpeaking(); // a voice reading aloud stops when the player goes somewhere else
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
    stopSpeaking();
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
    stopSpeaking();
    const views = this.stack.splice(0);
    views.forEach(v => { v.el.hideTip?.(); v.destroy?.(); });
    this.withFade(views.some(v => v.el.classList.contains('full')), () => {
      views.forEach(v => v.el.remove());
      if (!this.stack.length) this.root.hidden = true;
    });
  }

  key(e) {
    if (BACK_KEYS.includes(e.code)) { e.preventDefault(); this.close(); return; }
    this.top?.onKey?.(e);
  }

  keyUp(e) { this.top?.onKeyUp?.(e); }
}
