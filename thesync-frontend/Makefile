NPM ?= npm

.PHONY: ci-checks ci-check dev build start lint lint-fix format format-check

# Apply fixers first, then rerun strict checks before building.
ci-checks:
	$(NPM) run lint:fix && $(NPM) run format && $(NPM) run lint && $(NPM) run format:check && $(NPM) run build

ci-check:
	$(NPM) run ci:check

dev:
	$(NPM) run dev

build:
	$(NPM) run build

start:
	$(NPM) run start

lint:
	$(NPM) run lint

lint-fix:
	$(NPM) run lint:fix

format:
	$(NPM) run format

format-check:
	$(NPM) run format:check
