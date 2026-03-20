#!/bin/sh
set -e

echo "Running database migrations..."

# If the database already has tables but no migration history,
# mark the initial migration as already applied (baseline)
npx prisma migrate resolve --applied 0_init 2>/dev/null || true

# Apply any pending migrations (safe - never drops data)
npx prisma migrate deploy

echo "Running seed (upsert only - won't overwrite existing data)..."
npx tsx prisma/seed.ts

echo "Starting server..."
exec node dist/index.js
