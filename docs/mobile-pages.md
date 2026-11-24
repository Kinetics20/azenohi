# Mobile Team, Projects and Journey

Reviewed locally on 2026-11-24.

- Team: two portrait columns on phones, three on tablets, proportional images,
  consistent label spacing and a full-width member-count panel.
- Projects: artwork above the description at narrow widths, one card per row
  through 760px, two through 1000px. Event names wrap independently of the year
  and arrow; footers align within a row. A subtle title backdrop keeps the
  sunrise from washing out the heading.
- Journey: a vertical timeline through 1000px, with separate image/text columns
  and content-driven height. The closing message and signature follow the list.
- Navigation: fixed phone header through 760px, 44px-or-larger menu targets,
  bounded dropdown height, outside-tap/Escape dismissal and closure on route,
  focus or navigation-breakpoint changes. Selecting the current page returns
  keyboard focus to the menu button.

Visual checks cover 320×568, 390×844, 430×932, 640×844, 768×1024 and 844×390,
plus the open menu at 640×360. Browser regression checks inspect the bounds of
text, icons, artwork, event labels, years and timeline rows at 320, 390, 600,
640 and 768px; they also navigate from the bottom of the long Projects page.
These are browser viewport checks, not tests on physical devices.

Lint, formatting, strict types, build and 24 unit tests pass. Coverage remains
above all four 90% thresholds. The browser suite reports 35 passed and 21
intentional software-WebGL skips outside the dedicated Chromium project.
Results are retained in `docs/qa/mobile-pages/browser-checks.log`.

[Team preview](assets/screenshots/team-390.webp) ·
[Projects preview](assets/screenshots/projects-390.webp) ·
[Journey preview](assets/screenshots/journey-390.webp) ·
[Short-screen menu](qa/mobile-pages/menu-640.webp)
