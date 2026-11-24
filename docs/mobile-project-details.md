# Mobile project details

Reviewed locally on 2026-11-24.

Risk Miner uses a single-column hero through 760px and separate text/artwork
columns on tablets. Its capability cards have dedicated icon, title and copy
space. The three concept screens retain their complete images, with captions
beneath. Technology and team are independent sections with wrapping layouts.

CapTrace, Done, PrivyMeet, Productivity Suite and RiskTrace use the same
responsive overview layout: event/year, title, description, supplied award,
illustration and concept caption. Illustrations stay within their frames.

Every detail page has a minimum 44px return target at the top and bottom.
Both links navigate to `/projects#project-{slug}`, focus the matching card and
scroll it below the mobile header. The target card has a red border. This works
on direct entry, and browser Back/Forward continues to navigate normally.
Unknown card anchors fall back to ordinary list navigation.

Checks cover all six routes at 320, 390, 640 and 768px. Additional browser
inspection covers 430×932, 844×390 and desktop framing at 1672×941. Assertions
check clipping, section separation, 44px return targets, focus restoration,
history and accessibility. These are emulated viewports, not physical devices.

Lint, formatting, strict types, build and 25 unit tests pass, with all four
coverage gates above 90%. Browser verification covers Chromium, Firefox, WebKit
and mobile Chromium: 47 passing cases and 21 intentional skips for motion tests
limited to desktop Chromium. The initial combined run was interrupted by the
execution environment after completing Chromium; the other browser projects
then passed in a separate batch. Chromium also runs in the required commit hook.
Local logs and screenshots are retained under `docs/qa/mobile-details/`.

[Risk Miner](assets/screenshots/risk-miner-390.webp) ·
[Overview example](qa/mobile-details/productivity-suite-390.webp) ·
[Return to the list](qa/mobile-details/return-to-list.webp)
