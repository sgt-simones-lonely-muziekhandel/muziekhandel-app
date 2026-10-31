# sheet2midi

The pipeline that turns PDF scans of sheet music from the SOM collection into songs in the game. It
comes from the separate [sheet2midi](https://github.com/sgt-simones-lonely-muziekhandel/sheet2midi)
repo (`convert.py`, `merge.py`); here it lives next to the game so one checkout can do every step.

```
scans/*.pdf ──convert.py──▶ output/<song>/*.mxl ──merge.py──▶ output/<song>/<song>.xml
   ──check by hand, copy the folder──▶ validated/<song>/ ──scripts/import_scores.py──▶ the game
```

Despite the name the result is MusicXML, not MIDI.

## What is in git

| Folder | In git | What |
|---|---|---|
| `scans/` | no (~700 MB) | The PDF scans, `partituur_nl_hvssom_<file>.pdf`. Copy them from the sheet2midi repo or download them from the SOM collection. |
| `output/` | no | Raw Audiveris output: `.mxl` per movement, the merged `.xml`, its project (`.omr`) and logs. |
| `validated/` | yes (`.xml` / `.mxl` only) | Scores checked by hand against the scan. Only these go into the game. |

## Setup

Python 3, and for `convert.py` [Audiveris](https://github.com/Audiveris/audiveris) 5.11 (needs Java 25+).

- Windows: `winget install --id audiveris.org.Audiveris --exact`
- macOS / Linux: the installer from the Audiveris releases page.

`convert.py` finds Audiveris on its own (the `AUDIVERIS` environment variable, the PATH, or the
usual install folder on Windows, macOS and Linux); otherwise pass `--audiveris <path>`.
Running the game doesn't need any of this.

## Steps

From the project root:

```sh
python3 tools/sheet2midi/convert.py                                  # every PDF in scans/ not converted yet
python3 tools/sheet2midi/convert.py tools/sheet2midi/scans/<file>.pdf  # one PDF
python3 tools/sheet2midi/merge.py                                    # join each song's .mxl files into one .xml
```

1. **Convert**: each PDF gets a folder in `output/`. Audiveris can take minutes per page. A score
   with several movements gives one `.mvtN.mxl` each. Covers and adverts (pages without staves) are skipped.
2. **Merge**: joins a song's `.mxl` files, in page order, into `output/<song>/<song>.xml`, padding
   missing parts with rests. Sets of instrument parts and songbooks stay separate (`KEEP_SEPARATE`
   in `merge.py`).
3. **Check**: open the `.xml` in MuseScore next to the scan and fix the recognition errors. Then copy
   the folder (its `.xml` / `.mxl`) to `validated/`.
4. **Import**: add the song to `SONGS` in `scripts/import_scores.py` (title, makers, level, tempo,
   cover) and run `python3 scripts/import_scores.py` (needs `pip install pillow pymupdf`). See
   [real sheet music](../../docs/features/som-scores.md).

When the sheet2midi repo gets new validated scores, copy their `.xml` / `.mxl` here, or point the
import at it: `python3 scripts/import_scores.py --source ../sheet2midi`.
