#!/bin/bash

# Nettoyage automatique des données mockées (sans confirmation)
# Pour une exécution rapide

echo "🧹 Nettoyage des données mockées..."

curl -k -s -X DELETE \
  -H "x-admin-secret: gearted-admin-2025" \
  -H "Content-Type: application/json" \
  https://gearted2-production-36e5.up.railway.app/admin-clean-db | jq '.'

echo ""
echo "✅ Fait! Vérification..."
echo ""

TOTAL=$(curl -k -s 'https://gearted2-production-36e5.up.railway.app/api/products?limit=1' | jq -r '.total')
echo "Produits restants: $TOTAL"

if [ "$TOTAL" = "0" ]; then
  echo "✅ Base de données nettoyée avec succès!"
else
  echo "⚠️  Il reste $TOTAL produits (peut-être de vrais produits de vos utilisateurs)"
fi

