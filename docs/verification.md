# Verification report — 24 November 2026

## Delivered scope

Local production build at http://127.0.0.1:4173, development at
http://127.0.0.1:5173 while its server is running. Repository:
https://github.com/Kinetics20/azenohi (private, independent, default branch main).
The final delivery commit SHA is reported in the task completion message and can
be reproduced with `git rev-parse HEAD`. No public hosting deployment was made.

## Stage acceptance

| Stage | Evidence |
| --- | --- |
| 0 — Materials | Six copies match the untouched Downloads originals; reference-manifest.json. All five mockups inspected. FFmpeg-decoded video sequence and enlarged station views inspected; motion-reference.md. |
| 1 — Bootstrap | Initial commit 9baa5f325352ecf4fceab49e84f4a39ec9173ec4 retains the approved main snapshot. Source SHA 14b2ec9fdd82ac88ce50edb538efde0126f73a3c matches the plan. Verified authenticated login Kinetics20, private repository, isFork false, only main, origin points to owner. |
| 2 — Specification | Spec Kit resolver used; English specification, plan, checklist, tasks and ADR 001. No extra branch, reinitialization or blocking clarification. |
| 3 — Adaptation | Standalone frontend; removed API CRUD, query client, backend services, proxy, obsolete containers, AI tools and dead hook commands. Strict typing, lint, format and four 90% coverage gates preserved. |
| 4 — Static Home | Separate generated poster, sky and transparent foreground; actual HTML text/logo/navigation; responsive layout. |
| 5 — Motion | Procedural Three.js Earth and station; instanced modules/windows, night masking, point light and emissive beacons. Browser recording and separate motion tests. |
| 6 — Views | Home, Team, Projects, Journey, Risk Miner and five honest project overview routes, plus 404. Sixth card uses the supplied Risk Miner thumbnail. |
| 7 — Refinement | Responsive screenshots at all five requested widths; cross-browser axe and keyboard checks; motion failures; performance and repeated-navigation inspection. |
| 8 — Documentation | English README, local technology icons, real screenshots/banner/video, setup, content review, asset attribution and license notices. |
| 9 — Delivery | Local gates and hooks pass. Final commit/push and remote SHA verification are recorded in the completion message. |

## Commands actually executed

- `npm --prefix web ci`: PASS with Node 26.13.1 and npm 12.2.2.
- `npm --prefix web run check`: PASS — type-aware Oxlint, Prettier, strict
  TypeScript, 22 unit tests and production build.
- Coverage: statements **99.28%**, branches **97.43%**, functions **98.38%**,
  lines **99.22%**. All four thresholds remain at 90%; no new coverage exclusions.
- `npm --prefix web run test:e2e`: PASS, **24 passed / 12 intentional skips**.
  Chromium, Firefox, WebKit and mobile Chromium run the five shared scenarios.
  Four real WebGL/failure scenarios run only on desktop Chromium. The other
  three projects each skip these four tests; they still run layout and axe.
- `make spec-check`: PASS.
- `make hooks`: installed local hooks. `uvx --from pre-commit pre-commit run
  --all-files`: all five gates PASS, including production-browser verification.
- `npm --prefix web run dev`: served port 5173.
- `npm --prefix web run preview`: served the built output at port 4173.
- README: all 27 local references/asset paths checked; banners, gallery images,
  badges and recording exist. No invented live-demo URL or CI badge.

Raw check and E2E logs are in `docs/qa/`. HTML/trace reports remain locally ignored
under web/playwright-report and web/test-results.

## Browser and accessibility evidence

Shared scenarios verify direct navigation and refresh of all primary routes,
image decoding, active links, logo, project order, six detail links, Back/Forward,
404 recovery, keyboard skip link, route focus, mobile menu, Escape, and no
horizontal overflow at **360, 390, 768, 1440 and 1672 pixels**. Axe reports zero
WCAG 2 A/AA and 2.1 AA violations on the five main views in all four projects.

The dedicated Chromium run uses software WebGL and compares pixels in separate
Earth and station regions over time. It verifies the canvas becomes pixel-stable
on pause, resumes, and switches to the poster on real WEBGL_lose_context loss.
Texture requests are aborted to test loader failure; disabled WebGL and delayed
textures preserve HTML and navigation. No backend requests or 3D chunk are sent
in reduced-motion mode. Unit tests exercise visibility, intersection and media
preference changes, listeners, delta-based transforms and resource disposal.

