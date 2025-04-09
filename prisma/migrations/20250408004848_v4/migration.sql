-- CreateEnum
CREATE TYPE "PotSize" AS ENUM ('Nro_5', 'Nro_7', 'Nro_10', 'Nro_14');

-- AlterTable
ALTER TABLE "Species" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "image" TEXT,
    "routeId" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Route_name_key" ON "Route"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Plant_locationId_idx" ON "Plant"("locationId");

-- CreateIndex
CREATE INDEX "Species_genusId_idx" ON "Species"("genusId");

-- CreateIndex
CREATE INDEX "SpeciesImage_speciesId_idx" ON "SpeciesImage"("speciesId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
