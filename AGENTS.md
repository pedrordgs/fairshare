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
│   ├── routers/            # API route modules (APIRouter instances)
|   ├── models/             # Database models
|   ├── schemas/            # Pydantic request/response schemas
|   ├── core/               # Shared functionality
|   |   └── dependencies.py # Shared dependency injection functions
│   ├── main.py             # App entry point - includes all routers
│   ├── pyproject.toml      # Python dependencies (managed by uv)
│   └── docker-compose.yml  # Docker configuration
├── web/                    # React frontend (TBD)
└── README.md               # Project documentation
```

## Architecture Patterns

### FastAPI Structure

This project follows the [FastAPI Bigger Applications](https://fastapi.tiangolo.com/tutorial/bigger-applications/) pattern:

1. **Routers** (`routers/`): Each file defines an `APIRouter` with related endpoints
2. **Dependencies** (`dependencies.py`): Reusable functions injected via `Depends()`
3. **Internal** (`internal/`): Modules requiring special handling (e.g., admin routes)
4. **Main** (`main.py`): Assembles the app and includes all routers

### Adding New Endpoints

When adding new API endpoints:

1. Create or modify a router file in `api/routers/`
2. Define routes using `APIRouter` with appropriate prefix and tags
3. Import and include the router in `main.py`
4. Update `routers/__init__.py` to export the new module
5. Add tests in `routers/tests/`

Example router pattern:
```python
from fastapi import APIRouter, Depends
from dependencies import verify_token

router = APIRouter(prefix="/resource", tags=["resource"])

@router.get("/")
async def list_resources():
    return []

@router.get("/{id}")
async def get_resource(id: int):
    return {"id": id}
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

- Place tests in `routers/tests/` directory
- Name test files `test_<module>.py`
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

## Future Additions (Planned)

When implementing new features, anticipate these directories:
- `api/models/` - Ddatabase models
- `api/schemas/` - Pydantic request/response schemas
- `api/core/`- Shared functionality

## Common Tasks

### Add a new API resource

1. Create `api/routers/<resource>.py` with an APIRouter
2. Add CRUD endpoints (GET, POST, PUT, DELETE)
3. Include router in `main.py`
4. Add tests in `api/routers/tests/test_<resource>.py`

### Add shared dependency

1. Define the dependency function in `dependencies.py`
2. Use `Depends()` to inject it in route handlers
3. For router-wide dependencies, pass to `APIRouter()` or `include_router()`

## Notes for AI Agents

- Always check existing patterns in the codebase before implementing
- Use `uv` for Python dependency management, not pip
- The API runs on port 8000 by default
- Follow the FastAPI Bigger Applications pattern for new modules
- Prefer async functions for I/O operations
- Include type hints and docstrings

