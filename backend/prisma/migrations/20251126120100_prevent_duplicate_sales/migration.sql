-- Prevent duplicate sales: A product can only have one successful transaction
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_product_succeeded_unique"
ON "transactions" ("productId")
WHERE status = 'SUCCEEDED';
