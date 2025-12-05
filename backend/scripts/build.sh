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

echo "📋 Transpiling AdminJS setup file separately..."
mkdir -p dist/config
npx tsc src/config/adminjs.setup.ts --outDir dist/config --module commonjs --target ES2020 --esModuleInterop --skipLibCheck --allowSyntheticDefaultImports --moduleResolution bundler

echo "✅ Build completed successfully!"

