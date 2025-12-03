#!/bin/bash

# Script de nettoyage final
# Attend que le déploiement soit terminé puis lance le nettoyage

BACKEND_URL="https://gearted2-production.up.railway.app"
ADMIN_SECRET="gearted-admin-2025"

echo "⏳ Attente du déploiement de la nouvelle version..."
echo "   (Cela peut prendre 1-2 minutes)"
echo ""

# Boucle pour vérifier si l'endpoint est disponible
MAX_RETRIES=30
COUNT=0

while [ $COUNT -lt $MAX_RETRIES ]; do
  # Tenter d'appeler l'endpoint (juste pour voir s'il existe, sans DELETE pour l'instant)
  # On utilise DELETE directement car c'est ce qu'on veut
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE -H "x-admin-secret: $ADMIN_SECRET" "$BACKEND_URL/admin-clean-db")
  
  if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ Endpoint détecté et exécuté avec succès!"
    echo ""
    echo "🎉 TOUS LES PRODUITS ONT ÉTÉ SUPPRIMÉS!"
    echo "   Vous pouvez maintenant recharger votre application."
    exit 0
  elif [ "$HTTP_CODE" == "404" ]; then
    echo "   ... En attente du déploiement (404 Not Found) - Essai $((COUNT+1))/$MAX_RETRIES"
    sleep 5
  else
    echo "⚠️  Code inattendu: $HTTP_CODE"
    # On continue quand même au cas où c'est une erreur temporaire
    sleep 5
  fi
  
  COUNT=$((COUNT+1))
done

echo ""
echo "❌ Délai d'attente dépassé. Le déploiement semble prendre trop de temps."
echo "   Veuillez réessayer dans quelques minutes avec: ./delete-all-products.sh"
