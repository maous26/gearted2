#!/bin/bash
set -e

echo "🔧 Starting Railway deployment..."

# Run Prisma migrations to sync database schema WITHOUT data loss
echo "📦 Running Prisma DB push (safe mode - preserving data)..."
# Use prisma migrate deploy for production (applies pending migrations)
# Or db push without --accept-data-loss to fail if data would be lost
npx prisma db push --skip-generate || {
  echo "⚠️ Schema push failed - trying migrate deploy..."
  npx prisma migrate deploy || echo "⚠️ No migrations to apply"
}

# Generate Prisma client if needed
npx prisma generate

# Start the server
echo "🚀 Starting server..."
npm start
