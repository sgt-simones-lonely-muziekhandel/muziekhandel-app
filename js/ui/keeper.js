// Meneer Van der Velde, the shopkeeper: greets the player and helps them find their way.
import { h, esc, speak } from './ui.js';
import { keyboardGuide } from './piano.js';

const TOPICS = [
  {
    q: 'Wat kan ik hier doen?',
    a: 'In mijn winkel kun je van alles ontdekken! Daar staat de piano, waar je zelf kunt spelen. Boven de piano hangen de schilderijen van beroemde componisten. Rechts van mijn toonbank staat de kast met bladmuziek in kokers. En loop je nog verder naar rechts, dan kom je in de luisterhoek met de grammofoon.',
  },
  {
    q: 'Hoe speel ik piano?',
    a: 'Je kunt de toetsen aanklikken, of je eigen toetsenbord gebruiken. Kijk maar naar het plaatje: elke letter is een toets van de piano. Kies daarna bladmuziek en druk op "Speel mee". De noot die oplicht, die speel jij!',
    guide: true,
    go: ['piano', '🎹 Naar de piano'],
  },
  {
    q: 'Waar is de bladmuziek?',
    a: 'In de grote kast, rechts naast mijn toonbank! In elke koker zit een opgerold muziekstuk. Haal er maar eentje uit. Met de pijltjes blader je, en met de spatiebalk speel je het op de piano.',
    go: ['library', '📜 Naar de kast'],
  },
  {
    q: 'Wie zijn die mensen aan de muur?',
    a: 'Dat zijn componisten: mensen die muziek bedenken en opschrijven. Bach, Mozart, Beethoven en nog meer. Klik op een schilderij en je ziet hun verhaal en hun hele familie.',
    go: ['gallery', '🖼️ Naar de schilderijen'],
  },
  {
    q: 'Mag ik muziek luisteren?',
    a: 'Natuurlijk! Mijn grammofoon is gloednieuw, de nieuwste uitvinding! Hij staat in de luisterhoek: loop maar helemaal naar rechts. Kies een cilinder en luister maar.',
    go: ['gramophone', '🎵 Naar de grammofoon'],
  },
];

const GREETING = 'Goedendag, en welkom in Muziekhandel Van der Velde! Ik ben Meneer Van der Velde. Kijk gerust rond. Wil je weten wat je hier kunt doen? Vraag het maar!';

export function keeperView(ui, { greeting = false } = {}) {
  const el = h(`
    <div class="view keeper">
      <div class="keeper-box paper">
        <div class="keeper-portrait"><span class="keeper-face big"></span><b>Meneer Van der Velde</b></div>
        <div class="keeper-talk">
          <p class="keeper-text"></p>
          <div class="keeper-extra"></div>
          <div class="keeper-actions">
            <button class="btn wood small speak">🔊 Voorlezen</button>
          </div>
          <div class="keeper-qs"></div>
        </div>
        <button class="btn wood close" title="Sluiten">✕</button>
      </div>
    </div>`);
  const $ = s => el.querySelector(s);
  let typing = 0, current = '';

  const say = (text, topic = null) => {
    current = text;
    clearInterval(typing);
    const p = $('.keeper-text');
    p.textContent = '';
    let i = 0;
    typing = setInterval(() => {
      i += 2;
      p.textContent = text.slice(0, i);
      if (i >= text.length) clearInterval(typing);
    }, 18);
    const extra = $('.keeper-extra');
    extra.innerHTML = '';
    if (topic?.guide) extra.appendChild(keyboardGuide());
    $('.keeper-actions').querySelectorAll('.go').forEach(b => b.remove());
    if (topic?.go) {
      const [view, label] = topic.go;
      const b = h(`<button class="btn brass small go">${esc(label)}</button>`);
      b.onclick = () => { ui.close(); ui.open(view); };
      $('.keeper-actions').appendChild(b);
    }
  };

  for (const t of TOPICS) {
    const b = h(`<button class="q">${esc(t.q)}</button>`);
    b.onclick = () => say(t.a, t);
    $('.keeper-qs').appendChild(b);
  }
  $('.speak').onclick = () => speak(current);
  $('.close').onclick = () => ui.close();
  el.addEventListener('pointerdown', e => { if (e.target === el) ui.close(); });

  say(greeting ? GREETING : 'Zeg het maar! Waarmee kan ik je helpen?');

  return {
    el,
    destroy() { clearInterval(typing); speechSynthesis?.cancel?.(); },
  };
}
