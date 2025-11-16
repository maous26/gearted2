#!/bin/bash
set -e

echo "🔧 Building backend..."

# Provide a dummy DATABASE_URL for Prisma generate during build
# The real DATABASE_URL will be used at runtime
export DATABASE_URL="${DATABASE_URL:-postgresql://dummy:dummy@localhost:5432/dummy}"

echo "📦 Generating Prisma Client..."
npx prisma generate

echo "🔨 Compiling TypeScript..."
npx tsc

echo "✅ Build completed successfully!"

