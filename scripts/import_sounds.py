"""Turn the recorded sound effects in design/sounds into the game's files in public/audio.

    python scripts/import_sounds.py ../design/sounds

Sources (both CC0, free to use without credit):
- kenney-impact/: footsteps from Kenney's Impact Sounds (https://kenney.nl/assets/impact-sounds)
- bigsoundbank/: wind, two chimes, rain and thunder from BigSoundBank (https://bigsoundbank.com)

Everything is written as AAC (.m4a), which every browser plays. Needs numpy and soundfile
(pip install soundfile) and macOS's afconvert for decoding mp3 and encoding AAC.
"""
import os
import subprocess
import sys
import tempfile

import numpy as np
import soundfile as sf

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public', 'audio')

# footstep files per ground in the game (see js/sfx.js): cobbles, the shop's wooden floor, the
# flooded future (grass, played lower, sounds like a soft squish)
STEPS = {'stone': 'concrete', 'wood': 'wood', 'wet': 'grass'}


def read(path):
    """Mono float samples and the sample rate; mp3 goes through afconvert first."""
    if path.endswith('.mp3'):
        with tempfile.TemporaryDirectory() as tmp:
            wav = os.path.join(tmp, 'in.wav')
            subprocess.run(['afconvert', '-f', 'WAVE', '-d', 'LEI16', path, wav], check=True)
            x, sr = sf.read(wav)
    else:
        x, sr = sf.read(path)
    return (x.mean(axis=1) if x.ndim > 1 else x), sr


def write(x, sr, name):
    path = os.path.join(OUT, name + '.m4a')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, 'out.wav')
        sf.write(wav, np.clip(x, -1, 1), sr, subtype='PCM_16')
        subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '96000', wav, path], check=True)
    print(f'ok  audio/{name}.m4a  {len(x) / sr:.2f} s')


def fade(x, sr, start, end):
    """Fade in over `start` seconds and out over `end` seconds, with soft (cosine) edges."""
    x = x.copy()
    a, b = int(start * sr), int(end * sr)
    if a: x[:a] *= 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, a))
    if b: x[-b:] *= 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, b))
    return x


def main(src):
    for ground, kind in STEPS.items():
        for i in range(5):
            x, sr = read(os.path.join(src, 'kenney-impact', f'footstep_{kind}_00{i}.ogg'))
            write(fade(x, sr, 0, 0.03), sr, f'steps/{ground}-{i}')

    # the time travel: one gust of wind, 2.5 s, cut from the loudest part of a long storm recording
    # and shaped to swell up and die away
    x, sr = read(os.path.join(src, 'bigsoundbank', 'strong-wind-2 (0152).mp3'))
    n, hop = int(2.5 * sr), int(0.1 * sr)
    loud = [np.sqrt((x[i:i + n] ** 2).mean()) for i in range(0, len(x) - n, hop)]
    i = int(np.argmax(loud)) * hop
    gust = x[i:i + n] * np.sin(np.linspace(0, np.pi, n)) ** 1.5
    write(gust / np.abs(gust).max() * 0.9, sr, 'time-travel/gust')

    # and a little chime in it, 2.2 s
    x, sr = read(os.path.join(src, 'bigsoundbank', 'chimes-butterfly-1 (2087).mp3'))
    write(fade(x[:int(2.2 * sr)], sr, 0.01, 0.7), sr, 'time-travel/chime')

    # the sparkle as the lid comes off the tube and the light pours out: a brighter chime, 2.3 s
    x, sr = read(os.path.join(src, 'bigsoundbank', 'chimes-dream-1 (2079).mp3'))
    write(fade(x[:int(2.3 * sr)], sr, 0.01, 0.8), sr, 'time-travel/sparkle')

    # gentle rain pattering on an umbrella (warmer and with more separate drops than rain on
    # puddles, which sounded like a stream), as a 20 s loop from the steady middle: the 1.5 s
    # after the cut are blended into its start, so it repeats without a seam
    x, sr = read(os.path.join(src, 'bigsoundbank', 'rain-under-an-umbrella (2679).mp3'))
    n, c, a = int(20 * sr), int(1.5 * sr), int(5 * sr)
    loop = x[a:a + n].copy()
    k = np.linspace(0, np.pi / 2, c)
    loop[:c] = loop[:c] * np.sin(k) + x[a + n:a + n + c] * np.cos(k)
    write(loop, sr, 'weather/rain')

    # distant thunder, three different rumbles, with their tails faded out
    for i, (name, length, tail) in enumerate([('thunder-2 (3113)', 5.1, 0.6), ('thunder-3 (3114)', 10, 2.5), ('thunder-7 (3180)', 11, 3)]):
        x, sr = read(os.path.join(src, 'bigsoundbank', name + '.mp3'))
        write(fade(x[:int(length * sr)], sr, 0.05, tail), sr, f'weather/thunder-{i}')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '../design/sounds')
