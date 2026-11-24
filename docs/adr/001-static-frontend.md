# ADR 001: Standalone static portfolio

Accepted 2026-11-24. The user explicitly authorizes adapting the imported starter
to a frontend-only portfolio. The initial import remains a recovery point.

Preserve React, TypeScript, Vite, Oxlint, Prettier, Vitest, Testing Library,
Playwright, axe, strict typing, local hooks and all 90% coverage thresholds.
Remove API CRUD, backend packages, database/AI services, proxies, obsolete
container and agent dependencies. Use local typed content and React Router.
Use Three.js / React Three Fiber for a separately loaded, decorative hero scene.
No CMS, authentication, runtime API, analytics, Actions or paid service.
Vercel configuration is prepared, but hosting is explicitly outside this task.

Constitution interpretation: preserving the approved application contract now
means the standalone frontend specified by the user, not unused backend scope.
Version 2.1.0 adds this clarification without weakening quality gates.
