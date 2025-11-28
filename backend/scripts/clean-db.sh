#!/bin/bash

# Database cleanup script using admin secret key
# This script calls the admin endpoint to clean the database

API_URL="https://empowering-truth-production.up.railway.app"
ADMIN_SECRET="gearted-admin-2025"

echo "🧹 Starting database cleanup..."
echo ""

# Call the admin cleanup endpoint (direct route, no middleware)
response=$(curl -s -X DELETE \
  "${API_URL}/admin-clean-db" \
  -H "X-Admin-Secret: ${ADMIN_SECRET}" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"
echo ""

# Check if successful
if echo "$response" | grep -q '"success":true'; then
  echo "✅ Database cleanup completed successfully!"
else
  echo "❌ Database cleanup failed!"
  exit 1
fi
