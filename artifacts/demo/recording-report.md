# Recording and verification report

File: `/home/lipov/projects/azeno_hi/artifacts/demo/azenohi-demo.mp4`

The user's final length and size requirements replace the original request for complete long rotation cycles.

| Property | Verified value |
| --- | --- |
| Container / codec | MP4 / H.264 High |
| Duration | **60.000 seconds** |
| Home presentation | **0.000–10.000 seconds**, 300 frames |
| Resolution / aspect | 1920 × 1080 / 16:9 |
| Frame rate / count | **30/1 FPS**, 1,800 decoded frames |
| File size | **11,258,759 bytes** (11.26 MB; 10.74 MiB) |
| Size ceiling | Pass: strictly below 100,000,000 bytes |
| Pixel format / color | yuv420p / BT.709 |
| Audio | No audio stream |
| Playback speed | 1× throughout |
| Opening motion | 281/281 consecutive frame pairs changed (100.000%) |
| Browser | Chromium 159.0.8154.6 |
| Scene renderer | ANGLE (NVIDIA, Vulkan 1.4.312 (NVIDIA NVIDIA RTX 4000 Ada Generation (0x000027B2)), NVIDIA) |

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

SHA-256: `daf2cdc13f8eceb1c2170e57a81b91bc44e392f0f4f5a0d1923060b2b1d543d3`

## Browser playback

The actual final MP4 played in Chromium at the beginning, midpoint and end. Playback advanced after each seek, decoded at 1920 × 1080, and reached the `ended` event without a media error. See `qa/playback.json`, bound to the same SHA-256 as this report.
