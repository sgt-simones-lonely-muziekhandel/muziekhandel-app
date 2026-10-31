"""Bring real sheet music from the SOM collection into the game.

Reads the hand-checked MusicXML scores of the sheet2midi pipeline (tools/sheet2midi/validated/)
and the PDF scans they were made from (tools/sheet2midi/scans/, not in git), and writes:

- js/som-scores.js: one piece per song in the shape of js/data.js, with the vocal melody as the
  game's note string (`notes`), the piano part as timed notes (`accomp`) and a difficulty level
  worked out from the melody (see `difficulty()`). Generated: don't edit.
- public/art/scores/<scan>/page-N.webp: the pages of the original scan, for the sheet-music book.

Usage (needs Pillow and PyMuPDF: pip install pillow pymupdf):

    python scripts/import_scores.py                       # tools/sheet2midi
    python scripts/import_scores.py --source ../sheet2midi  # another copy of the pipeline

Without the PDF of a song its scan pages already in public/art/scores/ are kept.

Which songs, their titles, makers and tempo are in SONGS below: MusicXML from optical music
recognition has no titles and no tempo, so they were read from the scans.
"""

import argparse
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_JS = ROOT / "js" / "som-scores.js"
OUT_ART = ROOT / "public" / "art" / "scores"
SCAN_WIDTH = 1100     # px, wide enough to read on a full-screen book page
SCAN_QUALITY = 72

