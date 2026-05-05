.PHONY: help install dev run format lint fix check db-revision db-upgrade db-downgrade \
	db-current db-history pre-commit-install pre-commit-run commit-example commit-check bump

VENV_BIN = .venv/bin
PYTHON = $(VENV_BIN)/python
ALEMBIC = $(PYTHON) -m alembic
BLACK = $(PYTHON) -m black
RUFF = $(PYTHON) -m ruff
FLAKE8 = $(PYTHON) -m flake8
BANDIT = $(PYTHON) -m bandit
PRE_COMMIT = $(PYTHON) -m pre_commit
PRE_COMMIT_CONFIG = .pre-commit-config.yaml
HOOK_PRE_COMMIT_CONFIG = ../.pre-commit-config.yaml
CZ = $(PYTHON) -m commitizen
UVICORN = $(PYTHON) -m uvicorn
APP_MODULE = main:app
HOST ?= 0.0.0.0
PORT ?= 8000
COMMIT_MSG ?= feat: describe your change
MIGRATION_MESSAGE ?= describe schema change
PYTHON_PATHS = main.py controller model repository usecase alembic
PYTHON_TARGETS = $(foreach path,$(PYTHON_PATHS),$(if $(wildcard $(path)),$(path),))

help: ## Show available commands
	@awk 'BEGIN {FS = ":.*## "}; /^[a-zA-Z0-9_-]+:.*## / {printf "%-20s %s\n", $$1, $$2}' Makefile

$(PYTHON):
	@echo "Project virtualenv is missing. Run 'make install' first."
	@exit 1

dev run format lint fix check db-revision db-upgrade db-downgrade db-current db-history \
pre-commit-install pre-commit-run commit-example commit-check bump: $(PYTHON)

install: ## Install runtime and dev dependencies
	uv sync --dev

dev: ## Run the API with auto-reload
	$(UVICORN) $(APP_MODULE) --reload --host $(HOST) --port $(PORT)

run: ## Run the API without auto-reload
	$(UVICORN) $(APP_MODULE) --host $(HOST) --port $(PORT)

format: ## Format Python code with Black
	$(BLACK) $(PYTHON_TARGETS)

lint: ## Run linting and auto-fix Ruff issues when possible
	$(RUFF) check --fix $(PYTHON_TARGETS)
	$(FLAKE8) $(PYTHON_TARGETS)

fix: lint format ## Apply automated code quality fixes

check: ## Run the full local quality gate
	$(BLACK) --check $(PYTHON_TARGETS)
	$(RUFF) check $(PYTHON_TARGETS)
	$(FLAKE8) $(PYTHON_TARGETS)
	$(BANDIT) -r $(PYTHON_TARGETS)

db-revision: ## Create a new Alembic revision, e.g. make db-revision MIGRATION_MESSAGE="add notifications index"
	$(ALEMBIC) revision --autogenerate -m "$(MIGRATION_MESSAGE)"

db-upgrade: ## Apply migrations up to head
	$(ALEMBIC) upgrade head

db-downgrade: ## Roll back one migration
	$(ALEMBIC) downgrade -1

db-current: ## Show the current Alembic revision
	$(ALEMBIC) current

db-history: ## Show Alembic migration history
	$(ALEMBIC) history

pre-commit-install: ## Install git hooks
	$(PRE_COMMIT) install -c $(HOOK_PRE_COMMIT_CONFIG) --install-hooks

pre-commit-run: ## Run all pre-commit hooks on the full repo
	$(PRE_COMMIT) run --all-files --config $(PRE_COMMIT_CONFIG)

commit-example: ## Show the expected Conventional Commit format
	$(CZ) example

commit-check: ## Validate a commit message, e.g. make commit-check COMMIT_MSG="feat(api): add health endpoint"
	$(CZ) check -m "$(COMMIT_MSG)"

bump: ## Bump the version with Commitizen
	$(CZ) bump
