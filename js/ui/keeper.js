// Meneer Simone, the shopkeeper: greets the player and helps them find their way.
import { h, esc, speak, stopSpeaking, typeText, SPEAKER } from './ui.js';
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
    go: ['piano', 'Naar de piano'],
  },
  {
    q: 'Ik weet nog niks van muziek. Help!',
    a: 'Geen zorgen, iedereen begint ergens! In mijn notenles leer je stap voor stap hoe noten werken: hoe ze heten, waar ze op de piano zitten, hoe je ze leest en hoe lang ze duren. En je mag overal zelf op drukken.',
    go: ['lessons', 'Naar de notenles'],
  },
  {
    q: 'Waar is de bladmuziek?',
    a: 'In de grote kast, rechts naast mijn toonbank! In elke koker zit een opgerold muziekstuk. Haal er maar eentje uit. Met de pijltjes blader je, en met Enter speel je het op de piano.',
    go: ['library', 'Naar de kast'],
  },
  {
    q: 'Wie zijn die mensen aan de muur?',
    a: 'Dat zijn de makers van dit spel! Ze hebben zich laten schilderen in kleren van vroeger, met hoge hoed en pruik en al. Klik op de schilderijen en je komt bij de beroemde componisten: mensen die muziek bedenken en opschrijven. Daar lees je hun verhaal en hoor je hun muziek.',
    go: ['gallery', 'Naar de schilderijen'],
  },
  {
    q: 'Mag ik muziek luisteren?',
    a: 'Natuurlijk! Mijn grammofoon is gloednieuw, de nieuwste uitvinding! Hij staat in de luisterhoek: loop maar helemaal naar rechts. Kies een cilinder en luister maar.',
    go: ['gramophone', 'Naar de grammofoon'],
  },
];

const GREETING = 'Goedendag, en welkom in Muziekhandel Simone! Ik ben Meneer Simone. Kijk gerust rond. Wil je weten wat je hier kunt doen? Vraag het maar!';

// The dialog: his portrait (talking while his words appear) next to a speech bubble, and under
// it the questions the player can ask, written on the same paper.
export function keeperView(ui, { greeting = false } = {}) {
  const el = h(`
    <div class="view keeper">
      <div class="keeper-box paper">
        <button class="brass-round keeper-close" title="Sluiten" aria-label="Sluiten">✕</button>
        <div class="keeper-main">
          <div class="keeper-portrait">
            <span class="keeper-face big"></span>
            <b class="keeper-name">Meneer Simone</b>
            <button class="keeper-listen speak" title="Laat Meneer Simone het voorlezen">${SPEAKER}Voorlezen</button>
          </div>
          <div class="keeper-talk">
            <p class="keeper-text"></p>
            <div class="keeper-extra"></div>
            <div class="keeper-go"></div>
          </div>
        </div>
        <div class="keeper-ask">
          <h3 class="hand">Vraag het maar…</h3>
          <div class="keeper-qs"></div>
        </div>
      </div>
    </div>`);
  const $ = s => el.querySelector(s);
  const face = $('.keeper-face');
  const talkBox = $('.keeper-talk');
  let current = '', stopTyping = () => {};
  // without a scrollbar, a soft fade at the bottom of the bubble shows there is more to read
  const fade = () => talkBox.classList.toggle('more', talkBox.scrollTop + talkBox.clientHeight < talkBox.scrollHeight - 4);
  talkBox.addEventListener('scroll', fade);
  const resized = new ResizeObserver(fade);
  [...talkBox.children].forEach(c => resized.observe(c));

  const say = (text, topic = null) => {
    current = text;
    stopTyping();
    stopSpeaking();
    stopTyping = typeText($('.keeper-text'), text, face);
    talkBox.scrollTop = 0;
    const extra = $('.keeper-extra');
    extra.innerHTML = '';
    if (topic?.guide) extra.appendChild(keyboardGuide());
    const go = $('.keeper-go');
    go.innerHTML = '';
    if (topic?.go) {
      const [view, label] = topic.go;
      const b = h(`<button class="btn brass small">${esc(label)} ›</button>`);
      b.onclick = () => { ui.close(); ui.open(view); };
      go.appendChild(b);
    }
    el.querySelectorAll('.q').forEach(q => q.classList.toggle('on', q.topic === topic));
  };

  for (const t of TOPICS) {
    const b = h(`<button class="q">${esc(t.q)}</button>`);
    b.topic = t;
    b.onclick = () => say(t.a, t);
    $('.keeper-qs').appendChild(b);
  }
  $('.speak').onclick = e => speak(current, face, e.currentTarget);
  $('.keeper-close').onclick = () => ui.close();
  el.addEventListener('pointerdown', e => { if (e.target === el) ui.close(); });

  say(greeting ? GREETING : 'Zeg het maar! Waarmee kan ik je helpen?');

  return {
    el,
    destroy() { stopTyping(); resized.disconnect(); stopSpeaking(); },
  };
}
