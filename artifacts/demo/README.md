# AzenoHI — 60-second product demo

The final deliverable is `azenohi-demo.mp4`: exactly **60 seconds**, with Home
shown only during **00:00–00:10**, at **1920 × 1080 / 30 FPS**, H.264, and strictly
less than **100,000,000 bytes**. These latest user requirements supersede the
original request to show complete long rotation cycles. There is no audio.

Open on Ubuntu:

```bash
xdg-open /home/lipov/projects/azeno_hi/artifacts/demo/azenohi-demo.mp4
```

Regenerate from the repository root with one command:

```bash
bash artifacts/demo/scripts/run.sh
```

To rebuild the 60-second edit from the retained successful local capture:

```bash
bash artifacts/demo/scripts/run.sh --render-only
```

The runner installs the locked frontend development dependencies, runs the
existing frontend checks, builds the production app, starts an isolated preview
and virtual screen, records real interactions, edits the film and verifies it.
It cleans up its own server and display. It does not commit, push or publish.

## Scenario and output

| Time | Content |
| --- | --- |
| 0–10 s | Original Home animation, no input or captions |
| 10–16 s | Team |
| 16–24 s | All six project cards and navigation into CapTrace |
| 24–31 s | CapTrace overview and return link |
| 31–52.5 s | Open Risk Miner, show its details, scroll, and return |
| 52.5–60 s | Journey |

The recording begins before navigation. The edit starts at initial live-scene
readiness and preserves original animation speed. Direct cuts remove idle time;
no section is accelerated. English captions use the existing Inter font and
application colors. There is no separate intro card, watermark, music or voice.

The source is captured at 60 FPS. Final delivery keeps exactly every other source
frame at 30 FPS and unchanged speed. A 60 FPS candidate was rejected because
asynchronous X11 presentation/sampling produced intermittent repeated frames.
The final opening is checked against actual pixel changes at 30 FPS. No motion
interpolation or artificial 60 FPS upconversion is used.

Final encoding uses libx264, CRF 17, a 10 Mbit/s maximum rate and a 20 Mbit buffer.
The verification script requires exactly 1,800 frames, exactly 60 seconds, a
300-frame Home segment and a file below 100,000,000 bytes. Six embedded chapters
and fast-start metadata support convenient playback.

The portfolio has no backend, forms, authentication or functional project
analytics. Risk Miner panels remain explicitly labelled concepts. All six cards
are visible, while CapTrace and Risk Miner demonstrate the two detail-page types.
Pause/resume is checked in source footage but omitted from the final ten-second
Home excerpt. Mobile navigation is covered by the existing browser tests.

## Environment

Validated on Ubuntu x86-64 with NVIDIA RTX 4000 Ada, working NVIDIA Vulkan and
NVENC. A private Xvfb screen and X11 window manager isolate the capture from the
user's desktop and browser profile. Xdotool moves the real cursor using eased
paths; FFmpeg captures it. No UI styles or cursor elements are injected.

- Node uses the exact version in `.nvmrc`. The runner reuses the local installation
  or downloads the matching version into the ignored work directory.
- Frontend dependencies and Playwright Chromium use the existing lockfile.
- FFmpeg, ffprobe, Xvfb, Xdotool and Openbox are extracted from Ubuntu packages
  into `.work/tools/root`, without root privileges or system package changes.
- `uv`, `curl`, `apt-get`, `dpkg-deb`, Python 3.12 and standard Ubuntu shared
  libraries are prerequisites. Pinned Python tools live in `.work/tools/python`.
- Port 4176 must be free. The runner refuses to reuse another process's server.
  It chooses an unused X display starting at `:98`.
- Allow a few minutes and at least 4 GB of working space. The retained earlier
  long raw take is larger; it is ignored by Git and is not the deliverable.
- This tested capture configuration requires NVIDIA hardware. Other Ubuntu
  releases may require different FFmpeg shared-library package names.

## Artifacts

| Path | Purpose |
| --- | --- |
| `azenohi-demo.mp4` | Approved final 60-second MP4, included in Git |
| `scenario.md` | Final shot order and exact timings |
| `recording-report.md` | Measurements, quality results and limitations |
| `scripts/run.sh` | One-command bootstrap and complete workflow |
| `scripts/record.mjs` | Playwright interaction, X11 capture and timing observations |
| `scripts/render.py` | Six-shot edit, captions, chapters and size-limited H.264 encoding |
| `scripts/verify.py` | Exact duration/size checks, full decode, motion analysis and frame exports |
| `scripts/playback.mjs` | Browser playback and seek checks at beginning, middle and end |
| `scripts/requirements.txt` | Isolated Python dependencies |
| `screenshots/` | Browser captures and `video-*` frames from the final film |
| `qa/` | Check logs, ffprobe, verification data, file inventory and visual review |
| `.work/` | Ignored tools, source footage, temporary takes and editing metadata |

For a rehearsal that keeps the deliverable untouched:

```bash
bash artifacts/demo/scripts/run.sh --rehearsal
```

It produces the same 60-second scenario under `.work/rehearsal.mp4`.
After app/layout changes, inspect the final frames and captions and record the
new MP4 checksum in `qa/visual-review.md`. Automated verification regenerates
`scenario.md`, `recording-report.md`, technical JSON and review frames; manual
visual review is separate.

Existing frontend quality gates are unchanged. The initial full browser suite
used the matching local preview at port 4173. To repeat it separately, stop any
service on 4173 and use the project's normal command:

```bash
npm --prefix web run test:e2e
```

The owner authorized uploading the final film and making the GitHub repository
public on 2026-11-25. The final MP4 is explicitly allowed in Git; raw takes and
temporary files remain ignored. The root README links to the approved film.
Production code/dependencies, architecture, source images and generated masters
are unchanged. Existing content-review items remain open; making the repository
public does not independently verify those claims or assign new asset licenses.
