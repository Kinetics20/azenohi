# Template AI Constitution

## Core Principles

### I. Purpose and simplicity

Every change must address a concrete need and have verifiable acceptance criteria.
Add only the functionality needed to meet them.

### II. Reuse the template

Extend existing mechanisms and preserve agreed application contracts.
The template's documentation and configuration define the stack, setup, and deployment;
do not duplicate those details in the constitution.

### III. Protect data

Preserve data access boundaries. Keep secrets out of the repository, frontend, and logs.
Tests that modify data must use isolated test resources.

### IV. Local quality and diagnostics

Changes must pass the template's local checks and pre-commit hooks.
Match testing to the scope and risk of the change. Keep diagnostic logs.
Keep runtime telemetry disabled for the AzenoHI portfolio. Do not add dependency audits or GitHub Actions.

## Governance

Specifications, plans, and implementations must comply with these principles.
Document and version amendments: MAJOR for incompatible changes, MINOR for additions,
and PATCH for clarifications. Refer to `AGENTS.md` for working guidance.

**Version**: 2.1.0 | **Ratified**: 2026-11-17 | **Last Amended**: 2026-11-24

## AzenoHI scope amendment

The user-approved portfolio uses only `web/`. See ADR 001. Remove unused backend
and AI infrastructure while preserving frontend quality checks and Spec Kit.
Keep a single `main` branch and perform all verification locally.
