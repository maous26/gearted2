-- AlterTable (Add new columns to Transaction)
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "buyerFeePercent" DECIMAL(65,30) DEFAULT 5.0;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "sellerFeePercent" DECIMAL(65,30) DEFAULT 5.0;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "buyerFee" DECIMAL(65,30) DEFAULT 0;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "sellerFee" DECIMAL(65,30) DEFAULT 0;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "totalPaid" DECIMAL(65,30);
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "hasProtection" BOOLEAN DEFAULT false;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "hasExpert" BOOLEAN DEFAULT false;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "BoostType" AS ENUM ('BOOST_24H', 'BOOST_7D');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "BoostStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProtectionStatus" AS ENUM ('PENDING', 'ACTIVE', 'CLAIM_OPENED', 'CLAIM_RESOLVED', 'EXPIRED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ExpertServiceStatus" AS ENUM ('PENDING', 'AWAITING_SHIPMENT', 'IN_TRANSIT_TO_GEARTED', 'RECEIVED_BY_GEARTED', 'UNDER_VERIFICATION', 'VERIFIED', 'ISSUE_DETECTED', 'IN_TRANSIT_TO_BUYER', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable: ProductBoost
CREATE TABLE IF NOT EXISTS "product_boosts" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "boostType" "BoostType" NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "paymentIntentId" TEXT,
    "status" "BoostStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_boosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TransactionProtection
CREATE TABLE IF NOT EXISTS "transaction_protections" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 3.99,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "paymentIntentId" TEXT,
    "status" "ProtectionStatus" NOT NULL DEFAULT 'PENDING',
    "claimReason" TEXT,
    "claimDescription" TEXT,
    "claimAt" TIMESTAMP(3),
    "claimResolvedAt" TIMESTAMP(3),
    "claimResolution" TEXT,
    "refundAmount" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_protections_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ExpertService
CREATE TABLE IF NOT EXISTS "expert_services" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 19.90,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "paymentIntentId" TEXT,
    "status" "ExpertServiceStatus" NOT NULL DEFAULT 'PENDING',
    "sellerTrackingNumber" TEXT,
    "sellerShippedAt" TIMESTAMP(3),
    "receivedByGeartedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verificationNotes" TEXT,
    "verificationPhotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "verificationPassed" BOOLEAN,
    "buyerTrackingNumber" TEXT,
    "shippedToBuyerAt" TIMESTAMP(3),
    "deliveredToBuyerAt" TIMESTAMP(3),
    "issueDetected" BOOLEAN NOT NULL DEFAULT false,
    "issueDescription" TEXT,
    "issueResolution" TEXT,
    "refundAmount" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expert_services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "transaction_protections_transactionId_key" ON "transaction_protections"("transactionId");
CREATE UNIQUE INDEX IF NOT EXISTS "expert_services_transactionId_key" ON "expert_services"("transactionId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "product_boosts" ADD CONSTRAINT "product_boosts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "transaction_protections" ADD CONSTRAINT "transaction_protections_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "expert_services" ADD CONSTRAINT "expert_services_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
