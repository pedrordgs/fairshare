#!/usr/bin/env bash
set -e

cd /home/fairshare

echo "Running database migrations..."
uv run alembic upgrade head

echo "Starting application..."
exec "$@"