# `file`: the sheet2midi name (partituur_nl_hvssom_<file>). `cover`: the first scan page is the
# printed cover, so it becomes the book's cover; without one the game draws a cover, with `emblem`
# (an instrument) on it. `tempo`: quarter notes per minute, from the tempo word on the scan.
# A piece out of a songbook names its `movement` (the .mvtN.mxl, or a list of them played one after
# the other) and its scan `pages`. A song Audiveris split over several .mvtN.mxl (one per page or
# section) is read as all of them in order. `melodyFrom: "piano"`: the tune is the top line of the
# piano's right hand (piano solos, and scores whose vocal part OMR got wrong); a score with no vocal
# part at all does this by itself.
SONGS = [
    {"file": "som_populair_n0174", "id": "oogen", "title": "Die Oogen van jou", "subtitle": "Slow-fox",
     "credit": "Wim Kreuer · tekst Arnold Frank", "creditShort": "Wim Kreuer", "tempo": 112, "cover": True},
    {"file": "som_populair_102933_102933", "id": "hazel", "title": "The girl with the hazel brown eyes",
     "subtitle": "Uit de Timbertown Follies", "credit": "Louis Noiret", "creditShort": "Noiret",
     "tempo": 104, "cover": True},
    {"file": "som_populair_155686_155686", "id": "tango", "title": "De tango uit mijn dromen", "subtitle": "Zigeunerlied",
     "credit": "Jack Bess en Tom Rays · tekst Jack Bess", "creditShort": "Bess & Rays", "tempo": 108,
     "cover": False, "emblem": "violin"},
    {"file": "som_populair_158296_158296", "id": "you", "title": "You (You're the cause)", "subtitle": "Slow fox-trot",
     "credit": "Jack Millar", "creditShort": "Millar", "tempo": 116, "cover": True},
    {"file": "som_populair_12_1239", "id": "livre", "title": "Un livre d'images", "subtitle": "Fox-trot",
     "credit": "Emile Deltour · tekst Noël Barcy", "creditShort": "Deltour", "tempo": 120, "cover": True},
]
# The Album voor Mandoline en Viool (Louis Noiret Music Publishing Company, Amsterdam): ten tunes,
# one page each (scan page 2-11), after the album's own cover (page 1).
ALBUM = "som_populair_81323_81323"
ALBUM_TUNES = [
    ("sahara", "In de Sahara", "Moderato", "Louis Noiret · tekst Kees Pruis", "Noiret", 100),
    ("jeannetje", "Tante Jeannetje", "Allegro moderato", "Louis Noiret · tekst Maupie Staal", "Noiret", 120),
    ("treuren", "Waarom treuren", "Tempo di marcia", "Louis Noiret", "Noiret", 150),
    ("moana", "Moana", "Hawaian Waltz", "Luvaun · bewerking Louis Noiret", "Luvaun", 126),
    ("nest", "Het ouwe nest", "Valse lente", "Louis Noiret · tekst Kees Pruis", "Noiret", 126),
    ("pretoria", "Pretoria", "Allegretto", "Oct. van Aerschot · tekst Chef van Dijk", "Van Aerschot", 108),
    ("meisje", "Meisje, waarom wou jij gaan trouwen", "Moderato", "Louis Noiret · tekst Maupie Staal", "Noiret", 100),
    ("offer", "Offer", "Moderato", "Louis Noiret · tekst Kees Pruis", "Noiret", 108),
    ("vrouwtjes", "De mooie vrouwtjes", "Moderato", "Oct. van Aerschot · tekst Chef van Dijk", "Van Aerschot", 100),
    ("noodrem", "De noodrem", "Tempo di marcia", "Louis Noiret · tekst Kees Pruis", "Noiret", 150),
]
SONGS += [
    {"file": ALBUM, "movement": k + 1, "id": tid, "title": title, "subtitle": sub, "credit": credit,
     "creditShort": short, "tempo": tempo, "cover": False, "emblem": "mandolin", "pages": [1, k + 2],
     "series": f"Album voor Mandoline en Viool · No. {k + 1}", "place": "Amsterdam · Holland"}
    for k, (tid, title, sub, credit, short, tempo) in enumerate(ALBUM_TUNES)
]
# More songs from the SOM collection, read from their scans (title page and first page of music).
SONGS += [
    {"file": "som_populair_158304_158304", "id": "waydown", "title": "Way Down South", "subtitle": "Swing fox-trot",
     "credit": "Peter Packay · tekst Jim Mac Kilburn en Glen Powell", "creditShort": "Packay", "tempo": 150, "cover": True},
    {"file": "som_populair_164991_164991", "id": "posthorn", "title": "Posthorn Galop", "subtitle": "Galop",
     "credit": "H. Koenig", "creditShort": "Koenig", "tempo": 120, "cover": True},
    {"file": "som_populair_165010_165010", "id": "horsey", "title": "Oh, my Horsey", "subtitle": "Cowboy-song",
     "credit": "Ar Colijn · tekst Th. C. Warrens", "creditShort": "Colijn", "tempo": 104, "cover": True},
    {"file": "som_populair_165808_165808", "movement": [1], "id": "blacktrain", "title": "Black Train Blues",
     "subtitle": "Bright bounce", "credit": "Peter en Paul Prennessel · tekst Pol Stone", "creditShort": "Prennessel",
     "tempo": 120, "cover": True, "pages": [1, 2, 3]},
    {"file": "som_populair_165808_165808", "movement": [2], "id": "thatgirl", "title": "That Girl of Mine",
     "subtitle": "Medium bounce", "credit": "Jimmy Toren en Jeff De Boeck · tekst Pol Stone",
     "creditShort": "Toren & De Boeck", "tempo": 120, "cover": True, "pages": [1, 5, 6]},
    {"file": "som_populair_166109_166109", "id": "prikkebeen", "title": "Prikkebeen", "subtitle": "Medio tempo",
     "credit": "Bart Ekkers", "creditShort": "Ekkers", "tempo": 112, "cover": True},
    {"file": "som_populair_166117_166117", "movement": [1, 2, 3], "id": "amethyste", "title": "Améthyste",
     "subtitle": "Valse swing", "credit": "Rud Wharton en Pol Stone", "creditShort": "Wharton", "tempo": 160,
     "cover": True, "pages": [1, 2, 3]},
    {"file": "som_populair_166117_166117", "movement": [4, 5], "id": "chocante", "title": "Chocante",
     "subtitle": "Valse portugaise", "credit": "Marcel Azzola en Rud Wharton", "creditShort": "Azzola", "tempo": 160,
     "cover": True, "pages": [1, 5, 6]},
    {"file": "som_populair_166327_166327", "id": "dreamland", "title": "Meet me to-night in Dreamland",
     "subtitle": "Moderato", "credit": "Leo Friedman · tekst Beth Slater Whitson", "creditShort": "Friedman",
     "tempo": 120, "cover": True},
    {"file": "som_populair_167097_167097", "id": "hoeheetje", "title": "Hoe heet je?", "subtitle": "Moderato swing",
     "credit": "Bart Ekkers", "creditShort": "Ekkers", "tempo": 120, "cover": False, "emblem": "mandolin"},
    {"file": "som_populair_168335_168335", "id": "weetje", "title": "Weet je, wat ik zou willen?",
     "subtitle": "Moderato swing", "credit": "Bart Ekkers", "creditShort": "Ekkers", "tempo": 116,
     "cover": False, "emblem": "violin"},
    {"file": "som_populair_168385_168385", "id": "valse", "title": "Valse miniature", "subtitle": "Tempo di valse",
     "credit": "Bart Ekkers · bewerking P. Wijnnobel", "creditShort": "Ekkers", "tempo": 160,
     "cover": False, "emblem": "violin", "melodyFrom": "piano"},
    {"file": "som_populair_171522_171522", "id": "hawaii", "title": "Memory of Hawaii", "subtitle": "Slowly",
     "credit": "Henk Breton · tekst D. Ace", "creditShort": "Breton", "tempo": 88, "cover": True},
    {"file": "som_populair_172981_172981", "id": "hompie", "title": "Hompie-Kurkie", "subtitle": "Samba",
     "credit": "Bart Ekkers, Jack Bess en Pi Scheffer", "creditShort": "Ekkers", "tempo": 112,
     "cover": False, "emblem": "mandolin"},
    {"file": "som_populair_n0216", "id": "voorbij", "title": "Het gaat alles voorbij", "subtitle": "Walslied",
     "credit": "Fred Raymond · tekst Arnold Frank", "creditShort": "Raymond", "tempo": 132, "cover": True},
    {"file": "som_populair_n0231", "id": "patrol", "title": "Flying-Patrol", "subtitle": "Polka de concert",
     "credit": "Mac. A. Parr en Joop de Leur", "creditShort": "Parr & De Leur", "tempo": 112, "cover": True},
    {"file": "som_populair_n0348", "id": "nachtinmei", "title": "In eenen nacht in mei", "subtitle": "Langzaam fox-trot",
     "credit": "Peter Kreuder en Friedrich Schröder · tekst May Dale", "creditShort": "Kreuder", "tempo": 108,
     "cover": True},
    {"file": "som_populair_n0587", "id": "pingping", "title": "Ping Ping Ping", "subtitle": "Citerliedje",
     "credit": "Tom Rays · tekst Jack Bess", "creditShort": "Rays", "tempo": 104, "cover": False, "emblem": "mandolin"},
    {"file": "som_populair_n0641", "id": "senorita", "title": "Señor en Señorita", "subtitle": "Carioca",
     "credit": "Peter Kreuder · tekst Th. C. Warrens", "creditShort": "Kreuder", "tempo": 140, "cover": True},
    {"file": "som_populair_n0748", "id": "cantine", "title": "Uit de Cantine", "subtitle": "Vroolijke marsch-potpourri",
     "credit": "Louis Noiret, Joop de Leur e.a.", "creditShort": "Noiret", "tempo": 116, "cover": True},
    {"file": "som_populair_n0847", "id": "witterozen", "title": "Witte Rozen", "subtitle": "Moderato",
     "credit": "Tummers · tekst E. Paoli", "creditShort": "Tummers", "tempo": 120, "cover": True},
    # an orchestra's set of parts, one page per instrument: the tune is the first violin's (page 4)
    {"file": "somsalon_188031_188031", "movement": [4], "id": "pretending", "title": "Keep Pretending",
     "subtitle": "Moderato con espressione", "credit": "Guy Brain · bewerking Dolf van der Linden",
     "creditShort": "Brain", "tempo": 96, "cover": False, "emblem": "violin", "pages": [4]},
]
LEVELS = 3  # the cabinet has three shelves (★ ★★ ★★★): the songs are ranked into equal thirds

