# AGENTS.md

This file provides guidance for AI agents working with the FairShare codebase.

## Project Overview

FairShare is an expense splitting and settlement tracking application with:
- **Backend**: FastAPI (Python 3.12+)
- **Frontend**: React (planned)
- **Database**: PostgreSQL (planned)

## Repository Structure

```
fairshare/
├── api/                    # FastAPI backend
│   ├── src/                # Source code organized in modules
│   │   ├── auth/           # Authentication module (example)
│   │   │   ├── router.py   # API routes
│   │   │   ├── models.py   # Data models
│   │   │   ├── service.py  # Business logic
│   │   │   └── ...         # Other files as needed
│   │   ├── core/           # Core functionality
│   │   └── main.py         # App entry point
│   ├── docker/             # Docker configuration
│   ├── pyproject.toml      # Python dependencies (managed by uv)
│   └── docker-compose.yml  # Docker configuration
├── web/                    # React frontend (TBD)
└── README.md               # Project documentation
```

## Architecture Patterns

### FastAPI Structure

This project follows a modular structure within the `src/` directory, inspired by the [FastAPI Bigger Applications](https://fastapi.tiangolo.com/tutorial/bigger-applications/) pattern:

1. **Modules** (`src/<module>/`): Each subdirectory represents a feature area (e.g., auth, core)
2. **Routers** (`router.py`): Each module defines an `APIRouter` with related endpoints
3. **Models** (`models.py`): Data models and schemas
4. **Services** (`service.py`): Business logic functions
5. **Dependencies** (`dependencies.py`): Reusable dependency injection functions
6. **Main** (`main.py`): Assembles the app and includes all module routers

### Adding New Endpoints

When adding new API endpoints:

1. Identify or create the appropriate module in `src/`
2. Add routes to the module's `router.py` using `APIRouter` with appropriate prefix and tags
3. Import and include the router in `main.py`
4. Add tests in the module's `tests/` directory

Example router pattern:
```python
from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
async def login():
    return {"token": "example"}
```

## Development Commands

### API Development

```bash
cd api

# Install dependencies
uv sync

# Run development server
docker compose up --build

# Run tests
docker compose exec api uv run pytest

# Run linter
uv run ruff check .

# Format code
uv run ruff format .
```

### Docker

```bash
cd api
docker-compose up --build
```

## Code Style Guidelines

- **Python**: Follow PEP 8, enforced by Ruff
- **Type hints**: Use type annotations for all function signatures
- **Docstrings**: Use docstrings for modules, classes, and public functions
- **Async**: Use `async def` for route handlers

## Testing Guidelines

- Place tests in `<module>/tests/` directory
- Name test files `test_<component>.py`
- Use pytest fixtures for common setup
- Test both success and error cases

Example test:
```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_alive():
    response = client.get("/health/alive/")
    assert response.status_code == 200
    assert response.json() == "ok"
```

## Key Dependencies

- **FastAPI**: Web framework
- **Pydantic**: Data validation and serialization
- **uvicorn**: ASGI server (used by FastAPI CLI)
- **pytest**: Testing framework
- **ruff**: Linting and formatting

## Setting up a New Module (App/Lib)

To add a new feature area or "app/lib", create a new directory under `api/src/` with the following structure:

- `__init__.py`: Package initialization
- `router.py`: FastAPI router with endpoints
- `models.py`: Pydantic models or database models
- `service.py`: Business logic functions
- `dependencies.py`: Dependency injection functions (if needed)
- `tests/`: Unit tests for the module

Example: To add an "expenses" module, create `api/src/expenses/` with the above files, following the pattern of the `auth` module.

Then, import the router in `main.py` and include it in the app.

## Common Tasks

### Add a new API resource

1. Create a new module directory in `api/src/<resource>/`
2. Add `router.py` with an APIRouter and CRUD endpoints
3. Add `models.py`, `service.py`, etc. as needed
4. Include the router in `main.py`
5. Add tests in `<resource>/tests/test_<resource>.py`

### Add shared dependency

1. Define the dependency function in the appropriate module's `dependencies.py`
2. Use `Depends()` to inject it in route handlers
3. For module-wide dependencies, pass to `APIRouter()` or `include_router()`

## Notes for AI Agents

- Always check existing patterns in the codebase before implementing
- Use `uv` for Python dependency management, not pip
- The API runs on port 8000 by default
- Follow the modular structure under `src/` for new features; create new modules for new domains
- Do not create top-level directories in `api/` for new features; organize into modules under `src/`
- When adding new functionality, follow the pattern of existing modules (e.g., auth)
- Prefer async functions for I/O operations
- Include type hints and docstrings

