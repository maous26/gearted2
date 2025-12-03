-- ⚠️ ATTENTION: Ce script supprime TOUS les produits de la base de données
-- Utilisez-le dans Railway Dashboard > PostgreSQL > Query

-- Étape 1: Supprimer toutes les images de produits
DELETE FROM "product_images";

-- Étape 2: Supprimer tous les favoris
DELETE FROM "favorites";

-- Étape 3: Supprimer tous les produits
DELETE FROM "products";

-- Vérification: Compter les produits restants (devrait être 0)
SELECT COUNT(*) as "Produits restants" FROM "products";

-- ✅ Terminé! Votre marketplace est maintenant vide.