GRID = 24  # time is counted in 24ths of a quarter note: fits 32nds and all triplets used here
# The game's duration tokens (js/music.js), in 24ths of a quarter.
TOKENS = {96: "w", 72: "h.", 48: "h", 36: "q.", 32: "ht", 24: "q", 18: "8.", 16: "qt",
          12: "8", 9: "16.", 8: "8t", 6: "16", 4: "16t", 3: "32"}
STEPS = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def read_mxl(path):
    with zipfile.ZipFile(path) as z:
        container = ET.fromstring(z.read("META-INF/container.xml"))
        inner = next(e.get("full-path") for e in container.iter() if e.tag == "rootfile")
        return ET.fromstring(z.read(inner))


def mvt_number(path):
    m = re.search(r"\.mvt(\d+)\.mxl$", path.name)
    return int(m.group(1)) if m else 0


def load_score(folder, movement=None):
    """The scores to read one after the other: the merged .xml of a song, else its .mxl files
    (all its movements in order, or the ones `movement` names: a number or a list)."""
    xml = sorted(folder.glob("*.xml"))
    if xml and not movement:
        return [ET.parse(xml[0]).getroot()]
    mxl = sorted(folder.glob("*.mxl"), key=mvt_number)
    if movement:
        wanted = movement if isinstance(movement, list) else [movement]
        mxl = [f for f in mxl if mvt_number(f) in wanted]
        if len(mxl) != len(wanted):
            raise RuntimeError(f"{folder.name}: movements {wanted} not all there")
    if not mxl:
        raise RuntimeError(f"{folder.name}: no .xml or .mxl")
    return [read_mxl(f) for f in mxl]


