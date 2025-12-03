#!/bin/bash

# Railway Service Diagnostics
# This script helps diagnose Railway deployment issues

echo "🔍 Railway Service Diagnostics"
echo "================================"
echo ""

RAILWAY_URL="https://empowering-truth-production.up.railway.app"

echo "Testing backend endpoints..."
echo ""

# Test 1: Health endpoint
echo "1️⃣  Testing /health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" -k "$RAILWAY_URL/health" 2>&1)
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n 1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)

if [ "$HEALTH_CODE" = "200" ]; then
  echo "   ✅ Health endpoint is OK"
  echo "   Response: $HEALTH_BODY"
else
  echo "   ❌ Health endpoint failed (HTTP $HEALTH_CODE)"
  echo "   Response: $HEALTH_BODY"
  echo ""
  echo "   🚨 PROBLEM IDENTIFIED:"
  echo "      The backend service is NOT running on Railway!"
  echo ""
  echo "   📋 Next Steps:"
  echo "      1. Go to https://railway.app"
  echo "      2. Open service 'empowering-truth'"
  echo "      3. Check deployment logs for errors"
  echo "      4. Verify all environment variables are set"
  echo "      5. Redeploy the service"
  echo ""
  exit 1
fi

echo ""

# Test 2: Discord auth endpoint
echo "2️⃣  Testing /api/auth/discord endpoint..."
DISCORD_RESPONSE=$(curl -s -w "\n%{http_code}" -k "$RAILWAY_URL/api/auth/discord" 2>&1)
DISCORD_CODE=$(echo "$DISCORD_RESPONSE" | tail -n 1)
DISCORD_BODY=$(echo "$DISCORD_RESPONSE" | head -n -1)

if [ "$DISCORD_CODE" = "200" ]; then
  echo "   ✅ Discord auth endpoint is OK"
  echo "   Response preview: $(echo "$DISCORD_BODY" | cut -c 1-100)..."
else
  echo "   ❌ Discord auth endpoint failed (HTTP $DISCORD_CODE)"
  echo "   Response: $DISCORD_BODY"
  
  if [[ "$DISCORD_BODY" == *"DISCORD_CLIENT_ID"* ]]; then
    echo ""
    echo "   ⚠️  Environment variable missing: DISCORD_CLIENT_ID"
    echo "      Make sure all Discord variables are set in Railway dashboard"
  fi
fi

echo ""

# Test 3: Diagnostic endpoint
echo "3️⃣  Testing /diagnostic endpoint..."
DIAG_RESPONSE=$(curl -s -w "\n%{http_code}" -k "$RAILWAY_URL/diagnostic" 2>&1)
DIAG_CODE=$(echo "$DIAG_RESPONSE" | tail -n 1)
DIAG_BODY=$(echo "$DIAG_RESPONSE" | head -n -1)

if [ "$DIAG_CODE" = "200" ]; then
  echo "   ✅ Diagnostic endpoint is OK"
  ROUTE_COUNT=$(echo "$DIAG_BODY" | grep -o '"totalRoutes":[0-9]*' | grep -o '[0-9]*')
  echo "   Total routes registered: $ROUTE_COUNT"
  
  if echo "$DIAG_BODY" | grep -q "/api/auth/discord"; then
    echo "   ✅ Discord auth route is registered"
  else
    echo "   ❌ Discord auth route NOT found in registered routes"
  fi
else
  echo "   ⚠️  Diagnostic endpoint not available (HTTP $DIAG_CODE)"
fi

echo ""
echo "================================"
echo "✅ All tests completed!"
echo ""
echo "If you see any ❌ above, please:"
echo "1. Read DISCORD_AUTH_FIX.md for detailed instructions"
echo "2. Check Railway deployment logs"
echo "3. Verify environment variables"
echo "4. Redeploy the service"

