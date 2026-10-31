// Composers and pieces. Demo content, plus real sheet music from the SOM collection (js/som-scores.js,
// made by scripts/import_scores.py).
// Note format: "<pitch>:<duration>", pitch like C4, F#4, Bb3 or r (rest);
// durations: w h. h q. q 8. 8 16. 16 32, triplets ht qt 8t 16t; a trailing ~ ties the note to the
// next one. Bar lines "|" are optional and only for readability.
import { SOM_PIECES } from './som-scores.js';
import { cachedPiece } from './catalogue.js';

// The portrait for a composer we have no picture of (or whose picture won't load): a silhouette
// in a wig, no one in particular.
export const NO_PORTRAIT = 'public/art/portraits/unknown.webp';
// We have no portraits of the composers yet: every one gets the standard silhouette; a composer
// with a `portrait` would show it.
export const portraitOf = c => c?.portrait || NO_PORTRAIT;

export const COMPOSERS = [
  {
    id: 'bach',
    name: 'Johann Sebastian Bach',
    short: 'Bach',
    years: '1685 – 1750',
    title: 'Meester van de kerkmuziek',
    born: '21 maart 1685, Eisenach (Duitsland)',
    died: '28 juli 1750, Leipzig (Duitsland)',
    bio: 'Bach kwam uit een enorme muzikantenfamilie: bijna alle Bachs maakten muziek. Hij speelde orgel in grote kerken en schreef meer dan 1000 stukken. Elke week maakte hij nieuwe muziek voor de kerk in Leipzig. Zijn muziek is als een puzzel: melodieën die precies in elkaar passen.',
    fact: 'Bach had twintig kinderen! Vier van zijn zonen werden zelf ook beroemde componisten.',
    tree: {
      parents: [
        { name: 'Johann Ambrosius Bach', role: 'Vader · musicus', years: '1645–1695', g: 'm' },
        { name: 'Maria Elisabeth Lämmerhirt', role: 'Moeder', years: '1644–1694', g: 'f' },
      ],
      siblings: [],
      spouses: [
        { name: 'Maria Barbara Bach', role: '1e vrouw', years: '1684–1720', g: 'f' },
        { name: 'Anna Magdalena Wilcke', role: '2e vrouw · zangeres', years: '1701–1760', g: 'f' },
      ],
      children: [
        { name: 'Wilhelm Friedemann', role: 'Zoon · componist', years: '1710–1784', g: 'm' },
        { name: 'Carl Philipp Emanuel', role: 'Zoon · componist', years: '1714–1788', g: 'm' },
        { name: 'Johann Christoph Friedrich', role: 'Zoon · componist', years: '1732–1795', g: 'm' },
        { name: 'Johann Christian', role: 'Zoon · componist', years: '1735–1782', g: 'm' },
      ],
      childrenNote: '…en nog 16 andere kinderen',
    },
  },
  {
    id: 'mozart',
    name: 'Wolfgang Amadeus Mozart',
    short: 'Mozart',
    years: '1756 – 1791',
    title: 'Het wonderkind',
    born: '27 januari 1756, Salzburg (Oostenrijk)',
    died: '5 december 1791, Wenen (Oostenrijk)',
    bio: 'Mozart was een wonderkind. Toen hij vijf was, schreef hij al zijn eerste stukjes. Met zijn vader en zus reisde hij door heel Europa om te spelen voor koningen en keizers. Hij schreef meer dan 600 stukken: opera\'s, symfonieën en vrolijke pianomuziek.',
    fact: 'Als kind gaf Mozart ook concerten in Nederland: in 1765 en 1766 speelde hij in Den Haag en Amsterdam!',
    tree: {
      parents: [
        { name: 'Leopold Mozart', role: 'Vader · violist', years: '1719–1787', g: 'm' },
        { name: 'Anna Maria Pertl', role: 'Moeder', years: '1720–1778', g: 'f' },
      ],
      siblings: [
        { name: 'Maria Anna "Nannerl"', role: 'Zus · pianiste', years: '1751–1829', g: 'f' },
      ],
      spouses: [
        { name: 'Constanze Weber', role: 'Vrouw · zangeres', years: '1762–1842', g: 'f' },
      ],
      children: [
        { name: 'Karl Thomas Mozart', role: 'Zoon', years: '1784–1858', g: 'm' },
        { name: 'Franz Xaver Mozart', role: 'Zoon · componist', years: '1791–1844', g: 'm' },
      ],
    },
  },
  {
    id: 'beethoven',
    name: 'Ludwig van Beethoven',
    short: 'Beethoven',
    years: '1770 – 1827',
    title: 'De componist die niet opgaf',
    born: '17 december 1770, Bonn (Duitsland)',
    died: '26 maart 1827, Wenen (Oostenrijk)',
    bio: 'Beethoven groeide op in Bonn en verhuisde later naar Wenen. Hij werd steeds slechter horen en was op het laatst helemaal doof. Toch bleef hij componeren: hij hoorde de muziek in zijn hoofd. Zijn negende symfonie, met de "Ode an die Freude", schreef hij toen hij niets meer kon horen.',
    fact: 'Zijn opa kwam uit Mechelen in België. Daarom heet hij "van" Beethoven en niet "von".',
    tree: {
      grandparents: [
        { name: 'Ludwig van Beethoven', role: 'Opa · kapelmeester', years: '1712–1773', g: 'm' },
      ],
      parents: [
        { name: 'Johann van Beethoven', role: 'Vader · zanger', years: '1740–1792', g: 'm' },
        { name: 'Maria Magdalena Keverich', role: 'Moeder', years: '1746–1787', g: 'f' },
      ],
      siblings: [
        { name: 'Kaspar Anton Karl', role: 'Broer', years: '1774–1815', g: 'm' },
        { name: 'Nikolaus Johann', role: 'Broer', years: '1776–1848', g: 'm' },
      ],
      spouses: [],
      children: [
        { name: 'Karl van Beethoven', role: 'Neef · voogdkind', years: '1806–1858', g: 'm' },
      ],
      childrenNote: 'Beethoven trouwde nooit. Hij zorgde voor zijn neefje Karl.',
    },
  },
  {
    id: 'chopin',
    name: 'Frédéric Chopin',
    short: 'Chopin',
    years: '1810 – 1849',
    title: 'Dichter van de piano',
    born: '1 maart 1810, Żelazowa Wola (Polen)',
    died: '17 oktober 1849, Parijs (Frankrijk)',
    bio: 'Chopin werd geboren in Polen en verhuisde later naar Parijs. Hij schreef bijna alleen muziek voor de piano. Zijn muziek klinkt soms als zingen, soms als dansen: walsen, mazurka\'s en nocturnes (nachtmuziek).',
    fact: 'Chopin schreef zijn eerste stukjes toen hij zeven was, en gaf op zijn achtste zijn eerste openbare concert.',
    tree: {
      parents: [
        { name: 'Nicolas Chopin', role: 'Vader · leraar Frans', years: '1771–1844', g: 'm' },
        { name: 'Justyna Krzyżanowska', role: 'Moeder', years: '1782–1861', g: 'f' },
      ],
      siblings: [
        { name: 'Ludwika Chopin', role: 'Zus', years: '1807–1855', g: 'f' },
        { name: 'Izabela Chopin', role: 'Zus', years: '1811–1881', g: 'f' },
        { name: 'Emilia Chopin', role: 'Zus', years: '1812–1827', g: 'f' },
      ],
      spouses: [],
      children: [],
      childrenNote: 'Chopin trouwde nooit en had geen kinderen.',
    },
  },
  {
    id: 'verdi',
    name: 'Giuseppe Verdi',
    short: 'Verdi',
    years: '1813 – 1901',
    title: 'Meester van de opera',
    born: '10 oktober 1813, Le Roncole (Italië)',
    died: '27 januari 1901, Milaan (Italië)',
    bio: 'Verdi kwam uit een klein dorp in Italië, waar zijn ouders een herberg hadden. Hij werd de beroemdste operacomponist van Italië. In zijn opera\'s zingen mensen over liefde, verdriet en vrijheid. Zijn muziek werd zo bekend dat mensen de liedjes op straat zongen.',
    fact: 'Een maand na zijn dood stonden er in Milaan zo\'n 300.000 mensen langs de straat om afscheid te nemen.',
    tree: {
      parents: [
        { name: 'Carlo Verdi', role: 'Vader · herbergier', years: '1785–1867', g: 'm' },
        { name: 'Luigia Uttini', role: 'Moeder · spinster', years: '1787–1851', g: 'f' },
      ],
      siblings: [
        { name: 'Giuseppa Verdi', role: 'Zus', years: '1816–1833', g: 'f' },
      ],
      spouses: [
        { name: 'Margherita Barezzi', role: '1e vrouw', years: '1814–1840', g: 'f' },
        { name: 'Giuseppina Strepponi', role: '2e vrouw · zangeres', years: '1815–1897', g: 'f' },
      ],
      children: [
        { name: 'Virginia', role: 'Dochter', years: '1837–1838', g: 'f' },
        { name: 'Icilio', role: 'Zoon', years: '1838–1839', g: 'm' },
      ],
    },
  },
  {
    id: 'tchaikovsky',
    name: 'Pjotr Iljitsj Tsjaikovski',
    short: 'Tsjaikovski',
    years: '1840 – 1893',
    title: 'Meester van de melodie',
    born: '7 mei 1840, Votkinsk (Rusland)',
    died: '6 november 1893, Sint-Petersburg (Rusland)',
    bio: 'Tsjaikovski werkte eerst als ambtenaar, maar wilde alleen maar muziek maken. Hij werd de beroemdste Russische componist. Hij schreef de muziek voor de balletten Het Zwanenmeer, De Schone Slaapster en De Notenkraker.',
    fact: 'De Notenkraker speelt zich af op kerstavond. Elk jaar wordt het ballet over de hele wereld opgevoerd.',
    tree: {
      parents: [
        { name: 'Ilja Tsjaikovski', role: 'Vader · ingenieur', years: '1795–1880', g: 'm' },
        { name: "Aleksandra d'Assier", role: 'Moeder', years: '1812–1854', g: 'f' },
      ],
      siblings: [
        { name: 'Aleksandra', role: 'Zus', years: '1841–1891', g: 'f' },
        { name: 'Anatoli', role: 'Broer (tweeling)', years: '1850–1915', g: 'm' },
        { name: 'Modest', role: 'Broer (tweeling) · schrijver', years: '1850–1916', g: 'm' },
      ],
      spouses: [
        { name: 'Antonina Miljoekova', role: 'Vrouw', years: '1848–1917', g: 'f' },
      ],
      children: [],
    },
  },
];