def midi_of(note):
    p = note.find("pitch")
    alter = round(float(p.findtext("alter") or 0))
    return 12 * (int(p.findtext("octave")) + 1) + STEPS[p.findtext("step")] + alter, p.findtext("step"), alter


def pitch_token(midi, step, alter):
    """C4, F#4, Bb3; double sharps/flats and odd spellings become plain sharps."""
    if alter in (-1, 0, 1):
        return f"{step}{'#' if alter == 1 else 'b' if alter == -1 else ''}{(midi - alter - STEPS[step]) // 12 - 1}"
    return f"{SHARP_NAMES[midi % 12]}{midi // 12 - 1}"


def read_part(part, divisions=1, time=None):
    """Every measure of a part as a list of events with onsets, in GRID units from the bar line."""
    measures = []
    for m in part.findall("measure"):
        attrs = m.find("attributes")
        if attrs is not None:
            divisions = int(attrs.findtext("divisions") or divisions)
            t = attrs.find("time")
            if t is not None and t.findtext("beats"):
                try:
                    time = (int(t.findtext("beats")), int(t.findtext("beat-type")))
                except ValueError:
                    pass
        g = lambda d: Fraction(int(d) * GRID, divisions)
        cursor = last_onset = Fraction(0)
        length = Fraction(0)
        events = []
        for el in m:
            if el.tag == "backup":
                cursor -= g(el.findtext("duration"))
            elif el.tag == "forward":
                cursor += g(el.findtext("duration"))
            elif el.tag == "note":
                if el.find("grace") is not None or el.find("cue") is not None:
                    continue
                dur = g(el.findtext("duration") or 0)
                chord = el.find("chord") is not None
                onset = last_onset if chord else cursor
                if not chord:
                    last_onset = cursor
                    cursor += dur
                ev = {"onset": onset, "dur": dur, "voice": el.findtext("voice") or "1",
                      "staff": el.findtext("staff") or "1",
                      "rest": el.find("rest") is not None,
                      "tie_start": any(t.get("type") == "start" for t in el.findall("tie")),
                      "tie_stop": any(t.get("type") == "stop" for t in el.findall("tie"))}
                if not ev["rest"]:
                    ev["midi"], ev["step"], ev["alter"] = midi_of(el)
                events.append(ev)
            length = max(length, cursor)
        measures.append({"events": events, "length": length, "time": time,
                         "implicit": m.get("implicit") == "yes"})
    return measures


def split_duration(d):
    """Write a duration (GRID units) as few game tokens as possible, longest first."""
    d = int(d)
    best = {0: []}
    for x in range(1, d + 1):
        options = [best[x - v] + [v] for v in TOKENS if v <= x and (x - v) in best]
        if options:
            best[x] = min(options, key=len)
    if d not in best:
        raise ValueError(f"duration {d}/{GRID} can't be written")
    return sorted(best[d], reverse=True)


def melody_measure(parts, i, length):
    """The vocal line of measure i: the first vocal part that sings there, its first voice,
    the top note of chords. Gaps become rests, notes past the bar line are cut."""
    for part in parts:
        if i >= len(part):
            continue
        sung = [e for e in part[i]["events"] if not e["rest"]]
        if not sung:
            continue
        voice = min(e["voice"] for e in sung)
        notes = {}
        for e in part[i]["events"]:
            if e["voice"] != voice or e["rest"]:
                continue
            top = notes.get(e["onset"])
            if top is None or e["midi"] > top["midi"]:
                notes[e["onset"]] = e
        out, pos = [], Fraction(0)
        for onset in sorted(notes):
            e = notes[onset]
            if onset < pos or onset >= length:
                continue                      # overlaps the note before (OMR) or past the bar
            if onset > pos:
                out.append({"rest": True, "dur": onset - pos})
            dur = min(e["dur"], length - onset)
            out.append({**e, "dur": dur})
            pos = onset + dur
        if pos < length:
            out.append({"rest": True, "dur": length - pos})
        return out
    return [{"rest": True, "dur": length}]