WebKit initially lacked libavif.so.16 and libgav1.so.2 on the workstation.
Official Ubuntu packages were downloaded and extracted without root into
`$HOME/.local/share/azenohi-browser-libs`, with required libraries copied into the
Playwright WebKit cache's existing sys/lib search path. System libraries/settings
were not changed. WebKit then completed all five shared scenarios successfully.

## Visual review

Compared implemented pages at 1672×941 against the supplied designs, and
inspected long mobile screenshots at 390×844. Reviewed the live 3D Home separately
from deterministic reduced-motion layouts. Captures live in docs/assets/screenshots.

- Home retains headline hierarchy, red accents, upper-right station, curved Earth
  horizon and the original seated human/robot composition. UI remains HTML.
- Team preserves names/order/portraits and the two-row desktop composition, with
  two-column cards on mobile. No generated replacement faces.
- Projects uses three desktop columns and six functional cards. Risk Miner has
  its supplied transparent illustration and HackNation 2026, without an award.
- Journey retains the mountain, red path and five HTML milestones; mobile uses
  a vertical timeline. Text shadow added after visual inspection for contrast.
- Risk Miner has the concept image, four capabilities, three reference screens,
  technology and unnamed reference portraits. The station was removed from this
  view's backdrop after it overlapped the risk panels in the first review.

This is a reference-based recreation, not a pixel-identical rendering. The live
station is a custom procedural model with simpler surfaces than the cinematic
source; Earth textures are attributed maps, not a reproduction of the source
film's generated surface. The immediate poster is more photographic than the
live geometry. These distinctions are deliberate and visible in the recording.

## Performance

Measurement: production Vite preview over localhost, fresh browser contexts,
no network/CPU throttling, Chromium 159.0.8154.6, Ubuntu 26.04.1, Intel Xeon
w5-2555X, NVIDIA RTX 4000 Ada Generation (driver 580.178.04), actual WebGL renderer
confirmed as ANGLE/NVIDIA/OpenGL ES 3.2. Four-second requestAnimationFrame samples
are taken after scene readiness. Values are laboratory observations, not field
percentiles or proof of performance on real phones.

| Profile | LCP | CLS | Frame cadence | Resource transfer |
| --- | --- | --- | --- | --- |
| Desktop 1440×900, DPR 1, GPU scene | 136 ms | 0.00270 | 60.0 FPS; p95 16.7 ms | 1,154,555 bytes |
| Mobile viewport 390×844, DPR 2, same desktop GPU | 140 ms | 0.0000655 | 60.0 FPS; p95 16.7 ms | 1,154,555 bytes |
| Reduced motion, desktop poster | 84 ms | 0.00270 | No animated canvas; browser cadence 60 FPS | 373,434 bytes |

An earlier explicitly forced SwiftShader run before cloud texture optimization
recorded 38.6 desktop / 42.6 mobile-emulation FPS. This demonstrates a functioning
software fallback, but does not meet the desktop 60 FPS target. The GPU profile
meets the local target. No physical mobile device was tested.

Cloud texture was reduced to 1024×512, saving approximately 496 KB. Three.js/R3F
is lazy-loaded; Vite still reports a large scene chunk (about 926 KB raw / 245 KB
gzip). It is not requested for reduced-motion Home or the other routes.

`docs/qa/performance.json` contains complete profile data and 12 SPA navigation
samples. A longer 40-cycle run is in `docs/qa/navigation-memory.json`. Every exit
removes the canvas. The measurement allows R3F's delayed renderer cleanup before
explicit GC; cached textures are intentionally retained once for reuse. JS heap increased from
about 6.1 MB on the first cycle to 8.4 MB on cycle 40 (about 0.33 MB over the
last 20 cycles). No canvases accumulated. This finite run does not establish
zero heap growth or prove the absence of every library-level retention issue.

## Known limits and release review

- Cinematic source fidelity is approximate; the film does not expose enough
  information to measure exact full-rotation periods. The camera and characters
  remain still; Earth/station rotate continuously without the source loop cut.
- Physical mobile GPU performance and production-network performance remain
  unmeasured; the reported mobile profile is desktop emulation.
- Names, 14+, awards, dates, event wording and project technology claims need
  owner confirmation before publication. See content-review.md.
- Other project detail pages contain only supplied descriptions, with no invented
  repository/demo links. Risk Miner visuals are not a working risk dashboard.
- Vite's lazy-chunk size warning and the R3F test renderer's upstream Three.js
  CommonJS deprecation warning remain non-failing warnings.
- Hosting remains intentionally undeployed; SPA refresh was verified locally.