// The makers of the game, as oil paintings: they hang on the shop wall and in the gallery close-up.
// `name` goes on the brass plaque; without one the frame has no plaque.
export const TEAM = [1, 2, 3, 4].map(n => ({ id: `team-${n}`, name: '', portrait: `public/art/portraits/team-${n}.webp` }));

const DEMO_PIECES = [
  {
    id: 'kortjakje',
    title: 'Ah, vous dirai-je, Maman',
    subtitle: 'Thema uit KV 265 · bij ons: "Altijd is Kortjakje ziek"',
    composer: 'mozart',
    level: 1,
    time: [2, 4],
    tempo: 96,
    notes: `C4:q C4:q | G4:q G4:q | A4:q A4:q | G4:h | F4:q F4:q | E4:q E4:q | D4:q D4:q | C4:h |
            G4:q G4:q | F4:q F4:q | E4:q E4:q | D4:h | G4:q G4:q | F4:q F4:q | E4:q E4:q | D4:h |
            C4:q C4:q | G4:q G4:q | A4:q A4:q | G4:h | F4:q F4:q | E4:q E4:q | D4:q D4:q | C4:h`,
  },
  {
    id: 'ode',
    title: 'Ode an die Freude',
    subtitle: 'Uit de Negende Symfonie',
    composer: 'beethoven',
    level: 1,
    time: [4, 4],
    tempo: 104,
    notes: `E4:q E4:q F4:q G4:q | G4:q F4:q E4:q D4:q | C4:q C4:q D4:q E4:q | E4:q. D4:8 D4:h |
            E4:q E4:q F4:q G4:q | G4:q F4:q E4:q D4:q | C4:q C4:q D4:q E4:q | D4:q. C4:8 C4:h |
            D4:q D4:q E4:q C4:q | D4:q E4:8 F4:8 E4:q C4:q | D4:q E4:8 F4:8 E4:q D4:q | C4:q D4:q G3:h |
            E4:q E4:q F4:q G4:q | G4:q F4:q E4:q D4:q | C4:q C4:q D4:q E4:q | D4:q. C4:8 C4:h`,
  },
  {
    id: 'menuet',
    title: 'Menuet in G',
    subtitle: 'Uit het muziekboekje voor Anna Magdalena Bach (waarschijnlijk van Christian Petzold)',
    composer: 'bach',
    level: 2,
    time: [3, 4],
    tempo: 112,
    notes: `D5:q G4:8 A4:8 B4:8 C5:8 | D5:q G4:q G4:q | E5:q C5:8 D5:8 E5:8 F#5:8 | G5:q G4:q G4:q |
            C5:q D5:8 C5:8 B4:8 A4:8 | B4:q C5:8 B4:8 A4:8 G4:8 | F#4:q G4:8 A4:8 B4:8 G4:8 | A4:h. |
            D5:q G4:8 A4:8 B4:8 C5:8 | D5:q G4:q G4:q | E5:q C5:8 D5:8 E5:8 F#5:8 | G5:q G4:q G4:q |
            C5:q D5:8 C5:8 B4:8 A4:8 | B4:q C5:8 B4:8 A4:8 G4:8 | A4:q B4:8 A4:8 G4:8 F#4:8 | G4:h.`,
  },
  {
    id: 'nachtmusik',
    title: 'Eine kleine Nachtmusik',
    subtitle: 'Begin van het eerste deel · KV 525',
    composer: 'mozart',
    level: 2,
    time: [4, 4],
    tempo: 120,
    notes: `G4:q r:8 D4:8 G4:q r:8 D4:8 | G4:8 D4:8 G4:8 B4:8 D5:h |
            C5:q r:8 A4:8 C5:q r:8 A4:8 | C5:8 A4:8 F#4:8 A4:8 D4:h`,
  },
  {
    id: 'elise',
    title: 'Für Elise',
    subtitle: 'Het begin · WoO 59',
    composer: 'beethoven',
    level: 3,
    time: [3, 8],
    tempo: 66,
    pickup: 0.5,
    notes: `E5:16 D#5:16 | E5:16 D#5:16 E5:16 B4:16 D5:16 C5:16 | A4:8 r:16 C4:16 E4:16 A4:16 |
            B4:8 r:16 E4:16 G#4:16 B4:16 | C5:8 r:16 E4:16 E5:16 D#5:16 |
            E5:16 D#5:16 E5:16 B4:16 D5:16 C5:16 | A4:8 r:16 C4:16 E4:16 A4:16 |
            B4:8 r:16 E4:16 C5:16 B4:16 | A4:q.`,
  },
];

// The shop's music, in the cabinet and the cylinder chest: the 15 real songs of the SOM collection
// (5 to a shelf). The hand-written demo pieces are the composers' own music, reached from their
// cards in the portrait gallery.
export const PIECES = SOM_PIECES;
export const ALL_PIECES = [...SOM_PIECES, ...DEMO_PIECES];

export const composerById = id => COMPOSERS.find(c => c.id === id);
// Who made a piece, for labels: one of the composers, the composer of a piece from the
// Muziekschatten data (`maker`, see js/catalogue.js), or the makers of a real song (`credit`), who
// have no portrait or story in the game (`id: null`).
export const creditFor = piece => composerById(piece.composer) || piece.maker
  || { id: null, name: piece.credit, short: piece.creditShort || piece.credit, years: '', portrait: NO_PORTRAIT };
export const piecesBy = id => DEMO_PIECES.filter(p => p.composer === id);
// a piece of the game's own, or one from the Muziekschatten data that has been loaded
export const pieceById = id => ALL_PIECES.find(p => p.id === id) || cachedPiece(id);
