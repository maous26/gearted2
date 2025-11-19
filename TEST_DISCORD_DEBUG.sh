#!/bin/bash

# 🔍 Script de Test Discord OAuth avec Debug
# Ce script vérifie que tout est prêt pour tester Discord OAuth

echo "🔍 Test Discord OAuth - Mode Debug"
echo "=================================="
echo ""

# 1. Vérifier le backend
echo "📡 1. Vérification du backend Railway..."
HEALTH=$(curl -s "https://empowering-truth-production.up.railway.app/health")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo "✅ Backend en ligne"
  echo "   Uptime: $(echo $HEALTH | grep -o '"uptime":[0-9.]*' | cut -d':' -f2)s"
else
  echo "❌ Backend hors ligne!"
  echo "   Réponse: $HEALTH"
  exit 1
fi
echo ""

# 2. Vérifier l'endpoint Discord
echo "🎮 2. Vérification endpoint Discord OAuth..."
DISCORD=$(curl -s "https://empowering-truth-production.up.railway.app/api/auth/discord")
if echo "$DISCORD" | grep -q '"success":true'; then
  echo "✅ Endpoint Discord fonctionnel"
  CLIENT_ID=$(echo "$DISCORD" | grep -o 'client_id=[0-9]*' | cut -d'=' -f2)
  echo "   CLIENT_ID détecté: $CLIENT_ID"
else
  echo "❌ Endpoint Discord ne répond pas correctement!"
  echo "   Réponse: $DISCORD"
  exit 1
fi
echo ""

# 3. Vérifier les processus Expo
echo "📱 3. Vérification Expo..."
if pgrep -f "expo" > /dev/null; then
  echo "✅ Expo est en cours d'exécution"
  echo "   PID: $(pgrep -f "expo" | head -1)"
else
  echo "⚠️  Expo n'est pas démarré"
  echo "   → Lancez: npm start"
fi
echo ""

# 4. Instructions
echo "📋 Instructions:"
echo "━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  Si Expo n'est pas démarré:"
echo "   npm start"
echo ""
echo "2️⃣  Dans un autre terminal, surveiller les logs Railway:"
echo "   railway logs --follow"
echo ""
echo "3️⃣  Sur votre téléphone:"
echo "   • Ouvrir l'app Gearted"
echo "   • Secouer → Reload (pour charger le nouveau code)"
echo "   • Aller sur Login"
echo "   • Cliquer sur 'Se connecter avec Discord'"
echo ""
echo "4️⃣  Observer les logs détaillés:"
echo "   • Terminal Expo: voir les steps frontend"
echo "   • Terminal Railway: voir les steps backend"
echo ""
echo "🔍 Logs attendus:"
echo "━━━━━━━━━━━━━━━"
echo "Frontend (Expo):"
echo "  🔍 [DISCORD AUTH] Step 1: Getting auth URL..."
echo "  ✅ [DISCORD AUTH] Step 1: Auth URL received..."
echo "  🔍 [DISCORD AUTH] Step 2: Opening browser..."
echo "  ✅ [DISCORD AUTH] Step 2: Browser result: success"
echo "  ... (jusqu'à Step 5)"
echo ""
echo "Backend (Railway):"
echo "  🔍 [DISCORD CALLBACK] Step 1: Received callback"
echo "  ✅ [DISCORD CALLBACK] Code received..."
echo "  ... (jusqu'à Step 6)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📖 Documentation complète: DISCORD_DEBUG_READY.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Tout est prêt pour tester Discord OAuth!"
echo "   Suivez les instructions ci-dessus. 🚀"
echo ""
