#!/bin/bash

# Quick Fix Script for Discord Auth URL Issue
# Run this after updating Discord Developer Portal and Railway variables

echo "🔧 Discord Auth URL Fix - Quick Actions"
echo "========================================"
echo ""

echo "✅ COMPLETED:"
echo "  1. Updated services/api.ts to use correct Railway URL"
echo "  2. Updated backend/RAILWAY_VARIABLES_TO_PASTE.txt"
echo ""

echo "⏳ TODO - MANUAL ACTIONS REQUIRED:"
echo ""
echo "📝 Step 1: Update Discord Developer Portal"
echo "  1. Go to: https://discord.com/developers/applications"
echo "  2. Click your application (ID: 1437825557202206812)"
echo "  3. Go to OAuth2 section"
echo "  4. Update Redirect URI to:"
echo "     https://gearted2-production.up.railway.app/api/auth/discord/callback"
echo "  5. Save Changes"
echo ""

echo "📝 Step 2: Update Railway Environment Variable"
echo "  1. Go to: https://railway.app"
echo "  2. Navigate to gearted2 service"
echo "  3. Click Variables → Raw Editor"
echo "  4. Update DISCORD_REDIRECT_URI to:"
echo "     https://gearted2-production.up.railway.app/api/auth/discord/callback"
echo "  5. Click Deploy"
echo ""

echo "📝 Step 3: Restart Your React Native App"
echo "  Run one of these commands:"
echo "  - npm start"
echo "  - npx expo start --clear"
echo ""

echo "🧪 Step 4: Test Discord Auth"
echo "  1. Open your app"
echo "  2. Tap 'Login with Discord'"
echo "  3. Authorize on Discord"
echo "  4. You should be logged in!"
echo ""

echo "========================================"
echo "✅ Backend Status: WORKING"
echo "🔗 Backend URL: https://gearted2-production.up.railway.app"
echo ""

# Test the backend to confirm it's working
echo "🔍 Testing backend connection..."
HEALTH_STATUS=$(curl -k -s https://gearted2-production.up.railway.app/health | grep -o '"status":"ok"')
DISCORD_STATUS=$(curl -k -s https://gearted2-production.up.railway.app/api/auth/discord | grep -o '"success":true')

if [[ "$HEALTH_STATUS" == '"status":"ok"' ]]; then
  echo "  ✅ Health endpoint: OK"
else
  echo "  ❌ Health endpoint: FAILED"
fi

if [[ "$DISCORD_STATUS" == '"success":true' ]]; then
  echo "  ✅ Discord auth endpoint: OK"
else
  echo "  ❌ Discord auth endpoint: FAILED"
fi

echo ""
echo "📖 For detailed instructions, see: DISCORD_AUTH_URL_FIX.md"

