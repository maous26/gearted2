-- Script SQL pour nettoyer les données mockées
-- À exécuter via Railway dashboard ou psql

-- Compter les utilisateurs à conserver
SELECT COUNT(*) as users_to_keep 
FROM "User" 
WHERE username IN ('iswael0552617', 'tata') 
   OR email LIKE '%iswael%' 
   OR email LIKE '%tata%';

-- Obtenir les IDs des utilisateurs à conserver
CREATE TEMP TABLE keep_users AS
SELECT id FROM "User" 
WHERE username IN ('iswael0552617', 'tata') 
   OR email LIKE '%iswael%' 
   OR email LIKE '%tata%';

-- Supprimer les notifications
DELETE FROM "Notification";

-- Supprimer les messages
DELETE FROM "Message";

-- Supprimer les conversations
DELETE FROM "Conversation";

-- Supprimer les transactions
DELETE FROM "Transaction";

-- Supprimer les adresses
DELETE FROM "ShippingAddress";

-- Supprimer les favoris
DELETE FROM "Favorite";

-- Supprimer les produits
DELETE FROM "Product";

-- Supprimer les dimensions de colis
DELETE FROM "ParcelDimensions";

-- Supprimer les utilisateurs (sauf ceux à conserver)
DELETE FROM "User" 
WHERE id NOT IN (SELECT id FROM keep_users);

-- Vérifier le résultat
SELECT 
  (SELECT COUNT(*) FROM "User") as users_remaining,
  (SELECT COUNT(*) FROM "Product") as products_remaining,
  (SELECT COUNT(*) FROM "Message") as messages_remaining,
  (SELECT COUNT(*) FROM "Notification") as notifications_remaining;

