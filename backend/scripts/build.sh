#!/bin/bash
set -e

echo "🔧 Building backend..."

# Check if DATABASE_URL is set, if not use dummy for build only
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set, using dummy for Prisma generate (build only)"
  export DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
else
  echo "✅ DATABASE_URL detected from Railway PostgreSQL"
fi

echo "📦 Generating Prisma Client..."
npx prisma generate

echo "🔨 Compiling TypeScript..."
npx tsc

echo "📋 Copying excluded AdminJS setup file..."
mkdir -p dist/config
cp src/config/adminjs.setup.ts dist/config/adminjs.setup.js

echo "✅ Build completed successfully!"

