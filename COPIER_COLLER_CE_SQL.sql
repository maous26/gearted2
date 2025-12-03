-- Copier-coller ce code dans Railway → PostgreSQL → Data → SQL Editor

DELETE FROM "Notification";
DELETE FROM "Message";
DELETE FROM "Conversation";
DELETE FROM "Transaction";
DELETE FROM "ShippingAddress";
DELETE FROM "Favorite";
DELETE FROM "Product";
DELETE FROM "ParcelDimensions";
DELETE FROM "User" WHERE username NOT IN ('iswael0552617', 'tata');

-- Vérification
SELECT COUNT(*) as total_produits FROM "Product";
SELECT COUNT(*) as total_utilisateurs FROM "User";

