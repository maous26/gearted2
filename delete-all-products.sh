#!/bin/bash

# Script pour supprimer tous les produits via l'API admin
# Remplacez VOTRE_SECRET par votre ADMIN_SECRET_KEY

BACKEND_URL="https://gearted2-production-36e5.up.railway.app"
ADMIN_SECRET="gearted-admin-2025"  # Changez si différent

echo "🗑️  Suppression de tous les produits..."
echo ""

curl -X DELETE \
  -H "x-admin-secret: $ADMIN_SECRET" \
  "$BACKEND_URL/admin-clean-db"

echo ""
echo "✅ Terminé!"
