#!/usr/bin/env bash

# Automates switching Expo to the Railway backend, clearing caches,
# and starting Metro with a stable connection mode (default: tunnel).

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

MODE="${1:-tunnel}"
API_URL="${EXPO_RAILWAY_URL:-https://empowering-truth-production.up.railway.app}"
ENVIRONMENT_VALUE="${EXPO_RAILWAY_ENV:-production}"
ENV_FILE="${PROJECT_ROOT}/.env"

if [[ "$(uname -s)" == "Darwin" ]]; then
  SED_INPLACE=(-i '')
else
  SED_INPLACE=(-i)
fi

update_env_var() {
  local key="$1"
  local value="$2"

  if [[ ! -f "$ENV_FILE" ]]; then
    touch "$ENV_FILE"
  fi

  if grep -q "^${key}=" "$ENV_FILE"; then
    sed "${SED_INPLACE[@]}" "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

echo "⚙️  Syncing Expo env with Railway..."
update_env_var "EXPO_PUBLIC_API_URL" "$API_URL"
update_env_var "EXPO_PUBLIC_ENV" "$ENVIRONMENT_VALUE"
echo "   → EXPO_PUBLIC_API_URL set to $API_URL"
echo "   → EXPO_PUBLIC_ENV set to $ENVIRONMENT_VALUE"

echo
echo "🧹 Clearing Expo/Metro caches (.expo, node_modules/.cache, tmp)..."
rm -rf .expo node_modules/.cache tmp
echo "   → Caches cleared."

echo
echo "📱 Reminder: Force-quit Expo Go on your device before continuing."
echo "   After the QR code appears, reopen Expo Go and scan it again."

case "$MODE" in
  tunnel)
    CONNECTION_FLAG="--tunnel"
    ;;
  lan)
    CONNECTION_FLAG="--lan"
    ;;
  localhost)
    CONNECTION_FLAG="--localhost"
    ;;
  *)
    CONNECTION_FLAG="$MODE"
    ;;
esac

echo
echo "🚀 Starting Expo with cache clear (${CONNECTION_FLAG})..."
echo "   Press Ctrl+C to stop Metro when you're done."
echo

npx expo start --clear "$CONNECTION_FLAG"

