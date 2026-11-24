# Mobile Home and loading handoff

Reviewed locally on 2026-11-24. On phones up to 600px wide, the title sits below
the header, the complete station occupies its own area beneath it, and Earth
and the foreground are framed lower. Narrow screens retain a 700px minimum
scene height and scroll vertically when necessary. At 601–900px the smaller
heading leaves space above the foreground figures.

The old ImageGen poster was removed from runtime assets. Loading, reduced-motion
and WebGL-failure states now use transparent desktop/mobile captures of the
current model, sharing the sky and foreground with the live scene. Readiness
waits for the first rendered frame. A 180ms canvas fade keeps the still visible
underneath until the transition finishes. Fitting the orthographic camera
instead of scaling the model preserves lighting and cloud relief across sizes.

Verification:

- Browser inspection at 320×568, 360×740, 390×844, 430×932, 600×900, 768×1024
  and 844×390; no horizontal overflow. Phone titles, station and figures are
  separated. These are browser viewport checks, not physical-device tests.
- New regression cases enter Home from Team with texture downloads held back,
  compare loading/ready captures, then return from Projects with cached assets.
  Both 390px and 1280px layouts request only the current artwork.
- Lint, formatting, strict types, build and 23 unit tests pass; all four
  coverage thresholds remain above 90%.
- Browser suite: 27 passed; 21 intentional software-WebGL skips outside the
  dedicated Chromium project. Other engines exercise fallback, layout,
  accessibility and navigation.

[Mobile preview](qa/mobile-home/mobile-390.webp) ·
[320px preview](qa/mobile-home/mobile-320.webp) ·
[430px preview](qa/mobile-home/mobile-430.webp) ·
[Landscape preview](qa/mobile-home/landscape-844.webp)

Loading handoff: [phone loading](qa/mobile-home/home-390-loading.webp) /
[phone ready](qa/mobile-home/home-390-ready.webp),
[desktop loading](qa/mobile-home/home-1280-loading.webp) /
[desktop ready](qa/mobile-home/home-1280-ready.webp).

Logs and loading/ready comparisons are under `docs/qa/mobile-home/`.
Regenerate the transparent stills after model changes with
`node web/scripts/capture-scene-stills.ts` against the running dev server.
