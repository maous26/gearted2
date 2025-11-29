#!/bin/bash
set -e

echo "🔧 Starting Railway deployment..."

# Run Prisma DB push in the background to not block the server startup
echo "📦 Running Prisma DB push (non-blocking)..."
npx prisma db push --accept-data-loss --skip-generate &

# Wait a bit for Prisma to start
sleep 5

# Start the server
echo "🚀 Starting server..."
npm start
