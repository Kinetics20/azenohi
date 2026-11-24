# Spec-driven development

The imported Spec Kit configuration, templates and skills are retained. Select
`specs/001-azenohi-website/` through `.specify/feature.json`; the feature directory
is independent from Git branches. This project deliberately uses only `main`.
Do not run `specify init --force` again.

Workflow: specify → clarify genuine blockers → plan → tasks → analyze → implement
→ converge. The current feature contains the specification, plan, checklist and
tracked tasks. `AZENOHI_CODEX_PLAN.md` is the original user input; it remains intact.

The spec template was resolved using `.specify/scripts/bash/resolve-template.sh
spec-template --json`. No extension hooks were configured. Agent guidance and
artifacts are in English. ADR 001 and constitution 2.1.0 explain the authorized
frontend adaptation. `make spec-check` checks the retained scripts and resolver.

Use `npm --prefix web run check`, `npm --prefix web run test:e2e` and the local
pre-commit hooks. No backend, AI CLI or GitHub Actions is needed.
