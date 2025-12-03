#!/bin/bash

# Script pour supprimer toutes les données mockées de la production
# ⚠️  ATTENTION: Ce script va supprimer TOUTES les données de test!

echo "🧹 Nettoyage des données mockées de la production"
echo "=================================================="
echo ""

BACKEND_URL="https://gearted2-production.up.railway.app"
ADMIN_SECRET="gearted-admin-2025"

echo "⚠️  ATTENTION: Ce script va supprimer:"
echo "   - Tous les produits avec mock-user-X comme vendeur"
echo "   - Tous les utilisateurs de test"
echo "   - Toutes les conversations/messages de test"
echo "   - Toutes les notifications de test"
echo ""
echo "Les utilisateurs suivants seront CONSERVÉS:"
echo "   - iswael0552617"
echo "   - tata"
echo ""

read -p "Êtes-vous sûr de vouloir continuer? (oui/non): " confirm

if [ "$confirm" != "oui" ]; then
  echo "❌ Annulé"
  exit 0
fi

echo ""
echo "🚀 Envoi de la requête de nettoyage..."

RESPONSE=$(curl -k -s -X DELETE \
  -H "x-admin-secret: $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  "$BACKEND_URL/admin-clean-db")

echo ""
echo "📊 Résultat:"
echo "$RESPONSE" | jq '.' || echo "$RESPONSE"

echo ""
echo "✅ Nettoyage terminé!"
echo ""
echo "Pour vérifier:"
echo "  curl -k -s '${BACKEND_URL}/api/products?limit=5' | jq '.total'"

