# Implementation Plan

Use the existing web/ Vite application with strict TypeScript and React. Local
modules own content, React Router owns URLs, CSS owns layout. Three.js with R3F
is lazy loaded only on Home when motion is permitted. Separate sky, 3D Earth,
3D station, transparent foreground and HTML prevent duplicate imagery.

Preserve local Oxlint, Prettier, Vitest coverage and Playwright/axe gates. Test
motion calculations and lifecycle separately from browser rendering. A headless
software-WebGL smoke test must actually observe changing pixels and pause.

Ordered delivery: materials → independent snapshot → spec/ADR → frontend
adaptation → static Home → motion prototype → other pages → visual/accessibility
review → documentation → final verification and push. No deployment.

Constitution check: PASS. ADR 001 records authorized scope adaptation. No new
branch, telemetry, Actions or backend. Existing assets and source attribution
are preserved. Use `.specify/feature.json` to select this directory.
