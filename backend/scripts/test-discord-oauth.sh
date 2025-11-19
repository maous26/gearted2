#!/bin/bash

# Script de test Discord OAuth
# Usage: ./scripts/test-discord-oauth.sh

echo "🧪 Test Discord OAuth - Gearted"
echo "================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL de base (modifier selon environnement)
if [ "$1" = "prod" ]; then
    BASE_URL="https://empowering-truth-production.up.railway.app"
    echo "🌍 Mode: PRODUCTION"
else
    BASE_URL="http://localhost:3000"
    echo "💻 Mode: LOCAL"
fi

echo "URL: $BASE_URL"
echo ""

# Test 1: Health check
echo "📍 Test 1: Health Check"
echo "─────────────────────────"
HEALTH=$(curl -s "$BASE_URL/health")
if echo "$HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✅ Backend accessible${NC}"
else
    echo -e "${RED}❌ Backend inaccessible${NC}"
    exit 1
fi
echo ""

# Test 2: Endpoint Discord OAuth
echo "📍 Test 2: Discord OAuth Endpoint"
echo "─────────────────────────"
DISCORD_AUTH=$(curl -s "$BASE_URL/api/auth/discord")

if echo "$DISCORD_AUTH" | grep -q "authUrl"; then
    echo -e "${GREEN}✅ Endpoint Discord disponible${NC}"

    # Extraire l'URL
    AUTH_URL=$(echo "$DISCORD_AUTH" | grep -o '"authUrl":"[^"]*' | cut -d'"' -f4)
    echo "   URL: ${AUTH_URL:0:60}..."
else
    echo -e "${RED}❌ Endpoint Discord non disponible${NC}"
    echo "   Réponse: $DISCORD_AUTH"
fi
echo ""

# Test 3: Variables d'environnement (backend local uniquement)
if [ "$1" != "prod" ]; then
    echo "📍 Test 3: Variables d'environnement"
    echo "─────────────────────────"

    if [ -f ".env" ]; then
        if grep -q "DISCORD_CLIENT_ID" .env; then
            echo -e "${GREEN}✅ DISCORD_CLIENT_ID trouvée${NC}"
        else
            echo -e "${YELLOW}⚠️  DISCORD_CLIENT_ID manquante${NC}"
        fi

        if grep -q "DISCORD_CLIENT_SECRET" .env; then
            echo -e "${GREEN}✅ DISCORD_CLIENT_SECRET trouvée${NC}"
        else
            echo -e "${YELLOW}⚠️  DISCORD_CLIENT_SECRET manquante${NC}"
        fi

        if grep -q "DISCORD_REDIRECT_URI" .env; then
            echo -e "${GREEN}✅ DISCORD_REDIRECT_URI trouvée${NC}"
        else
            echo -e "${YELLOW}⚠️  DISCORD_REDIRECT_URI manquante${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Fichier .env non trouvé${NC}"
    fi
    echo ""
fi

# Test 4: Schéma Prisma
echo "📍 Test 4: Schéma Prisma OAuth"
echo "─────────────────────────"

if grep -q "provider.*String" prisma/schema.prisma 2>/dev/null; then
    echo -e "${GREEN}✅ Champ 'provider' trouvé${NC}"
else
    echo -e "${RED}❌ Champ 'provider' manquant${NC}"
fi

if grep -q "providerId.*String" prisma/schema.prisma 2>/dev/null; then
    echo -e "${GREEN}✅ Champ 'providerId' trouvé${NC}"
else
    echo -e "${RED}❌ Champ 'providerId' manquant${NC}"
fi

if grep -q "providerData.*Json" prisma/schema.prisma 2>/dev/null; then
    echo -e "${GREEN}✅ Champ 'providerData' trouvé${NC}"
else
    echo -e "${RED}❌ Champ 'providerData' manquant${NC}"
fi
echo ""

# Test 5: Fichiers contrôleur et routes
echo "📍 Test 5: Fichiers Backend"
echo "─────────────────────────"

if [ -f "src/controllers/DiscordAuthController.ts" ]; then
    echo -e "${GREEN}✅ DiscordAuthController.ts présent${NC}"
else
    echo -e "${RED}❌ DiscordAuthController.ts manquant${NC}"
fi

if [ -f "src/routes/discord-auth.ts" ]; then
    echo -e "${GREEN}✅ discord-auth.ts présent${NC}"
else
    echo -e "${RED}❌ discord-auth.ts manquant${NC}"
fi

if grep -q "discordAuthRoutes" src/server.ts 2>/dev/null; then
    echo -e "${GREEN}✅ Routes Discord montées dans server.ts${NC}"
else
    echo -e "${RED}❌ Routes Discord non montées${NC}"
fi
echo ""

# Résumé
echo "================================"
echo "✨ Tests terminés"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. Configurer l'application Discord"
echo "  2. Ajouter les variables d'environnement"
echo "  3. Déployer sur Railway"
echo "  4. Tester dans l'app mobile"
echo ""
echo "📖 Documentation: DISCORD_OAUTH_SETUP.md"
