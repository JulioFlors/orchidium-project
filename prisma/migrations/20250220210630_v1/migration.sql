-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ZoneType" AS ENUM ('ZONA_A', 'ZONA_B', 'ZONA_C', 'ZONA_D');

-- CreateEnum
CREATE TYPE "TableType" AS ENUM ('MESA_1', 'MESA_2', 'MESA_3', 'MESA_4', 'MESA_5', 'MESA_6');

-- CreateEnum
CREATE TYPE "PlantType" AS ENUM ('ORCHID', 'ADENIUM', 'CACTUS', 'SUCCULENT');

-- CreateEnum
CREATE TYPE "GenusType" AS ENUM ('CATTLEYA', 'DENDROBIUM', 'ADENIUM_OBESUM', 'MAMMILLARIA', 'HAWORTHIA');

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Species" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genus" "GenusType" NOT NULL,
    "type" "PlantType" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "slug" TEXT NOT NULL,
    "stockId" TEXT,

    CONSTRAINT "Species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeciesImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,

    CONSTRAINT "SpeciesImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "zone" "ZoneType" NOT NULL,
    "table" "TableType" NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plant" (
    "id" TEXT NOT NULL,
    "pottingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "speciesId" TEXT NOT NULL,
    "locationId" TEXT,

    CONSTRAINT "Plant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Species_name_key" ON "Species"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Species_slug_key" ON "Species"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SpeciesImage_url_key" ON "SpeciesImage"("url");

-- CreateIndex
CREATE INDEX "Plant_speciesId_idx" ON "Plant"("speciesId");

-- AddForeignKey
ALTER TABLE "Species" ADD CONSTRAINT "Species_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesImage" ADD CONSTRAINT "SpeciesImage_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
