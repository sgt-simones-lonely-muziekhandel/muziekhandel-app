import { Street } from './street.js';
import { FutureStreet } from './future.js';
import { Shop } from './shop.js';
import { Corner } from './corner.js';
import { UI } from './ui/ui.js';
import { initAudio, onAudioReady } from './audio.js';
import { loadKeyLabels } from './music.js';

const VH = 720; // virtual height of every scene

class Game {
  constructor() {
    this.canvas = document.getElementById('stage');
    this.ctx = this.canvas.getContext('2d');
    this.input = { left: false, right: false };
    this.idleTime = 0;
    this.camX = 0;
    this.viewW = 1280;
    this.ui = new UI(this);
    this.scenes = { future: new FutureStreet(this), street: new Street(this), shop: new Shop(this), corner: new Corner(this) };
    // the game starts in the future, on the flooded quay
    this.scene = this.scenes.future;
    this.running = false;
    this.bindInput();
    addEventListener('resize', () => this.resize());
    this.resize();
  }

  // The place name is only used as the page title: the pictures show where you are.
  setPlace(text) { document.title = `${text} · Muziekhandel 1900`; }

  start() {
    // the browser's back button (or a keyboard's back key) also steps back inside the game
    history.pushState({ game: true }, '');
    addEventListener('popstate', () => { if (this.back()) history.pushState({ game: true }, ''); });
    this.scene.enter();
    this.running = true;
    let last = performance.now();
    const loop = now => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.frame(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  goTo(name) {
    if (this.switching) return;
    this.switching = true;
    const from = Object.keys(this.scenes).find(k => this.scenes[k] === this.scene);
    this.fade(() => {
      this.scene = this.scenes[name];
      this.fit();
      this.scene.enter(from);
      this.switching = false;
    });
  }

  // One step back: from the listening corner to the shop, from the shop out onto the street.
  back() {
    if (this.ui.isOpen) { this.ui.close(); return true; }
    const to = { corner: 'shop', shop: 'street' }[Object.keys(this.scenes).find(k => this.scenes[k] === this.scene)];
    if (!to) return false;
    this.goTo(to);
    return true;
  }

  fade(mid) {
    const f = document.getElementById('fade');
    f.classList.add('on');
    setTimeout(() => { mid(); f.classList.remove('on'); }, 450);
  }

  resize() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.dpr = dpr;
    this.fit();
  }

  // Fill the height; a scene that asks for it (the shop) is shown whole when a small band
  // above and below is enough to fit its width.
  fit() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.scale = h / VH;
    this.offY = 0;
    const sw = this.scene?.fitWidth;
    if (sw && w / this.scale < sw && (w / sw) * VH >= h * 0.8) {
      this.scale = w / sw;
      this.offY = (h - VH * this.scale) / 2;
    }
    this.viewW = w / this.scale;
  }

  frame(dt) {
    const paused = this.ui.isOpen;
    const input = paused ? { left: false, right: false } : this.input;
    this.idleTime += dt;
    this.scene.update(dt, input);
    const s = this.scene;
    // camera follows the boy; scenes narrower than the screen are centred
    this.camX = s.width <= this.viewW
      ? (s.width - this.viewW) / 2
      : Math.max(0, Math.min(s.width - this.viewW, s.boy.x - this.viewW / 2));
    const k = this.scale * this.dpr;
    const view = { camX: this.camX, viewW: this.viewW, base: new DOMMatrix([k, 0, 0, k, 0, this.offY * this.dpr]) };
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    s.draw(this.ctx, view);
  }

  toWorld(e) {
    const r = this.canvas.getBoundingClientRect();
    return [(e.clientX - r.left) / this.scale + this.camX, (e.clientY - r.top - this.offY) / this.scale];
  }

  bindInput() {
    const keyDir = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
    addEventListener('keydown', e => {
      this.idleTime = 0;
      if (!this.running) return;
      if (this.ui.isOpen) { this.ui.key(e); return; }
      if (e.code === 'Backspace' || e.code === 'Escape') { e.preventDefault(); this.back(); return; }
      if (keyDir[e.code]) { this.input[keyDir[e.code]] = true; e.preventDefault(); }
      if (['ArrowUp', 'Enter', 'KeyE', 'Space', 'KeyW'].includes(e.code)) { e.preventDefault(); this.scene.interact(); }
    });
    addEventListener('keyup', e => {
      if (this.ui.isOpen) { this.ui.keyUp(e); }
      if (keyDir[e.code]) this.input[keyDir[e.code]] = false;
    });
    addEventListener('blur', () => { this.input.left = this.input.right = false; });
    this.canvas.addEventListener('pointerdown', e => {
      this.idleTime = 0;
      if (!this.running || this.ui.isOpen) return;
      this.scene.click(...this.toWorld(e));
    });
    this.canvas.addEventListener('pointermove', e => {
      if (!this.running) return;
      const hit = this.scene.hover(...this.toWorld(e));
      this.canvas.style.cursor = hit ? 'pointer' : 'default';
    });
    document.getElementById('btn-help').addEventListener('click', () => this.ui.open('keeper'));
  }
}

const game = new Game();
window.game = game;
loadKeyLabels();

document.fonts.load('700 20px "Cinzel Decorative"').catch(() => {});

document.getElementById('btn-start').addEventListener('click', () => {
  const status = document.getElementById('piano-status');
  status.hidden = false;
  initAudio().catch(() => { status.textContent = 'Piano niet geladen (geen internet?)'; });
  onAudioReady(() => { status.hidden = true; });
  document.getElementById('title-screen').classList.add('gone');
  game.start();
});

// Allow ?scene=street or ?scene=shop for quick testing.
const qs = new URLSearchParams(location.search);
if (qs.get('autostart') != null) {
  document.getElementById('title-screen').classList.add('gone');
  game.start();
  const sc = qs.get('scene');
  if (game.scenes[sc] && game.scenes[sc] !== game.scene) { game.scenes.shop.greeted = qs.get('greet') == null; game.scene = game.scenes[sc]; game.fit(); game.scene.enter(); }
  if (qs.get('open')) setTimeout(() => game.ui.open(qs.get('open'), { pieceId: qs.get('piece'), composerId: qs.get('composer') }), 300);
}
