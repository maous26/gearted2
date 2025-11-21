-- AlterTable - Remove listingType and tradeFor from Product table
ALTER TABLE "products" DROP COLUMN IF EXISTS "listingType";
ALTER TABLE "products" DROP COLUMN IF EXISTS "tradeFor";

-- DropEnum - Remove ListingType enum
DROP TYPE IF EXISTS "ListingType";
