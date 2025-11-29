-- Script pour nettoyer les transactions en double et empêcher les futurs doublons

-- 1. Identifier les transactions en double (même produit, plusieurs transactions SUCCEEDED)
WITH duplicates AS (
  SELECT
    "productId",
    COUNT(*) as count,
    array_agg("id" ORDER BY "createdAt" DESC) as transaction_ids
  FROM "transactions"
  WHERE status = 'SUCCEEDED'
  GROUP BY "productId"
  HAVING COUNT(*) > 1
)
SELECT
  d."productId",
  p.title as product_title,
  d.count as duplicate_count,
  d.transaction_ids
FROM duplicates d
JOIN "products" p ON p.id = d."productId";

-- 2. Pour chaque produit avec doublons, garder seulement la transaction la plus récente
-- et marquer les autres comme CANCELLED
-- ATTENTION: Exécuter ceci manuellement après avoir vérifié les doublons ci-dessus

-- UPDATE "transactions" t
-- SET status = 'CANCELLED',
--     metadata = jsonb_set(
--       COALESCE(metadata::jsonb, '{}'::jsonb),
--       '{cancelledReason}',
--       '"Duplicate transaction - kept most recent"'::jsonb
--     )
-- WHERE t.id IN (
--   SELECT unnest(transaction_ids[2:])
--   FROM (
--     SELECT
--       array_agg("id" ORDER BY "createdAt" DESC) as transaction_ids
--     FROM "transactions"
--     WHERE status = 'SUCCEEDED'
--     GROUP BY "productId"
--     HAVING COUNT(*) > 1
--   ) duplicates
-- );

-- 3. Créer un index unique partiel pour empêcher les futurs doublons
-- Un produit ne peut avoir qu'une seule transaction SUCCEEDED
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "transactions_product_succeeded_unique"
ON "transactions" ("productId")
WHERE status = 'SUCCEEDED';

COMMENT ON INDEX "transactions_product_succeeded_unique" IS
'Ensures a product can only have one successful transaction (prevents duplicate sales)';
