#!/usr/bin/env bash
set -e

echo "Running database migrations..."
uv run alembic upgrade head

echo "Starting application..."
exec "$@"
