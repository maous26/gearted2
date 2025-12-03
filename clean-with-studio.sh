#!/bin/bash

# Méthode Alternative: Utiliser Prisma Studio
# Plus visuel et sécurisé

echo "🎨 Nettoyage des données via Prisma Studio"
echo "==========================================="
echo ""

# Vérifier si railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI n'est pas installé"
    echo ""
    echo "Installation rapide:"
    echo "  npm install -g @railway/cli"
    echo ""
    echo "Puis relancer ce script"
    exit 1
fi

echo "✅ Railway CLI installé"
echo ""
echo "📝 Instructions:"
echo "   1. Prisma Studio va s'ouvrir dans votre navigateur"
echo "   2. Cliquez sur 'Product' dans la sidebar"
echo "   3. Sélectionnez tous les produits (checkbox en haut)"
echo "   4. Cliquez 'Delete X records'"
echo "   5. Confirmez"
echo ""
echo "   Répétez pour:"
echo "   - Message"
echo "   - Conversation"
echo "   - Notification"
echo "   - Transaction"
echo "   - User (SAUF iswael0552617 et tata!)"
echo ""

read -p "Ouvrir Prisma Studio? (oui/non): " confirm

if [ "$confirm" != "oui" ]; then
    echo "❌ Annulé"
    exit 0
fi

echo ""
echo "🚀 Ouverture de Prisma Studio..."
cd backend
railway run npx prisma studio

