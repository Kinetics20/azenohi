.PHONY: install dev preview check web-check e2e hooks format spec-check
install:
	npm --prefix web ci
	npm --prefix web exec -- playwright install chromium firefox webkit
dev:
	npm --prefix web run dev
preview:
	npm --prefix web run preview
check: web-check
web-check:
	npm --prefix web run check
e2e:
	npm --prefix web run test:e2e
hooks:
	uvx --from pre-commit pre-commit install
format:
	npm --prefix web run format
spec-check:
	@for script in .specify/scripts/bash/*.sh; do bash -n "$$script" || exit; done
	@.specify/scripts/bash/resolve-template.sh spec-template --json >/dev/null
