#!/bin/sh
set -eu

echo "Running pending database migrations..."
./node_modules/.bin/typeorm migration:run -d dist/database/data-source.js

echo "Starting NestJS API..."
exec node dist/main.js
