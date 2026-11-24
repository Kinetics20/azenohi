"""Verify the current 60-second / ten-second-Home / sub-100-MB delivery contract."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]
DEMO = ROOT / 'artifacts/demo'
WORK = DEMO / '.work'
REHEARSAL = '--rehearsal' in sys.argv
NAME = 'rehearsal' if REHEARSAL else 'capture'
QA = WORK / 'rehearsal-qa' if REHEARSAL else DEMO / 'qa'
SHOTS = WORK / 'rehearsal-frames' if REHEARSAL else DEMO / 'screenshots'
QA.mkdir(exist_ok=True)
SHOTS.mkdir(exist_ok=True)
FFMPEG = os.environ.get('FFMPEG', 'ffmpeg')
FFPROBE = os.environ.get('FFPROBE', 'ffprobe')
manifest = json.loads((WORK / f'{NAME}.json').read_text())
edit = json.loads((WORK / f'{NAME}-edit.json').read_text())
video = Path(edit['output'])

def command(args):
    return subprocess.run(args, check=True, capture_output=True).stdout

probe = json.loads(command([FFPROBE, '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-show_chapters', '-of', 'json', str(video)]))
(QA / 'ffprobe.json').write_text(json.dumps(probe, indent=2))
stream = next(item for item in probe['streams'] if item['codec_type'] == 'video')
assert (stream['width'], stream['height']) == (1920, 1080)
assert stream['codec_name'] == 'h264'
assert stream['avg_frame_rate'] == '30/1' and stream['r_frame_rate'] == '30/1'
assert stream['pix_fmt'] == 'yuv420p'
assert not any(item['codec_type'] == 'audio' for item in probe['streams'])
assert abs(float(stream['duration']) - 60) < .001
assert int(stream['nb_read_frames']) == 1800
assert video.stat().st_size < 100_000_000
assert edit['homeDuration'] == 10 and edit['segments'][0]['frames'] == 300
assert not manifest['intro']['input'] and not manifest['intro']['visibility']
assert not manifest['viewport']['reducedMotion']
assert not manifest['errors'] and not manifest['failedRequests'] and not manifest['externalRequests']
assert all(item['start'] >= 10 for item in edit['captions'])

print('Decoding all 1800 frames...', flush=True)
decode = subprocess.run([FFMPEG, '-hide_banner', '-nostats', '-xerror', '-i', str(video), '-an', '-vf', 'scale=320:180,blackdetect=d=0.033:pix_th=0.02:pic_th=0.98', '-f', 'null', '-'], capture_output=True, text=True)
(QA / 'full-decode.log').write_text(decode.stderr)
assert decode.returncode == 0
assert 'black_start:' not in decode.stderr

pixels = command([FFMPEG, '-v', 'error', '-ss', '0.3', '-i', str(video), '-t', '9.4', '-vf', 'crop=480:340:1420:120,scale=240:170', '-fps_mode', 'passthrough', '-pix_fmt', 'gray', '-f', 'rawvideo', '-'])
frames = np.frombuffer(pixels, dtype=np.uint8).reshape((-1, 170, 240))
deltas = np.abs(np.diff(frames.astype(np.int16), axis=0)).mean(axis=(1, 2))
changed = deltas > .03
cadence = {'frames': len(frames), 'changedPairs': int(changed.sum()), 'pairs': len(changed), 'changedFraction': float(changed.mean()), 'minimumPixelDelta': float(deltas.min()), 'meanPixelDelta': float(deltas.mean())}
assert cadence['changedFraction'] > .99, 'Opening does not contain distinct motion frames at the delivery cadence'

# These are this task's prior derived review frames, never source artwork.
for filename in SHOTS.glob('video-*.png'):
    filename.unlink()
samples = [('opening', 0), ('home-motion', 5), ('home-last-frame', 10 - 1 / 30), ('team-first-frame', 10), ('team', 13), ('projects', 19), ('captrace', 26), ('risk-miner-entry', 32), ('risk-miner', 36), ('risk-miner-details', 45), ('return-to-projects', 51.5), ('journey', 55), ('ending', 60 - 1 / 30)]
tiles = []
for name, second in samples:
    filename = SHOTS / f'video-{name}.png'
    command([FFMPEG, '-v', 'error', '-y', '-ss', str(max(0, second)), '-i', str(video), '-frames:v', '1', str(filename)])
    frame = Image.open(filename).convert('RGB')
    assert frame.size == (1920, 1080)
    if name in ('opening', 'ending'):
        roi = np.array(frame)[25:85, 95:170]
        assert np.count_nonzero((roi[:, :, 0] > 160) & (roi[:, :, 1] < 100)) > 100
    frame.thumbnail((480, 270))
    tile = Image.new('RGB', (480, 300), '#070d19')
    tile.paste(frame, (0, 0))
    ImageDraw.Draw(tile).text((12, 280), f'{second:.3f}s | {name}', fill='white')
    tiles.append(tile)
sheet = Image.new('RGB', (1440, 300 * ((len(tiles) + 2) // 3)), '#070d19')
for i, tile in enumerate(tiles):
    sheet.paste(tile, (i % 3 * 480, i // 3 * 300))
sheet.save(SHOTS / 'verification-contact-sheet.jpg', quality=94)
with video.open('rb') as source:
    digest = hashlib.file_digest(source, 'sha256').hexdigest()
result = {'file': str(video), 'sha256': digest, 'bytes': video.stat().st_size, 'duration': 60, 'homeDuration': 10, 'frames': 1800, 'fps': 30, 'resolution': '1920x1080', 'codec': stream['codec_name'], 'profile': stream['profile'], 'pixelFormat': stream['pix_fmt'], 'audioStreams': 0, 'completeDecode': True, 'blackIntervals': 0, 'openingCadence': cadence, 'edit': edit, 'consoleErrors': manifest['errors'], 'failedRequests': manifest['failedRequests'], 'externalRequests': manifest['externalRequests']}
(QA / 'verification.json').write_text(json.dumps(result, indent=2))
if not REHEARSAL:
    scenario = '''# AzenoHI — 60-second demo scenario

The latest user instruction takes precedence: exactly 60 seconds in total, exactly ten seconds of Home, and a file smaller than 100,000,000 bytes. The long rotation-cycle requirement from the original brief is superseded. The Home excerpt starts at the original beginning of the live animation; there is no separate title card.

| Final time | View / action |
| --- | --- |
| 00:00–00:10 | Home: original live Earth, station and clouds; parked cursor, no caption or interaction |
| 00:10–00:16 | Team: portraits and supplied team-count label |
| 00:16–00:24 | Projects: all six cards, then actual navigation into CapTrace |
| 00:24–00:31 | CapTrace: overview and actual Back to projects action |
| 00:31–00:52.500 | Risk Miner: select its card, show the detail page, scroll to concept views/technology/team, return to the project list |
| 00:52.500–01:00 | Journey: the five milestones and mountain composition; finish on the real page |

All retained footage plays at 1× speed. Direct cuts remove idle time and the other generic detail pages. English captions begin only after Home. No music, narration, watermark, terminal, browser chrome or fabricated functionality is included.

The six cards are shown; CapTrace and Risk Miner represent the two implemented detail-page types. Risk Miner panels remain explicitly labelled concept visuals. No backend, form, authentication or operational analytics dashboard exists in this portfolio. The pause/resume controls were verified in the source session but are not shown in this final 60-second cut.
'''
    (DEMO / 'scenario.md').write_text(scenario)
    report = f'''# Recording and verification report

File: `{video}`

The user's final length and size requirements replace the original request for complete long rotation cycles.

| Property | Verified value |
| --- | --- |
| Container / codec | MP4 / H.264 {stream['profile']} |
| Duration | **60.000 seconds** |
| Home presentation | **0.000–10.000 seconds**, 300 frames |
| Resolution / aspect | 1920 × 1080 / 16:9 |
| Frame rate / count | **30/1 FPS**, 1,800 decoded frames |
| File size | **{result['bytes']:,} bytes** ({result['bytes'] / 1_000_000:.2f} MB; {result['bytes'] / 1048576:.2f} MiB) |
| Size ceiling | Pass: strictly below 100,000,000 bytes |
| Pixel format / color | yuv420p / BT.709 |
| Audio | No audio stream |
| Playback speed | 1× throughout |
| Opening motion | {cadence['changedPairs']}/{cadence['pairs']} consecutive frame pairs changed ({cadence['changedFraction'] * 100:.3f}%) |
| Browser | Chromium {manifest['browser']} |
| Scene renderer | {manifest['renderer']} |

## Quality evidence

- `qa/ffprobe.json`: codec, dimensions, six chapters, exact duration and all 1,800 decoded frames.
- `qa/full-decode.log`: full-file decode with `-xerror`; no decode error or blank interval.
- `qa/verification.json`: exact segment mapping, ten-second Home boundary, file size, adjacent-frame motion evidence and checksum.
- `screenshots/video-*.png`: actual final-film frames, including 09.967 seconds on Home and 10.000 seconds on Team; the contact sheet covers every final scene.
- Original capture begins before page navigation. The retained first frame is at the beginning of live scene readiness. No caption, cursor motion or input covers the ten-second opening; reduced motion is disabled.
- Every demonstrated link reaches the expected real UI state. Back links restore the corresponding project-card focus. All image and font loading checks passed.
- Zero page/console errors, failed requests or external runtime requests in the source recording.

## Tools and technical choices

Playwright and Chromium drive the unchanged production build. Xvfb, X11, Openbox and Xdotool provide isolated fullscreen capture and the real cursor. NVIDIA Vulkan renders the scene; FFmpeg/NVENC captures 60 FPS source footage. The final film uses 30 FPS, retaining every other source frame at unchanged speed. An earlier 60 FPS candidate was rejected after pixel checks found asynchronous X11 sampling repeats. The final 30 FPS meets the requested minimum and is verified against real pixel changes; there is no motion interpolation or artificial 60 FPS upconversion.

Final encoding uses FFmpeg/libx264, CRF 17, a 10 Mbit/s maximum rate and 20 Mbit buffer, with fast-start metadata. The script also enforces the strict 100,000,000-byte ceiling after rendering. Inter captions reuse the existing font and application colors.

## Project verification and scope

`qa/check.log` contains the passing lint, formatting, type, unit coverage and production-build checks; all four 90% coverage gates remain intact. The full browser run in `qa/e2e.log` had one software-WebGL timeout under graphics setup load; that test passed separately in `qa/e2e-motion-recheck.log`. No test was weakened. The existing lazy 3D bundle still produces a Vite size warning.

The UI is a static portfolio. Project screens are concepts, and owner-review items in `docs/content-review.md` remain open. The latest ten-second opening intentionally shows only an excerpt of the continuous rotations. Production code, dependencies, architecture and original reference assets were not changed. The recording pipeline does not publish, commit or push; repository visibility and distribution are managed separately.

Manual visual review is in `qa/visual-review.md`; its SHA-256 must match this file.

SHA-256: `{digest}`
'''
    (DEMO / 'recording-report.md').write_text(report)
    inventory = [str(path.relative_to(ROOT)) for path in DEMO.rglob('*') if path.is_file() and '.work' not in path.parts and '__pycache__' not in path.parts]
    inventory += ['artifacts/demo/qa/files.txt', '.gitignore (modified)', 'docs/assets.md (modified)', 'docs/content-review.md (modified)']
    (QA / 'files.txt').write_text('\n'.join(sorted(set(inventory))) + '\n')
print(json.dumps({key: result[key] for key in ['file', 'duration', 'homeDuration', 'frames', 'bytes', 'fps', 'completeDecode', 'sha256']}, indent=2))