def tokens_for(measure_notes, warnings, where):
    """Turn a measure into tokens, splitting odd durations into tied notes (or several rests)."""
    out = []
    for n in measure_notes:
        if n["dur"] % 1:
            warnings.append(f"{where}: rounded a duration of {float(n['dur']) / GRID:.3f} beats")
        pieces = split_duration(round(n["dur"]))
        if n["rest"]:
            out += [f"r:{TOKENS[p]}" for p in pieces]
        else:
            name = pitch_token(n["midi"], n["step"], n["alter"])
            for k, p in enumerate(pieces):
                tie = k < len(pieces) - 1 or n.get("tie_start")
                out.append(f"{name}:{TOKENS[p]}{'~' if tie else ''}")
    return out


def accompaniment(parts, starts):
    """All notes of the piano part(s) as [onset, duration, midi], in GRID units from the start."""
    notes = []
    for part in parts:
        open_ties = {}
        for i, m in enumerate(part):
            if i >= len(starts):
                break
            for e in m["events"]:
                if e["rest"] or e["dur"] <= 0:
                    continue
                t = starts[i] + e["onset"]
                key = e["midi"]
                tied = open_ties.get(key)
                if e["tie_stop"] and tied is not None and tied[0] + tied[1] == t:
                    tied[1] += e["dur"]           # a tied note just sounds on
                    if not e["tie_start"]:
                        open_ties.pop(key)
                    continue
                n = [t, e["dur"], key]
                notes.append(n)
                if e["tie_start"]:
                    open_ties[key] = n
    notes.sort(key=lambda n: (n[0], n[2]))
    return [[int(t), int(min(d, 8 * GRID)), m] for t, d, m in notes]


def read_scores(roots):
    """The vocal and the piano parts of one or more scores, played one after the other: the n-th
    vocal (piano) part of each score follows on the n-th of the one before; a score with fewer
    parts leaves the others silent for its bars. Divisions and time signature carry over."""
    empty = lambda: {"events": [], "length": Fraction(0), "time": None, "implicit": False}
    vocal, piano = [], []
    divisions, time, done = 1, None, 0
    for root in roots:
        names = {sp.get("id"): (sp.findtext("part-name") or "") for sp in root.iter("score-part")}
        got = ([], [])
        for p in root.findall("part"):
            got["piano" in names[p.get("id")].lower()].append(read_part(p, divisions, time))
        bars = max(len(m) for g in got for m in g)
        for into, new in zip((vocal, piano), got):
            while len(into) < len(new):
                into.append([empty() for _ in range(done)])
            for k, part in enumerate(into):
                more = new[k] if k < len(new) else []
                part += more + [empty() for _ in range(bars - len(more))]
        done += bars
        # what the next score starts from
        for m in root.iter("measure"):
            if m.findtext("attributes/divisions"):
                divisions = int(m.findtext("attributes/divisions"))
            try:
                time = (int(m.findtext("attributes/time/beats")), int(m.findtext("attributes/time/beat-type")))
            except (TypeError, ValueError):
                pass
    return vocal, piano


def right_hand(part):
    """The top staff of a piano part: what the right hand plays."""
    return [{**m, "events": [e for e in m["events"] if e["staff"] == "1"]} for m in part]


