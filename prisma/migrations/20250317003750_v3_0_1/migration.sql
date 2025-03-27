/*
  Warnings:

  - The values [Adenium] on the enum `PlantType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PlantType_new" AS ENUM ('Orchid', 'Adenium_Obesum', 'Cactus', 'Succulent');
ALTER TABLE "Genus" ALTER COLUMN "type" TYPE "PlantType_new" USING ("type"::text::"PlantType_new");
ALTER TYPE "PlantType" RENAME TO "PlantType_old";
ALTER TYPE "PlantType_new" RENAME TO "PlantType";
DROP TYPE "PlantType_old";
COMMIT;
