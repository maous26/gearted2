#!/bin/bash

echo "🗑️  Suppression de TOUS les produits via Railway..."
echo ""

# Exécuter via Railway avec psql
cd backend && railway run bash << 'SCRIPT'
psql $DATABASE_URL << 'SQL'
-- Suppression de tous les produits
DELETE FROM "product_images";
DELETE FROM "favorites";  
DELETE FROM "products";

-- Vérification
SELECT COUNT(*) as "Produits restants" FROM "products";
SQL
SCRIPT

echo ""
echo "✅ Terminé! Rechargez votre app."
