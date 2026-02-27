# FairShare Web

React frontend for the FairShare expense splitting application.

## Overview

This is the React frontend for FairShare, providing the user interface for managing expense groups, adding and splitting expenses, and viewing settlement balances.

## Quick start

### Prerequisites

- Docker

### Installation

Run the development server:

```bash
docker compose up --build
```

The web app will be available at `http://localhost:5173`

## Scripts

Run commands inside the Docker container using `docker compose exec web <command>`:

| Command                 | Description                  |
| ----------------------- | ---------------------------- |
| `npm run dev`           | Start development server     |
| `npm run build`         | Build for production         |
| `npm run lint`          | Run ESLint                   |
| `npm run lint:fix`      | Fix ESLint issues            |
| `npm run format`        | Format code with Prettier    |
| `npm run format:check`  | Check code formatting        |
| `npm run preview`       | Preview production build     |
| `npm run type-check`    | Run TypeScript type checking |
| `npm run test`          | Run tests                    |
| `npm run test:watch`    | Run tests in watch mode      |
| `npm run test:coverage` | Run tests with coverage      |
