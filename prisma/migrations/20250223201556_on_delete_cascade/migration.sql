-- DropForeignKey
ALTER TABLE "Plant" DROP CONSTRAINT "Plant_locationId_fkey";

-- DropForeignKey
ALTER TABLE "Species" DROP CONSTRAINT "Species_stockId_fkey";

-- DropForeignKey
ALTER TABLE "SpeciesImage" DROP CONSTRAINT "SpeciesImage_speciesId_fkey";

-- AddForeignKey
ALTER TABLE "Species" ADD CONSTRAINT "Species_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesImage" ADD CONSTRAINT "SpeciesImage_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
