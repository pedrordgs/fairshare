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

1. Run the development server:
```bash
uv run fastapi dev main.py --reload
```

The API will be available at `http://127.0.0.1:8000`

### API Documentation

Once the server is running, you can access:
- Interactive API docs: `http://127.0.0.1:8000/docs`
- Alternative docs: `http://127.0.0.1:8000/redoc`

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

## Project Structure

```
api/
├── main.py           # FastAPI application entry point
├── pyproject.toml    # Project dependencies and configuration
├── README.md         # This file
└── (future structure)
    ├── models/       # Database models
    ├── schemas/      # Pydantic schemas
    ├── routers/      # API route handlers
    ├── services/     # Business logic
    ├── auth/         # Authentication utilities
    └── db/           # Database configuration
```

## Contributing

When adding new features:
1. Follow the roadmap phases
2. Write tests for new endpoints
3. Update API documentation
4. Ensure code passes linting with `ruff check`

