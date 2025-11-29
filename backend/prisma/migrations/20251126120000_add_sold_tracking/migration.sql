-- Add soldAt and deletionScheduledAt fields to products table
ALTER TABLE "products" ADD COLUMN "soldAt" TIMESTAMP(3);
ALTER TABLE "products" ADD COLUMN "deletionScheduledAt" TIMESTAMP(3);