def convert(song, folder):
    vocal, piano = read_scores(load_score(folder, song.get("movement")))
    parts = {k: p for k, p in enumerate(vocal + piano)}
    from_piano = song.get("melodyFrom") == "piano" or not any(e for p in vocal for m in p for e in m["events"])
    if from_piano:
        if not piano:
            raise RuntimeError("no vocal part and no piano part")
        vocal = [right_hand(p) for p in piano]
    warnings = ["the melody is the piano's right hand"] if from_piano else []

    # one time signature for the whole song; OMR sometimes misses it, then the usual bar length decides
    times = Counter(m["time"] for p in parts.values() for m in p if m["time"])
    if times:
        time = times.most_common(1)[0][0]
        if len(times) > 1:
            warnings.append(f"several time signatures {dict(times)}, using {time}")
    else:
        bar = Counter(m["length"] for p in parts.values() for m in p if m["length"]).most_common(1)[0][0]
        time = {96: (4, 4), 72: (3, 4), 48: (2, 4), 36: (6, 8)}.get(int(bar), (4, 4))
        warnings.append(f"no time signature, the bars say {time[0]}/{time[1]}")
    bar_len = Fraction(time[0] * 4 * GRID, time[1])

    count = max(len(p) for p in parts.values())
    # a short first bar (an upbeat) keeps its length, every other bar is a full one
    first = max((p[0]["length"] for p in parts.values() if p), default=bar_len)
    lengths = [first if 0 < first < bar_len else bar_len] + [bar_len] * (count - 1)
    starts, t = [], Fraction(0)
    for L in lengths:
        starts.append(t)
        t += L

    melody = [melody_measure(vocal, i, lengths[i]) for i in range(count)]
    sings = [any(not n["rest"] for n in m) for m in melody]
    if not any(sings):
        raise RuntimeError("the vocal part is empty")
    a, b = sings.index(True), len(sings) - 1 - sings[::-1].index(True)
    # the piano intro and outro are only heard, not written in the book
    bars = [tokens_for(melody[i], warnings, f"bar {i + 1}") for i in range(a, b + 1)]
    accomp = accompaniment(piano, starts)
    if from_piano:
        # the tune is played as the melody: leave it out of the accompaniment, or it sounds twice
        tune = {(int(starts[i] + n["onset"]), n["midi"]) for i in range(count) for n in melody[i] if not n["rest"]}
        accomp = [n for n in accomp if (n[0], n[2]) not in tune]
    piece = {
        "id": f"som-{song['id']}", "title": song["title"], "subtitle": song["subtitle"],
        "composer": None, "credit": song["credit"], "creditShort": song["creditShort"],
        "level": None, "time": list(time), "tempo": song["tempo"],
        "notes": " | ".join(" ".join(m) for m in bars),
        # without a piano part there is no introduction to wait for
        "introBeats": float(starts[a] / GRID) if accomp else 0.0,
        "accompGrid": GRID,
        "accomp": accomp,
        "source": f"SOM · partituur_nl_hvssom_{song['file']}"
                  + (f" · {'+'.join(map(str, song['movement'])) if isinstance(song['movement'], list) else song['movement']}"
                     if song.get("movement") else ""),
    }
    for key in ("emblem", "series", "place"):
        if song.get(key):
            piece[key] = song[key]
    piece["_melody"] = [n for m in melody[a:b + 1] for n in m]
    if a == 0 and lengths[0] < bar_len:
        piece["pickup"] = float(lengths[0] / GRID)
    sung = sum(1 for m in melody[a:b + 1] for n in m if not n["rest"])
    return piece, sung, warnings


def difficulty(piece):
    """How hard the melody is to play, as a few measures from the notes (higher is harder):
    the range, black keys, short and odd note values (dotted, triplets), big leaps, how many notes
    a second there are at the song's tempo, and how long it is."""
    sung = [n for n in piece["_melody"] if not n["rest"]]
    midis = [n["midi"] for n in sung]
    beats = sum(n["dur"] for n in piece["_melody"]) / GRID
    leaps = [abs(b - a) for a, b in zip(midis, midis[1:])]
    durs = [int(round(n["dur"])) for n in sung]
    return {
        "range": max(midis) - min(midis),
        "black": sum(m % 12 in (1, 3, 6, 8, 10) for m in midis) / len(midis),
        "short": sum(d < 12 for d in durs) / len(durs),
        "odd": sum(d not in (96, 48, 24, 12) for d in durs) / len(durs),
        "leaps": sum(leaps) / max(1, len(leaps)),
        "speed": len(sung) / (float(beats) * 60 / piece["tempo"]),
        "length": len(sung),
    }


