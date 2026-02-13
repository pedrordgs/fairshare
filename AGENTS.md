# FairShare

FairShare is an expense splitting and settlement tracking application.

In this application users can **create expense groups**, **add other users to expense groups**, **create expenses inside groups** and **set expense as settled**.

## Technology Stack

- **Backend**: FastAPI (Python 3.13)
- **Frontend**: Vite + React
- **Database**: PostgreSQL (with Alembic for migration management)

## Project Structure

This project is a monorepo with backend and frontend:

```
fairshare/
├── api/                    # FastAPI backend
└── web/                    # React frontend
```

## API

### Architecture Patterns

This project follows a modular structure within the `src/` directory, inspired by the [FastAPI Bigger Applications](https://fastapi.tiangolo.com/tutorial/bigger-applications/) pattern:

1. **Modules** (`src/<module>/`): Each subdirectory represents a feature area (e.g., auth, core)
2. **Routers** (`router.py`): Each module defines an `APIRouter` with related endpoints
3. **Models** (`models.py`): Data models and schemas
4. **Services** (`service.py`): Business logic functions
5. **Dependencies** (`dependencies.py`): Reusable dependency injection functions
6. **Main** (`main.py`): Assembles the app and includes all module routers


### Development Commands

```bash
# Install dependencies
uv sync

# Run linter
uv run ruff check .

# Format code
uv run ruff format .

# Generate a new migration from model changes
uv run alembic revision --autogenerate -m "Description"

# Apply migrations to database
uv run alembic upgrade head

# Rollback one migration
uv run alembic downgrade -1

# View migration history
uv run alembic history

# View current revision
uv run alembic current
```

### Important Notes

- Always check existing patterns in the codebase before implementing
- Use `uv` for Python dependency management
- Prefer async functions for I/O operations
- Incude type hints
- Commands should be run inside `api` docker container
- Avoid creating useless variables. For example: `group_id = group.id`. In this case, we should always use `group.id` when we need
- Only use `assert` on tests, avoid using it in business logic


## WebApp

### Architecture Patterns

This project follows a modern React architecture with TypeScript, inspired by feature-based organization:

1. **Components** (`src/components/`): Reusable UI components with variant system (Button, Card, etc.)
2. **Pages** (`src/pages/`): Route-level components representing application pages
3. **Hooks** (`src/hooks/`): Custom React hooks for reusable state logic
4. **Services** (`src/services/`): API layer with axios configuration and interceptors
5. **Schema** (`src/schema/`): Type-safe Zod schemas for data validation
6. **Main** (`src/main.tsx`): Entry point with React Query client setup

### Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Type checking
npm run type-check
```

### Important Notes

- Use **TanStack Query**, **TanStack Forms** and **TanStack Router**.
- Use **Zod** schema validation
- Follow the existing component variant system for consistent UI
- Implement responsive design using Tailwind's mobile-first approach
- Prefer TypeScript strict mode and comprehensive type coverage
- **Always use the `frontend-design` skill** for any design/template writing, UI components, or visual interface work
- Commands should be run inside `web` docker container


## Local enviroment

This projects uses `docker` and `docker compose` to setup and run a development local environment. Every development command should be run inside respective docker container where the app is running.

### Useful commands

```bash
# Run local enviroment
docker compose up

# Build and run local enviroment
docker compose up --build
```
