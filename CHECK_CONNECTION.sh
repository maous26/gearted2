#!/usr/bin/env bash
#
# 🔍 Quick connection diagnostic
#

RAILWAY_URL="https://empowering-truth-production.up.railway.app"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 GEARTED - Connection Diagnostic"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check 1: Railway backend
echo "1️⃣  Testing Railway backend..."
HTTP_CODE=$(curl -k -s -o /tmp/health.json -w "%{http_code}" "${RAILWAY_URL}/health" 2>&1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ Railway backend: HEALTHY"
  HEALTH=$(cat /tmp/health.json 2>/dev/null)
  echo "   📊 Response: $HEALTH"
else
  echo "   ❌ Railway backend: UNREACHABLE (HTTP $HTTP_CODE)"
fi

echo ""

# Check 2: Search API
echo "2️⃣  Testing Search API..."
SEARCH_RESULT=$(curl -k -s "${RAILWAY_URL}/api/search/items?query=Tokyo" 2>&1)
ITEM_COUNT=$(echo "$SEARCH_RESULT" | grep -o '"id"' | wc -l | tr -d ' ')

if [ "$ITEM_COUNT" -ge 5 ]; then
  echo "   ✅ Search API: WORKING ($ITEM_COUNT items found)"
else
  echo "   ❌ Search API: FAILED (found $ITEM_COUNT items, expected 5+)"
fi

echo ""

# Check 3: .env configuration
echo "3️⃣  Checking .env configuration..."
if [ -f ".env" ]; then
  # Try to read .env (may fail due to permissions)
  ENV_CONTENT=$(cat .env 2>/dev/null || echo "")
  
  if [ -n "$ENV_CONTENT" ]; then
    if echo "$ENV_CONTENT" | grep -q "empowering-truth-production"; then
      echo "   ✅ .env points to Railway"
      echo "$ENV_CONTENT" | grep "EXPO_PUBLIC_API_URL"
    else
      echo "   ⚠️  .env NOT configured for Railway"
      echo "$ENV_CONTENT" | grep "EXPO_PUBLIC_API_URL" || echo "   (EXPO_PUBLIC_API_URL not found)"
    fi
  else
    echo "   ⚠️  .env file exists but cannot be read"
    echo "   💡 This is OK - script will configure it when you run CONNECT_RAILWAY.sh"
  fi
else
  echo "   ⚠️  .env file not found"
  echo "   💡 Will be created when you run CONNECT_RAILWAY.sh"
fi

echo ""

# Check 4: Metro/Expo processes
echo "4️⃣  Checking Metro processes..."
METRO_COUNT=$(pgrep -f "expo start|metro" | wc -l | tr -d ' ')
if [ "$METRO_COUNT" -gt 0 ]; then
  echo "   ⚠️  Metro is running ($METRO_COUNT process(es))"
  echo "   💡 Tip: Kill with: pkill -f 'expo start' && pkill -f 'metro'"
else
  echo "   ✅ No Metro processes running"
fi

echo ""

# Check 5: Cache directories
echo "5️⃣  Checking cache directories..."
CACHE_DIRS=(
  ".expo"
  "node_modules/.cache"
  "tmp"
)

CACHE_FOUND=0
for dir in "${CACHE_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    SIZE=$(du -sh "$dir" 2>/dev/null | cut -f1)
    echo "   📁 $dir: $SIZE"
    CACHE_FOUND=1
  fi
done

if [ $CACHE_FOUND -eq 0 ]; then
  echo "   ✅ No cache directories found (clean)"
else
  echo "   💡 Tip: Clear with: rm -rf .expo node_modules/.cache tmp"
fi

echo ""

# Check 6: Network connectivity
echo "6️⃣  Checking network connectivity..."
if ping -c 1 google.com &>/dev/null; then
  echo "   ✅ Internet connection: OK"
else
  echo "   ❌ Internet connection: FAILED"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Generate summary
ISSUES=0

if [ "$HTTP_CODE" != "200" ]; then
  echo "❌ Railway backend unreachable"
  ISSUES=$((ISSUES + 1))
fi

if [ "$ITEM_COUNT" -lt 5 ]; then
  echo "❌ Search API not working"
  ISSUES=$((ISSUES + 1))
fi

ENV_CHECK=$(cat .env 2>/dev/null | grep -q "empowering-truth-production" && echo "ok" || echo "fail")
if [ "$ENV_CHECK" != "ok" ]; then
  echo "⚠️  .env needs configuration (will be auto-fixed by script)"
fi

if [ "$METRO_COUNT" -gt 0 ]; then
  echo "⚠️  Old Metro processes still running"
fi

if [ $ISSUES -eq 0 ]; then
  echo ""
  echo "✅ ALL CHECKS PASSED!"
  echo ""
  echo "Your setup is ready. Run:"
  echo "  ./CONNECT_RAILWAY.sh lan"
  echo ""
else
  echo ""
  echo "⚠️  Found $ISSUES issue(s)"
  echo ""
  echo "To fix, run:"
  echo "  ./CONNECT_RAILWAY.sh lan"
  echo ""
fi

