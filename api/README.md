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

## Project Structure

This project follows a modular structure within the `src/` directory, inspired by the [FastAPI Bigger Applications](https://fastapi.tiangolo.com/tutorial/bigger-applications/) pattern:

```
api/
├── src/                 # Source code organized in modules
│   ├── auth/            # Authentication module
│   │   ├── router.py    # API routes for auth
│   │   ├── models.py    # Data models
│   │   ├── service.py   # Business logic
│   │   └── ...          # Other files as needed
│   ├── core/            # Core functionality
│   └── main.py          # App entry point
├── docker/              # Docker configuration
├── pyproject.toml       # Project dependencies and configuration
├── docker-compose.yml   # Docker setup
└── README.md            # This file
```

### API Structure

The backend code is organized in modules under `src/`:

- `auth/`: Handles authentication, user management, and security
- `core/`: Provides core functionality like configuration and health checks

Each module is self-contained with its own router, models, services, and tests.

To set up a new module (e.g., for "expenses"), create `src/expenses/` with files like `router.py`, `models.py`, `service.py`, etc., following the pattern of existing modules.

For detailed instructions, see [AGENTS.md](../AGENTS.md).

## Development Roadmap

### Phase 1: Authentication & User Management
- [ ] **Google OAuth Integration**
  - Set up Google OAuth 2.0 flow
  - Handle OAuth callbacks
  - Store user information from Google

- [ ] **Email/Password Authentication**
  - User registration endpoint
  - Login endpoint with JWT tokens
  - Password hashing and validation
  - Email verification (optional)

- [ ] **User Profile Management**
  - GET `/api/users/me` - Get current user profile
  - PUT `/api/users/me` - Update user profile
  - DELETE `/api/users/me` - Delete user account

### Phase 2: Expense Groups
- [ ] **Group CRUD Operations**
  - POST `/api/groups` - Create a new expense group
  - GET `/api/groups` - List all groups for authenticated user
  - GET `/api/groups/{group_id}` - Get group details
  - PUT `/api/groups/{group_id}` - Update group information
  - DELETE `/api/groups/{group_id}` - Delete a group

- [ ] **Group Member Management**
  - POST `/api/groups/{group_id}/members` - Add user to group
  - GET `/api/groups/{group_id}/members` - List group members
  - DELETE `/api/groups/{group_id}/members/{user_id}` - Remove user from group

### Phase 3: Expense Management
- [ ] **Expense CRUD Operations**
  - POST `/api/groups/{group_id}/expenses` - Add expense to group
  - GET `/api/groups/{group_id}/expenses` - List all expenses in group
  - GET `/api/groups/{group_id}/expenses/{expense_id}` - Get expense details
  - PUT `/api/groups/{group_id}/expenses/{expense_id}` - Update expense
  - DELETE `/api/groups/{group_id}/expenses/{expense_id}` - Remove expense

- [ ] **Expense Settlement**
  - POST `/api/groups/{group_id}/expenses/{expense_id}/settle` - Mark expense as settled
  - GET `/api/groups/{group_id}/expenses/settled` - List settled expenses
  - GET `/api/groups/{group_id}/expenses/unsettled` - List unsettled expenses

### Phase 4: Balance Calculation
- [ ] **Balance Tracking**
  - GET `/api/groups/{group_id}/balances` - Get balance summary (who owes whom)
  - GET `/api/groups/{group_id}/balances/{user_id}` - Get balance for specific user
  - Calculate balances based on expenses and settlements

### Phase 5: Additional Features
- [ ] **Notifications**
  - Email notifications for group invitations
  - Notifications for new expenses
  - Reminders for unsettled balances

- [ ] **Expense Categories**
  - Categorize expenses (food, utilities, rent, etc.)
  - Filter expenses by category

- [ ] **Reports & Analytics**
  - Spending summaries by user
  - Group spending trends
  - Export expense data

## Technology Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL (to be configured)
- **Authentication**: JWT tokens, Google OAuth
- **Validation**: Pydantic
- **Code Quality**: Ruff

## Contributing

When adding new features:
1. Follow the roadmap phases
2. Write tests for new endpoints in the module's `tests/` directory
3. Update API documentation
4. Ensure code passes linting with `ruff check`
