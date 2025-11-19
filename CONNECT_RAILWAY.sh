#!/usr/bin/env bash
#
# 🚂 GEARTED - Railway Connection Script
# Comprehensive solution for connecting Expo to Railway backend
#

set -e

RAILWAY_URL="https://empowering-truth-production.up.railway.app"
ENV_FILE=".env"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚂  GEARTED - Railway Connection Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Function to update env variable
update_env_var() {
  local key="$1"
  local value="$2"
  
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    # Update existing
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    else
      sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    fi
  else
    # Add new
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

# Step 1: Test Railway backend
echo "📡 Step 1/6: Testing Railway backend..."
HTTP_CODE=$(curl -k -s -o /tmp/railway_health.json -w "%{http_code}" "${RAILWAY_URL}/health" || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ Railway backend is healthy"
  HEALTH_DATA=$(cat /tmp/railway_health.json 2>/dev/null || echo '{}')
  echo "   📊 Status: $(echo "$HEALTH_DATA" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"
else
  echo "   ❌ Railway backend unreachable (HTTP $HTTP_CODE)"
  echo "   🔍 Check Railway deployment at:"
  echo "      https://railway.app"
  exit 1
fi

# Step 2: Update .env
echo ""
echo "🔧 Step 2/6: Configuring environment..."
update_env_var "EXPO_PUBLIC_API_URL" "$RAILWAY_URL"
update_env_var "EXPO_PUBLIC_ENV" "production"
echo "   ✅ .env updated:"
echo "      EXPO_PUBLIC_API_URL=$RAILWAY_URL"
echo "      EXPO_PUBLIC_ENV=production"

# Step 3: Clean all caches
echo ""
echo "🧹 Step 3/6: Cleaning Metro/Expo caches..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf tmp 2>/dev/null || true
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/haste-map-* 2>/dev/null || true
echo "   ✅ All caches cleared"

# Step 4: Kill existing Metro processes
echo ""
echo "🛑 Step 4/6: Stopping existing Metro processes..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2
echo "   ✅ Metro processes stopped"

# Step 5: Determine connection mode
echo ""
echo "🌐 Step 5/6: Select connection mode..."
CONNECTION_MODE="${1:-lan}"

case "$CONNECTION_MODE" in
  lan)
    echo "   📱 Using LAN mode (same WiFi required)"
    CONNECTION_FLAG="--lan"
    ;;
  localhost)
    echo "   🔌 Using localhost mode (USB required)"
    CONNECTION_FLAG="--localhost"
    ;;
  tunnel)
    echo "   🌍 Using tunnel mode (works anywhere, slower)"
    CONNECTION_FLAG="--tunnel"
    ;;
  *)
    echo "   📱 Using default LAN mode"
    CONNECTION_FLAG="--lan"
    ;;
esac

# Step 6: Instructions before starting
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Step 6/6: IMPORTANT PHONE INSTRUCTIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Before scanning the QR code:"
echo ""
echo "1. 🛑 Force quit Expo Go:"
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "   • iPhone: Swipe up → swipe Expo Go up"
  echo "   • Android: Recent apps → swipe Expo Go away"
else
  echo "   • Swipe up from bottom → force close Expo Go"
fi
echo ""
echo "2. ⏰ Wait 3 seconds"
echo ""
echo "3. 📱 Reopen Expo Go"
echo ""
echo "4. 📷 Scan the NEW QR code below"
echo ""
echo "5. ✅ In the app console (shake phone → Show Logs),"
echo "   verify you see:"
echo "   '🔧 [API] Using URL: $RAILWAY_URL'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press ENTER when you're ready to start Metro..."
read -r

# Start Expo
echo ""
echo "🚀 Starting Expo Metro bundler..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "QR CODE APPEARS BELOW:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npx expo start --clear "$CONNECTION_FLAG"

