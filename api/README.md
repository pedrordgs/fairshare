# FairShare API

FastAPI backend for the FairShare expense splitting application.

## Overview

This API provides the backend services for managing expense groups, tracking expenses, calculating balances, and handling user authentication.

## Setup

### Prerequisites

- Python 3.12+
- [uv](https://github.com/astral-sh/uv) (recommended)

### Installation

1. Install dependencies using uv:
```bash
uv sync
```

2. Run the development server:
```bash
docker compose up --build
```

The API will be available at `http://127.0.0.1:8000`

### Database Migrations

This project uses Alembic for database schema migrations.

#### Development

Migrations run automatically when the container starts. However, you can also run them manually:

```bash
# Migrations should be run inside container
docker compose exec api bash

# Generate a new migration
uv run alembic revision --autogenerate -m "Add user table"

# Apply migrations
uv run alembic upgrade head

# Rollback migrations
uv run alembic downgrade -1
```

#### Adding New Models

When creating new database models:

1. Define the model in the appropriate module's `models.py` file
2. Import the model in `src/db/models/__init__.py` (critical for Alembic to detect it)
3. Generate a migration: `uv run alembic revision --autogenerate -m "Description"`
4. Review the generated migration file in `src/alembic/versions/`
5. Apply the migration: `uv run alembic upgrade head`

### API Documentation

Once the server is running, you can access:
- Interactive API docs: `http://127.0.0.1:8000/docs`
- Alternative docs: `http://127.0.0.1:8000/redoc`
