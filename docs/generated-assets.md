# Generated compositing assets

Created on 24 November 2026 with the built-in ImageGen tool, using user-supplied
references. Original reference PNGs and generated source PNGs are preserved.
These are decorative illustrations, not photographs documenting actual events.
Pillow is used only for the explicitly requested WebP format optimization;
all content removal, background extraction, and reconstruction was performed by
ImageGen. No team portraits were generated or changed.

## Home foreground

- Input: `design/reference/home.png`.
- Source: `generated_images/home-foreground.png`.
- Web: `web/public/images/scene/foreground.webp` (quality 90, full source size).
- Edit mode: `background-extraction`, `transparent_background: true`.
- Composition: original seated man and robot remain at center-right with rocky
  foreground across the bottom and left. The upper sky and gaps are transparent.
- Prompt: retain only the original dark rocky foreground and original seated
  backpack-wearing man and robot; keep identity, pose, proportions, and screen
  placement (human around 65% width / 55% height, robot around 76% / 55%). Preserve
  a full 16:9 canvas and transparent space above and behind the subjects. Remove
  sky, stars, Earth, station, sunrise background, words, logo, navigation,
  underlines, and diagonal UI ribbons. Retain red edge lighting on rocks. Deliver
  actual alpha; do not paint a checkerboard. Preserve cinematic material detail.
- Visual check: no remaining Earth, station, typography, or straight red UI bands.

## Home sky

- Input: `design/reference/home.png`.
- Source: `generated_images/home-sky.png`.
- Web: `web/public/images/scene/sky.webp` (quality 84, full source size).
- Edit mode: `precise-object-edit`, opaque output.
- Prompt: create a clean 16:9 background plate, preserving near-black navy space,
  stars, and a restrained crimson/pink glow around 58% width / 46% height. Remove
  Earth/horizon, station, people, robot, rocks, mountains, UI, logos, text, and
  diagonal bands. Seamlessly replace them with dark space and soft red nebula.
  Keep upper left/center quiet for HTML text. No planet curvature or sun disk.
- Visual check: one uninterrupted star field; no duplicate 3D scene objects.

## Journey mountain

- Input: `design/reference/journey.png`.
- Source: `generated_images/journey-mountain.png`.
- Web: `web/public/images/journey/mountain.webp` (quality 86, full source size).
- Edit mode: `precise-object-edit`, opaque output.
- Prompt: keep the exact cinematic mountain landscape, summit, small red flag at
  upper right, dark foreground rocks, clouds, dawn lighting, camera and framing.
  Remove every interface element, written character, header, navigation, logo,
  headings, description, dates, captions, footer, photo cards, glowing timeline
  path and dots. Fill removed regions with realistic terrain. Keep dark spacious
  left sky for HTML headings. No added people, buildings, roads, or typography.
- Visual check: mountain and blank flag remain; timeline will be separate SVG.

## Rights and limitations

The source mockups were supplied for this implementation. Generated layers do
not establish a new license for source art. They preserve the intended layout
but are reconstructed artwork, so pixel-level identity with the mockups is not
claimed. The Journey flag is blank red; the brand mark can be a separate SVG.

## Verified web output metadata

All three layers are 1672 × 941 pixels (same canvas as the supplied references).

| File | Mode | Bytes | Alpha verification |
| --- | --- | ---: | --- |
| `scene/foreground.webp` | RGBA | 146364 | Extrema 0–255; 1,052,726 fully transparent pixels; foreground mostly alpha 252–254 with antialiased edges |
| `scene/sky.webp` | RGB | 15034 | Opaque |
| `journey/mountain.webp` | RGB | 154022 | Opaque |

Each optimized output was reopened and visually inspected after encoding.

## Original static Home poster (retired)

- Input: `design/reference/home.png`.
- Source: `generated_images/home-poster.png`.
- Former web variant: `web/public/images/scene/poster.webp`, 1672 × 941, RGB,
  176350 bytes, WebP quality 87. Removed from runtime assets after the scene
  refinement; the original generated PNG remains preserved.
- Built-in ImageGen `precise-object-edit`, opaque output.
- Prompt: remove only logo/brand, navigation/underline, AZENO HI label/line,
  Hybrid Intelligence heading and both straight diagonal red UI ribbons.
  Seamlessly reconstruct underlying sky/rocks. Preserve original Earth/city
  lights/horizon, sunrise, upper-right station, man/robot and rocky foreground,
  including positions, scale, framing, light and material detail. No text, UI,
  crop or added objects.
- Superseded by `still-desktop.webp` and `still-mobile.webp`, captured from the
  current WebGL model. Loading, reduced-motion and failure states share the
  same sky/foreground and camera framing as the live scene. The old artwork
  must not be restored as a loading placeholder.
- Reopened optimized output and visually verified all text/UI was removed.

## Interior-page space backdrop

- Input: `design/reference/team.png`.
- Source: `generated_images/space-backdrop.png`.
- Web: `web/public/images/scene/space-backdrop.webp`, 1672 × 941, RGB, 56996 bytes,
  WebP quality 87.
- Built-in ImageGen `precise-object-edit`, opaque output.
- Prompt: preserve original Earth horizon/city lights, sunrise at 55% width / 29%
  height, upper-right orbital station, stars and navy shadows. Remove logo/nav,
  headings, all 12 portrait cards, names, icons, borders, 14+ counter and both
  decorative ribbons. Seamlessly reconstruct planet/space behind removed cards.
  Keep lower half dark for real HTML cards. No new portraits, text, panels or UI.
- Reopened optimized output and verified no text, cards or portraits remain.

## Risk Miner detail backdrop

- Input: `generated_images/space-backdrop.png` (derived from `team.png` above).
- Source: `generated_images/risk-backdrop.png`.
- Web: `web/public/images/scene/risk-backdrop.webp`, 1672 × 941, RGB,
  WebP quality 87.
- Built-in ImageGen `precise-object-edit`, opaque output.
- Prompt: remove only the upper-right orbital station and its immediate reflected
  halo, filling its footprint with matching stars and underlying Earth texture.
  Preserve Earth shape, horizon angle, blue atmospheric rim, sunrise, city lights,
  dark lower half, composition, lighting, and colors. No new objects or text.
- Reason: avoid visual overlap between the station and Risk Miner illustration
  panels in the detail-page composition. Original shared space backdrop retained.
- Visual check: station fully removed; Earth and sunrise composition preserved.