def assign_levels(pieces):
    """Rank the songs by difficulty (each measure counted against the others, as a z-score) and
    give each level an equal share: the cabinet holds five songs per shelf."""
    stats = [difficulty(p) for p in pieces]
    scores = [0.0] * len(pieces)
    for key in stats[0]:
        values = [s[key] for s in stats]
        mean = sum(values) / len(values)
        spread = (sum((v - mean) ** 2 for v in values) / len(values)) ** 0.5 or 1
        for i, v in enumerate(values):
            scores[i] += (v - mean) / spread
    order = sorted(range(len(pieces)), key=lambda i: scores[i])
    per = -(-len(pieces) // LEVELS)
    for rank, i in enumerate(order):
        pieces[i]["level"] = rank // per + 1
    return stats, scores


def render_scans(pdf, out_dir):
    """Every page of a PDF as page-N.webp."""
    import pymupdf
    from PIL import Image
    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob("page-*.webp"):
        old.unlink()
    doc = pymupdf.open(pdf)
    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=200)
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        img = img.resize((SCAN_WIDTH, round(pix.height * SCAN_WIDTH / pix.width)), Image.LANCZOS)
        img.save(out_dir / f"page-{i + 1}.webp", quality=SCAN_QUALITY, method=6)
    return doc.page_count


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source", type=Path, default=ROOT / "tools" / "sheet2midi",
                        help="the sheet2midi pipeline (default: tools/sheet2midi)")
    parser.add_argument("--no-scans", action="store_true", help="skip rendering the PDF pages")
    args = parser.parse_args()
    if not (args.source / "validated").is_dir():
        sys.exit(f"No validated/ folder in {args.source}")

    pieces = []
    rendered = {}  # scan folder → its number of pages (a songbook's PDF is rendered once)
    for song in SONGS:
        name = f"partituur_nl_hvssom_{song['file']}"
        piece, sung, warnings = convert(song, args.source / "validated" / name)
        # a song has its own scan folder, the tunes of a songbook share the book's
        folder = f"som-{song['id']}" if not song.get("movement") else f"som-{song['file'].split('_')[-1]}"
        art = OUT_ART / folder
        pdf = args.source / "scans" / f"{name}.pdf"
        if folder not in rendered:
            if args.no_scans or not pdf.exists():
                rendered[folder] = len(list(art.glob("page-*.webp")))
                if not args.no_scans:
                    print(f"  (no {pdf.name}: keeping the {rendered[folder]} scan pages there are)")
            else:
                rendered[folder] = render_scans(pdf, art)
        pages = song.get("pages") or list(range(1, rendered[folder] + 1))
        missing = [k for k in pages if k > rendered[folder]]
        if missing:
            raise RuntimeError(f"{piece['id']}: scan pages {missing} missing in {art}")
        piece["scans"] = {"dir": f"public/art/scores/{folder}/", "pages": pages, "cover": song["cover"]}
        pieces.append(piece)
        print(f"{piece['id']}: {sung} sung notes, {len(piece['accomp'])} piano notes, {len(pages)} scan pages"
              f"{', intro ' + str(piece['introBeats']) + ' beats' if piece['introBeats'] else ''}")
        for w in warnings[:5]:
            print(f"  ! {w}")
        if len(warnings) > 5:
            print(f"  ! …and {len(warnings) - 5} more")

    # a scan's pages no piece shows (another instrument's part, an advertisement) are not kept
    used = {}
    for piece in pieces:
        used.setdefault(piece["scans"]["dir"], set()).update(piece["scans"]["pages"])
    for folder, pages in used.items():
        for f in (ROOT / folder).glob("page-*.webp"):
            if int(f.stem.split("-")[1]) not in pages:
                f.unlink()

    stats, scores = assign_levels(pieces)
    print("\nDifficulty (range in semitones, shares of black keys / short / odd values, mean leap,")
    print("notes a second, length) → level:")
    for p, st, sc in sorted(zip(pieces, stats, scores), key=lambda x: x[2]):
        print(f"  {p['id']:<14} {st['range']:>3} {st['black']:.2f} {st['short']:.2f} {st['odd']:.2f}"
              f" {st['leaps']:4.1f} {st['speed']:4.1f} {st['length']:>4}  {sc:+5.1f} → {'★' * p['level']}")
    for p in pieces:
        del p["_melody"]

    body = ",\n".join("  " + json.dumps(p, ensure_ascii=False, separators=(",", ":")) for p in pieces)
    OUT_JS.write_text(
        "// Real sheet music from the SOM collection, made by scripts/import_scores.py from the\n"
        "// hand-checked scores of tools/sheet2midi. Generated: change the script and run it again.\n"
        f"export const SOM_PIECES = [\n{body},\n];\n", encoding="utf-8")
    print(f"Wrote {OUT_JS.relative_to(ROOT)} ({OUT_JS.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
