#!/bin/bash

# Script pour supprimer les données mockées via Railway CLI
# Ce script se connecte directement à la base de données Railway

echo "🧹 Nettoyage des données mockées via Railway CLI"
echo "=================================================="
echo ""

# Vérifier si railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI n'est pas installé"
    echo ""
    echo "Pour installer:"
    echo "  npm install -g @railway/cli"
    echo "  ou"
    echo "  brew install railway"
    echo ""
    exit 1
fi

echo "✅ Railway CLI détecté"
echo ""

echo "📝 Ce script va supprimer:"
echo "   - Tous les produits"
echo "   - Tous les messages et conversations"
echo "   - Toutes les notifications"
echo "   - Tous les utilisateurs SAUF iswael0552617 et tata"
echo ""

read -p "Continuer? (oui/non): " confirm

if [ "$confirm" != "oui" ]; then
    echo "❌ Annulé"
    exit 0
fi

echo ""
echo "🔗 Connexion à Railway..."

# Créer le script Prisma temporaire
cat > /tmp/clean-db.ts << 'EOF'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Début du nettoyage...');

  // Utilisateurs à conserver
  const keepUsers = await prisma.user.findMany({
    where: {
      OR: [
        { username: 'iswael0552617' },
        { username: 'tata' },
        { email: { contains: 'iswael' } },
        { email: { contains: 'tata' } }
      ]
    }
  });

  const keepUserIds = keepUsers.map(u => u.id);
  console.log(`✅ Utilisateurs conservés: ${keepUsers.map(u => u.username).join(', ')}`);

  // Suppression dans l'ordre (foreign keys)
  const notif = await prisma.notification.deleteMany({});
  console.log(`🗑️  Notifications supprimées: ${notif.count}`);

  const msg = await prisma.message.deleteMany({});
  console.log(`🗑️  Messages supprimés: ${msg.count}`);

  const conv = await prisma.conversation.deleteMany({});
  console.log(`🗑️  Conversations supprimées: ${conv.count}`);

  const trans = await prisma.transaction.deleteMany({});
  console.log(`🗑️  Transactions supprimées: ${trans.count}`);

  const addr = await prisma.shippingAddress.deleteMany({});
  console.log(`🗑️  Adresses supprimées: ${addr.count}`);

  const fav = await prisma.favorite.deleteMany({});
  console.log(`🗑️  Favoris supprimés: ${fav.count}`);

  const prod = await prisma.product.deleteMany({});
  console.log(`🗑️  Produits supprimés: ${prod.count}`);

  const parcel = await prisma.parcelDimensions.deleteMany({});
  console.log(`🗑️  Dimensions de colis supprimées: ${parcel.count}`);

  const users = await prisma.user.deleteMany({
    where: { id: { notIn: keepUserIds } }
  });
  console.log(`🗑️  Utilisateurs supprimés: ${users.count}`);

  console.log('✅ Nettoyage terminé!');
}

main()
  .catch(e => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
EOF

echo "🚀 Exécution du script de nettoyage..."
cd backend
railway run npx ts-node /tmp/clean-db.ts

echo ""
echo "✅ Fait!"
echo ""
echo "🔍 Vérification..."
curl -k -s 'https://gearted2-production-36e5.up.railway.app/api/products?limit=1' | jq '.total'

rm -f /tmp/clean-db.ts

