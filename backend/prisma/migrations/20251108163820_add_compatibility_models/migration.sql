-- CreateTable
CREATE TABLE "manufacturers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "country" TEXT,
    "description" TEXT,
    "logo" TEXT,
    "website" TEXT,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "brandId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "manufacturers_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "weapon_models" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "manufacturerId" TEXT NOT NULL,
    "weaponType" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "version" TEXT,
    "gearboxType" TEXT,
    "hopUpType" TEXT,
    "barrelLength" REAL,
    "magazineType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "weapon_models_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "manufacturers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "parts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "partType" TEXT NOT NULL,
    "specifications" TEXT,
    "price" DECIMAL,
    "priceRange" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "part_compatibility" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weaponModelId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "compatibilityScore" INTEGER NOT NULL DEFAULT 100,
    "notes" TEXT,
    "requiresModification" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "part_compatibility_weaponModelId_fkey" FOREIGN KEY ("weaponModelId") REFERENCES "weapon_models" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "part_compatibility_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "manufacturers_name_key" ON "manufacturers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturers_slug_key" ON "manufacturers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "weapon_models_manufacturerId_model_version_key" ON "weapon_models"("manufacturerId", "model", "version");

-- CreateIndex
CREATE UNIQUE INDEX "part_compatibility_weaponModelId_partId_key" ON "part_compatibility"("weaponModelId", "partId");
