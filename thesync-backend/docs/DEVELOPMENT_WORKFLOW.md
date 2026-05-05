# Development Workflow

This document is the working agreement for how to build inside this backend repo.
It reflects the current codebase and the tools already configured in `pyproject.toml`.

## Tooling Standard

- `uv` manages the environment and dependency execution.
- The supported runtime is the repo-local `.venv`, not a global Python distribution.
- `Pydantic` defines typed domain and API-facing data models.
- `SQLAlchemy ORM` maps persistence models to the relational schema.
- `Alembic` owns database schema migrations.
- `Ruff` is the primary linter and import-order checker.
- `Black` is the canonical formatter.
- `Flake8` is kept as a secondary validation gate.
- `Bandit` is used for basic Python security scanning.
- `Commitizen` enforces Conventional Commits and supports version bumps.
- `pre-commit` wires the checks into the local git workflow.

The root `Makefile` is the main entrypoint for daily development commands.
`uv` is used to create and sync the virtualenv, but the actual repo commands run through `.venv/bin/python`.

## Clean Architecture Direction

The current repo already contains the right top-level boundaries for a clean-code style backend:

```text
.
├── alembic/
├── alembic.ini
├── main.py
├── controller/
├── usecase/
├── repository/
└── model/
```

Use those boundaries consistently:

- `main.py`
  Keeps application wiring only. Create the FastAPI app, register routers, and compose dependencies here.
- `controller/`
  HTTP-facing code only. Parse requests, call a use case, map the result into an HTTP response.
- `usecase/`
  Business rules live here. This layer should express the application behavior without knowing FastAPI or storage details.
- `repository/`
  Data access and external integration code. SQLAlchemy ORM mappings, engine/session wiring, and persistence adapters belong here.
- `model/`
  Pydantic domain models, shared DTOs, and schema objects used across the application.
- `alembic/`
  Migration history and migration environment for evolving the relational schema safely.

Dependency direction should stay one-way:

```text
controller -> usecase -> repository
            \-> model
repository -> model
main.py    -> controller
```

Keep these rules in mind:

- Keep controllers thin.
- Do not place business rules in route handlers.
- Do not let repositories return raw framework-specific objects if a domain model is clearer.
- Prefer pure functions in `usecase/` where possible.
- Pass dependencies inward instead of importing infrastructure everywhere.

## Daily Workflow

1. Install dependencies:

```bash
make install
```

This creates or updates the project-local `.venv`.

2. Install local git hooks once per machine:

```bash
make pre-commit-install
```

This backend lives inside a monorepo. Use the backend `Makefile` targets for pre-commit so the backend config is used explicitly instead of the repo-root config.

3. Start the API locally:

```bash
make dev
```

4. Apply the current schema locally when database changes are involved:

```bash
make db-upgrade
```

5. While coding, keep the layering intact:

- Add or update request handling in `controller/`.
- Put business behavior in `usecase/`.
- Put storage or external IO in `repository/`.
- Keep Pydantic models in `model/`.
- Keep SQLAlchemy table mappings in `repository/`.
- Keep `main.py` focused on application setup.

6. Before committing, auto-fix what can be fixed:

```bash
make fix
```

7. Run the full local quality gate:

```bash
make check
```

## Schema Workflow

Use Alembic for every schema change. Do not hand-edit the live database and then try to reverse-document it later.

```bash
make db-revision MIGRATION_MESSAGE="create schedule audit log"
make db-upgrade
make db-history
```

Do not run bare `alembic` from whatever global Python happens to be active. Use `make db-*` so the command runs through the repo-local virtualenv.

## Code Quality Workflow

### Ruff

Use Ruff first for fast lint feedback and import sorting. The default local lint command applies safe Ruff auto-fixes:

```bash
make lint
make check
```

Use `make lint` while developing and `make check` before committing or opening a PR. `make check` is the single non-mutating verification command, while `make lint` fixes what Ruff can fix automatically.

Ruff is the primary lint tool in this repo. If Ruff and Flake8 disagree, prefer aligning the code with the configured toolchain rather than adding ad hoc ignores.

### Black

Black owns formatting. Do not hand-format code to fight it. Use `make format` to apply formatting, and let `make check` verify that formatting is clean.

```bash
make format
```

### Bandit

Bandit is part of `make check`, so security scanning is included in the standard verification pass before a commit or PR.

```bash
make check
```

## Commit Workflow

This repo uses Conventional Commits through Commitizen.

See the expected format:

```bash
make commit-example
```

Validate a message before using it:

```bash
make commit-check COMMIT_MSG="feat(api): add adviser availability endpoint"
```

Good examples:

- `feat(api): add schedule creation endpoint`
- `fix(auth): handle expired provider tokens`
- `refactor(usecase): move approval rules out of controller`
- `docs(workflow): add backend development workflow`
- `chore(tooling): add make targets for local quality checks`

Use commit types intentionally:

- `feat` for user-visible behavior
- `fix` for bug fixes
- `refactor` for internal structural changes without behavior changes
- `docs` for documentation-only changes
- `chore` for tooling, maintenance, and non-product code work

## Release Workflow

When the project is ready for a version bump, use Commitizen:

```bash
make bump
```

The version is sourced from `pyproject.toml`, and the configured tag format is `backend-v$version`.

## Minimum Done Definition

A change is not done until all of the following are true:

- The architecture boundary is still clean.
- `make fix` has been run.
- `make check` passes.
- The commit message follows the Conventional Commits format.
- The code is understandable without pushing framework logic into business logic.
