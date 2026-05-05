.PHONY: help install dev run format lint fix check \
	pre-commit-install pre-commit-run commit-example commit-check bump

UV_RUN = uv run
APP_MODULE = main:app
HOST ?= 0.0.0.0
PORT ?= 8000
COMMIT_MSG ?= feat: describe your change
PYTHON_TARGETS = main.py controller model repository usecase

help: ## Show available commands
	@awk 'BEGIN {FS = ":.*## "}; /^[a-zA-Z0-9_-]+:.*## / {printf "%-20s %s\n", $$1, $$2}' Makefile

install: ## Install runtime and dev dependencies
	uv sync --dev

dev: ## Run the API with auto-reload
	$(UV_RUN) uvicorn $(APP_MODULE) --reload --host $(HOST) --port $(PORT)

run: ## Run the API without auto-reload
	$(UV_RUN) uvicorn $(APP_MODULE) --host $(HOST) --port $(PORT)

format: ## Format Python code with Black
	$(UV_RUN) black $(PYTHON_TARGETS)

lint: ## Run linting and auto-fix Ruff issues when possible
	$(UV_RUN) ruff check --fix $(PYTHON_TARGETS)
	$(UV_RUN) flake8 $(PYTHON_TARGETS)

fix: lint format ## Apply automated code quality fixes

check: ## Run the full local quality gate
	$(UV_RUN) black --check $(PYTHON_TARGETS)
	$(UV_RUN) ruff check $(PYTHON_TARGETS)
	$(UV_RUN) flake8 $(PYTHON_TARGETS)
	$(UV_RUN) bandit -r $(PYTHON_TARGETS)

pre-commit-install: ## Install git hooks
	$(UV_RUN) pre-commit install

pre-commit-run: ## Run all pre-commit hooks on the full repo
	$(UV_RUN) pre-commit run --all-files

commit-example: ## Show the expected Conventional Commit format
	$(UV_RUN) cz example

commit-check: ## Validate a commit message, e.g. make commit-check COMMIT_MSG="feat(api): add health endpoint"
	$(UV_RUN) cz check -m "$(COMMIT_MSG)"

bump: ## Bump the version with Commitizen
	$(UV_RUN) cz bump
