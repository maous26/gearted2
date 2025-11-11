/*
  Warnings:

  - You are about to drop the column `productImage` on the `favorites` table. All the data in the column will be lost.
  - You are about to drop the column `productTitle` on the `favorites` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "shippoObjectId" TEXT,
    "trackingNumber" TEXT,
    "labelUrl" TEXT,
    "trackingStatus" TEXT DEFAULT 'UNKNOWN',
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "parcelId" TEXT,
    "carrier" TEXT,
    "serviceLevelToken" TEXT,
    "estimatedDays" INTEGER,
    "amount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "shippedAt" DATETIME,
    "deliveredAt" DATETIME,
    CONSTRAINT "shipments_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcel_dimensions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "parcel_dimensions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weaponModelId" TEXT,
    "manufacturerId" TEXT,
    "length" REAL NOT NULL,
    "width" REAL NOT NULL,
    "height" REAL NOT NULL,
    "weight" REAL NOT NULL,
    "name" TEXT,
    "isFromCatalog" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "shipping_rates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipmentId" TEXT,
    "carrier" TEXT NOT NULL,
    "carrierName" TEXT NOT NULL,
    "serviceLevelName" TEXT NOT NULL,
    "serviceLevelToken" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "estimatedDays" INTEGER,
    "durationTerms" TEXT,
    "zone" TEXT,
    "attributes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_favorites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_favorites" ("createdAt", "id", "productId", "userId") SELECT "createdAt", "id", "productId", "userId" FROM "favorites";
DROP TABLE "favorites";
ALTER TABLE "new_favorites" RENAME TO "favorites";
CREATE UNIQUE INDEX "favorites_userId_productId_key" ON "favorites"("userId", "productId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "shipments_orderNumber_key" ON "shipments"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_shippoObjectId_key" ON "shipments"("shippoObjectId");
