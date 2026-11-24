# Motion reference analysis

Source: design/reference/animated_front_page.mp4, SHA in reference-manifest.json.
Decoded using imageio's FFmpeg 9.0.2 (no system FFmpeg was installed). Inspected
frames at 0–7 s every second, 0/3.33/6.67/9.96 s, and magnified station frames at
0/2/4/6/8/9.96 s. Full clip decoded during playback preparation.

- H.264, 1920×1080, 16:9, 30 FPS, duration 10.0 seconds (300 frames).
- Earth: a large curved horizon rising to the right; subtle surface movement
  under the horizon, with cloud/topography changes. The short generated-looking
  clip does not identify geographic landmarks or expose the rotation axis well
  enough to measure a true sidereal period or confidently distinguish every
  surface displacement from camera/texture deformation. Do not call 120–240 s
  a measured period. Implementation uses a slow positive local Y rotation,
  tilted presentation and a 210 s artistic period.
- Station: oblique ring around a near-vertical spindle leaning slightly left.
  Ring/spoke relative positions evolve slightly; the center stays upper-right.
  There is no complete orbit around Earth. The front portions appear to move
  left, but a unique angular speed cannot be recovered from these frames.
  Implementation uses negative local Y rotation (84 s period), independent of
  Earth and beneath a fixed tilt. This is an explicit approximation.
- Lighting: many mostly steady pale windows and warm rim reflections; foreground
  robot/backpack have red indicators. No strong regular strobe is evidenced.
  Use steady windows with restrained red beacon breathing, not rapid flashes.
- Camera/composition: subtle framing drift, horizon and figures lower toward the
  end. Figures keep the seated pose; minor generative deformation is not treated
  as intentional character animation. Camera stays fixed in the implementation
  to retain readable text and a seamless scene.
- End vs start: end does not match start; direct looping would jump. A continuous
  procedural rotation avoids that cut. No video is shipped as the Home background.
- Preserve: Earth horizon, upper-right tilted station, independently moving
  geometry, dim metal with bright windows, seated pair and red sunrise palette.
- Simplify: no character motion, no camera drift, procedural station detail,
  non-geographic art direction, no expensive bloom pipeline.

Browser comparison and measured performance are recorded in verification.md.
