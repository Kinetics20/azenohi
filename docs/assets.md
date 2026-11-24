# Asset provenance and reuse

## Supplied sources

Six source files were copied from `/home/lipov/Downloads/` without moving or
changing originals. `reference-manifest.json` records source paths, byte counts
and matching SHA-256 hashes. They are kept under `design/reference/` and are not
included in `web/dist`.

| Production path | Source / processing |
| --- | --- |
| images/team/*.webp | Individual portrait regions from team.png, excluding name labels. Original faces preserved; only crop and WebP encoding. |
| images/projects/{captrace,done,privymeet,productivity-suite,risktrace}.webp | Illustration-only regions of projects.png. No embedded project titles or buttons. |
| images/projects/risk-miner.webp | User-provided generated_images/exec-de366445-3675-4c01-ba93-5ba28ec26ee0.png; crop (480,110)–(1470,910), resize to 891×720, WebP quality 88. RGBA transparency preserved (alpha 0–255). Used by the sixth card and detail page. |
| images/journey/{2017,2018,2020,2023,2025}.webp | Illustrations cropped from journey.png; dates and descriptions rendered separately in HTML. |
| images/risk-miner/{detect,analyse,predict}.webp | Three reference dashboard concepts cropped from risk_miner.png; not functional dashboards. |
| images/risk-miner/team-*.webp | Four unnamed project portraits from risk_miner.png; no inferred identities. |
| images/scene/*.webp, images/journey/mountain.webp | ImageGen edits of supplied references. See generated-assets.md for exact prompts, source paths and alpha checks. |

The user supplied these designs for this project. Their underlying third-party
rights and consent to publicly identify people remain subject to owner review.
No blanket license is assigned to them. Generated PNG masters are preserved.

## Earth textures

Source: [Solar System Scope textures](https://www.solarsystemscope.com/textures/),
by INOVE / Solar System Scope, based on NASA imagery and elevation data.
Distributed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Retrieved 2026-11-24:

- https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg
- https://www.solarsystemscope.com/textures/download/2k_earth_nightmap.jpg
- https://www.solarsystemscope.com/textures/download/2k_earth_clouds.jpg

Original JPEGs remain in design/textures/. Production WebP variants are in
web/public/textures/. Changes: lossy WebP encoding; lighting and color treatment
applied by the Earth shader. No ownership of these maps is claimed.

## Code-native visuals and typography

- Orbital station: original procedural geometry in sceneModel.ts; no external GLB.
- Brand mark, decorative path and ribbons: SVG/CSS implementation of the supplied design.
- UI icons: Lucide React, ISC license; package license retained with dependency.
- Inter Variable: Rasmus Andersson / Inter contributors, SIL Open Font License 1.1;
  locally served through @fontsource-variable/inter. License copied into docs/licenses/.
- README technology marks: local SVGs from the Simple Icons package, CC0-1.0.
- README banner/screenshots: captured from this actual application, not supplied mockups.

Keep production assets out of design/reference/ and preserve masters when replacing
variants. Inspect decoded images and rendered cards after any asset change.
