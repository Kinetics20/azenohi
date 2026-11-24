# Feature Specification: AzenoHI portfolio

**Feature**: 001-azenohi-website | **Created**: 2026-11-24 | **Status**: Implementing
**Input**: AZENOHI_CODEX_PLAN.md, especially sections 6–10 and 13.

## User Scenarios & Testing

### US1 — Explore the team (P1)
Visitors recognize the brand and can navigate Home, Team, Projects and Journey.
Acceptance: logo returns Home, active navigation is accurate, direct URLs and
browser history work. Keyboard and mobile users can access every page.

### US2 — Explore projects (P1)
Visitors see six projects in reference order and can open each project.
Acceptance: Risk Miner is sixth, uses the supplied generated thumbnail and opens
its detail page. Other projects show only supplied descriptions in accessible
views. No fabricated links or achievements are included.

### US3 — Experience the scene (P1)
Visitors see the reference-inspired Earth and station rotating independently.
Acceptance: the station's structure and illuminated windows remain visible;
pause/resume works; content remains usable with reduced motion, failed assets,
no WebGL and context loss. Background rendering stops when hidden/offscreen.

### US4 — Read the journey (P2)
Visitors read the five supplied milestones in order. Dates and text remain
selectable; a vertical mobile timeline preserves the reading order.

## Requirements

- FR01: Reproduce the five supplied reference compositions with English HTML.
- FR02: Keep team names, milestone dates and project claims traceable to sources.
- FR03: Use only production assets in the served application; preserve originals.
- FR04: Navigation, details, pause and mobile menu must be keyboard accessible.
- FR05: Display a static decorative scene immediately and when animation fails.
- FR06: Preserve private independent ownership, a single main branch, and source attribution.
- FR07: Document implementation, instructions, verification and actual limitations.
- FR08: Do not publicly deploy the site in this task.

## Key Entities

Project: slug, title, description, event, year, optional reference award, illustration.
Team member: supplied first name, portrait extracted from the mockup, decorative icon.
Milestone: supplied year, text and reference illustration.

## Success Criteria

- All four primary destinations and Risk Miner details are reachable and refreshable.
- No horizontal overflow at 360, 390, 768, 1440 and 1672 pixels.
- Keyboard navigation and automated accessibility checks pass on core pages.
- Local quality checks retain all 90% coverage thresholds and pass.
- Visual screenshots cover five primary views and mobile layouts.
- A browser recording demonstrates actual independent object motion.
- Performance is measured with the environment and profile recorded, targeting
  LCP ≤2.5 s, CLS ≤0.1 and 60 desktop FPS; shortcomings are explicitly reported.

## Assumptions & Clarifications

No blocking clarification is needed. Repository defaults private. The delivered
content is a reviewable demonstration: 14+, awards, historic milestones and Risk
Miner technologies remain pending owner confirmation. No public partnership is
implied. Source animation has no measured full revolution; record observations
and deliberate approximations rather than presenting guesses as measurements.
