#!/bin/bash

# Script pour restaurer les variables d'environnement Railway
# Usage: ./restore-railway-vars.sh

BACKUP_FILE="../.railway-env-backup.json"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Fichier backup non trouvé: $BACKUP_FILE"
    exit 1
fi

echo "🔄 Restauration des variables Railway depuis $BACKUP_FILE"
echo ""

# Lire le fichier JSON et définir chaque variable
while IFS= read -r line; do
    key=$(echo "$line" | jq -r '.key')
    value=$(echo "$line" | jq -r '.value')
    
    # Ignorer les variables Railway auto-générées
    if [[ "$key" == RAILWAY_* ]]; then
        echo "⏭️  Skip $key (auto-generated)"
        continue
    fi
    
    echo "✅ Setting $key"
    railway variables --set "$key=$value" 2>&1 | grep -v "^$"
    
done < <(jq -r 'to_entries[] | @json' "$BACKUP_FILE")

echo ""
echo "✅ Restauration terminée!"
echo ""
echo "Variables définies:"
railway variables | head -20

