#!/bin/bash

# Discord Auth Configuration Verification Script
# Run this AFTER updating Discord Developer Portal and Railway

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║     DISCORD AUTH - CONFIGURATION VERIFICATION            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

BACKEND_URL="https://gearted2-production-36e5.up.railway.app"
EXPECTED_REDIRECT="https://gearted2-production-36e5.up.railway.app/api/auth/discord/callback"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Testing backend connectivity..."
echo ""

# Test 1: Health Check
echo -n "1️⃣  Health endpoint: "
HEALTH_RESPONSE=$(curl -k -s -w "\n%{http_code}" "$BACKEND_URL/health" 2>&1)
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n 1)

if [ "$HEALTH_CODE" = "200" ]; then
  echo -e "${GREEN}✅ OK${NC}"
else
  echo -e "${RED}❌ FAILED (HTTP $HEALTH_CODE)${NC}"
  echo "   Backend is not responding. Check Railway deployment."
  exit 1
fi

# Test 2: Discord Auth Endpoint
echo -n "2️⃣  Discord auth endpoint: "
DISCORD_RESPONSE=$(curl -k -s "$BACKEND_URL/api/auth/discord" 2>&1)
SUCCESS_CHECK=$(echo "$DISCORD_RESPONSE" | grep -o '"success":true')
AUTH_URL=$(echo "$DISCORD_RESPONSE" | grep -o '"authUrl":"[^"]*"' | cut -d'"' -f4)

if [ "$SUCCESS_CHECK" = '"success":true' ]; then
  echo -e "${GREEN}✅ OK${NC}"
else
  echo -e "${RED}❌ FAILED${NC}"
  echo "   Response: $DISCORD_RESPONSE"
  exit 1
fi

# Test 3: Check Redirect URI in Auth URL
echo -n "3️⃣  Redirect URI configuration: "
if echo "$AUTH_URL" | grep -q "gearted2-production-36e5.up.railway.app"; then
  echo -e "${GREEN}✅ CORRECT${NC}"
  echo "   Using: gearted2-production-36e5.up.railway.app"
else
  echo -e "${YELLOW}⚠️  WARNING${NC}"
  echo "   Auth URL still contains old domain"
  echo "   Update DISCORD_REDIRECT_URI in Railway and redeploy"
fi

# Test 4: Parse and display Discord OAuth URL
echo ""
echo "4️⃣  Discord OAuth Configuration:"
CLIENT_ID=$(echo "$AUTH_URL" | grep -o "client_id=[0-9]*" | cut -d'=' -f2)
REDIRECT_ENCODED=$(echo "$AUTH_URL" | grep -o "redirect_uri=[^&]*" | cut -d'=' -f2-)
REDIRECT_DECODED=$(echo "$REDIRECT_ENCODED" | python3 -c "import sys; from urllib.parse import unquote; print(unquote(sys.stdin.read().strip()))" 2>/dev/null || echo "$REDIRECT_ENCODED")

echo "   Client ID: $CLIENT_ID"
echo "   Redirect URI: $REDIRECT_DECODED"
echo ""

if [ "$REDIRECT_DECODED" = "$EXPECTED_REDIRECT" ]; then
  echo -e "   ${GREEN}✅ Redirect URI matches expected value${NC}"
else
  echo -e "   ${YELLOW}⚠️  Redirect URI does not match${NC}"
  echo "   Expected: $EXPECTED_REDIRECT"
  echo "   Got:      $REDIRECT_DECODED"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Test 5: Check Frontend Configuration
echo "5️⃣  Frontend Configuration:"
FRONTEND_API=$(grep -A 1 "const RAILWAY_URL" services/api.ts | grep "https://" | cut -d"'" -f2)
echo "   API URL in services/api.ts: $FRONTEND_API"

if [ "$FRONTEND_API" = "$BACKEND_URL" ]; then
  echo -e "   ${GREEN}✅ Frontend points to correct backend${NC}"
else
  echo -e "   ${RED}❌ Frontend API URL mismatch${NC}"
  echo "   Expected: $BACKEND_URL"
  echo "   Got:      $FRONTEND_API"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 NEXT STEPS:"
echo ""

# Check if everything is ready
ALL_READY=true

if [ "$HEALTH_CODE" != "200" ] || [ "$SUCCESS_CHECK" != '"success":true' ]; then
  ALL_READY=false
fi

if [ "$ALL_READY" = true ]; then
  echo -e "${GREEN}✅ All backend checks passed!${NC}"
  echo ""
  echo "To complete the setup:"
  echo ""
  echo "1. Make sure you updated Discord Developer Portal:"
  echo "   - Go to: https://discord.com/developers/applications"
  echo "   - Application ID: $CLIENT_ID"
  echo "   - OAuth2 → Redirects → Add: $EXPECTED_REDIRECT"
  echo ""
  echo "2. Restart your React Native app:"
  echo "   npx expo start --clear"
  echo ""
  echo "3. Test Discord login in your app!"
  echo ""
else
  echo -e "${RED}❌ Some checks failed. Please fix the issues above.${NC}"
  echo ""
fi

echo "═══════════════════════════════════════════════════════════"
echo ""

