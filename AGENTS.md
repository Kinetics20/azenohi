# Working in AzenoHI

Read `.specify/memory/constitution.md` and `docs/adr/001-static-frontend.md`.
Write guidance and Spec Kit artifacts in English. Use only `main`; feature
artifacts live in `specs/001-azenohi-website/` independently of branch names.

- Use the retained React / TypeScript / Vite application in `web/`.
- `npm --prefix web ci`, `npm --prefix web run check`, `npm --prefix web run test:e2e`.
- Preserve all four 90% coverage gates, type-aware lint, accessibility and browser checks.
- Local checks only; no GitHub Actions, dependency audits, backend or telemetry.
- Keep text and navigation in HTML. Never use a page screenshot as the interface.
- Source materials and original generated images are immutable references.
- Record source, modifications and review status in `docs/assets.md` and `docs/content-review.md`.
- Do not publish the website unless explicitly requested. The repository is private.
- Do not modify the source repository maintained by Paweł Konior.
