#!/bin/sh
set -e

cd /app

npm i

exec "$@"
