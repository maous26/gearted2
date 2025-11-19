#!/bin/bash

echo "🎮 Test Discord OAuth - Gearted"
echo "================================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

URL="https://empowering-truth-production.up.railway.app"

# Test 1: Health check
echo "1️⃣ Backend Health..."
if curl -s "$URL/health" | grep -q "ok"; then
    echo -e "${GREEN}✅ Backend actif${NC}"
else
    echo -e "${RED}❌ Backend inactif${NC}"
    exit 1
fi

echo ""

# Test 2: Discord OAuth endpoint
echo "2️⃣ Discord OAuth Endpoint..."
RESPONSE=$(curl -s "$URL/api/auth/discord")

if echo "$RESPONSE" | grep -q "authUrl"; then
    echo -e "${GREEN}✅ Endpoint fonctionne${NC}"
    
    # Extraire le client_id
    CLIENT_ID=$(echo "$RESPONSE" | grep -o 'client_id=[0-9]*' | cut -d'=' -f2)
    echo "   Client ID: $CLIENT_ID"
    
    # Extraire l'URL
    AUTH_URL=$(echo "$RESPONSE" | jq -r '.authUrl' 2>/dev/null)
    if [ ! -z "$AUTH_URL" ]; then
        echo ""
        echo -e "${BLUE}📋 URL d'autorisation Discord:${NC}"
        echo "$AUTH_URL"
        echo ""
        echo -e "${GREEN}✅ Discord OAuth prêt à tester!${NC}"
        echo ""
        echo "📱 Test dans l'app mobile:"
        echo "  1. Ouvrir Gearted"
        echo "  2. Aller sur Login"
        echo "  3. Cliquer 'Se connecter avec Discord'"
        echo "  4. Autoriser l'app"
        echo "  5. ✅ Connecté!"
    fi
else
    echo -e "${RED}❌ Erreur: $RESPONSE${NC}"
fi
