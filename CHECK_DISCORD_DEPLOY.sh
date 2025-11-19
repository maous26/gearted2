#!/bin/bash

# Check Discord OAuth deployment status

echo "🔍 Vérification déploiement Discord OAuth"
echo "========================================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

URL="https://empowering-truth-production.up.railway.app"

# Health check
echo "1️⃣ Backend Health Check..."
HEALTH=$(curl -s "$URL/health")
if echo "$HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✅ Backend actif${NC}"
else
    echo -e "${RED}❌ Backend inactif${NC}"
    exit 1
fi

echo ""

# Discord endpoint
echo "2️⃣ Discord OAuth Endpoint..."
DISCORD=$(curl -s "$URL/api/auth/discord")

if echo "$DISCORD" | grep -q "authUrl"; then
    echo -e "${GREEN}✅ Discord OAuth déployé!${NC}"
    echo ""
    echo "URL retournée:"
    echo "$DISCORD" | grep -o '"authUrl":"[^"]*' | cut -d'"' -f4 | head -c 80
    echo "..."
    echo ""
    echo -e "${GREEN}🎉 Déploiement réussi!${NC}"
    echo ""
    echo "Prochaines étapes:"
    echo "1. Configurer Airbot (voir DISCORD_OAUTH_WITH_AIRBOT.md)"
    echo "2. Ajouter variables Railway"
    echo "3. Tester dans l'app mobile"
elif echo "$DISCORD" | grep -q "404"; then
    echo -e "${YELLOW}⏳ Endpoint pas encore déployé${NC}"
    echo "Railway est probablement en train de déployer..."
    echo ""
    echo "Attendez 2-3 minutes et relancez:"
    echo "  ./CHECK_DISCORD_DEPLOY.sh"
else
    echo -e "${RED}❌ Erreur inattendue${NC}"
    echo "Réponse: $DISCORD"
fi
