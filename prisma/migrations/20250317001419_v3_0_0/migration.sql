/*
  Warnings:

  - The values [Desarrollo,Mantenimiento,Floracion,Fungicida,Insecticida,Acaricida] on the enum `ProductType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `type` on the `FertilizationTask` table. All the data in the column will be lost.
  - You are about to drop the column `taskType` on the `IrrigationTask` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `PhytosanitaryTask` table. All the data in the column will be lost.
  - You are about to drop the column `genus` on the `Species` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Species` table. All the data in the column will be lost.
  - Changed the type of `porpose` on the `Product` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `genusId` to the `Species` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProductPorpose" AS ENUM ('Desarrollo', 'Mantenimiento', 'Floracion', 'Fungicida', 'Insecticida', 'Acaricida');

-- AlterEnum
BEGIN;
CREATE TYPE "ProductType_new" AS ENUM ('Fertilizante', 'Fitosanitario');
ALTER TABLE "Product" ALTER COLUMN "type" TYPE "ProductType_new" USING ("type"::text::"ProductType_new");
ALTER TYPE "ProductType" RENAME TO "ProductType_old";
ALTER TYPE "ProductType_new" RENAME TO "ProductType";
DROP TYPE "ProductType_old";
COMMIT;

-- AlterTable
ALTER TABLE "FertilizationTask" DROP COLUMN "type";

-- AlterTable
ALTER TABLE "IrrigationTask" DROP COLUMN "taskType";

-- AlterTable
ALTER TABLE "PhytosanitaryTask" DROP COLUMN "type";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "porpose",
ADD COLUMN     "porpose" "ProductPorpose" NOT NULL;

-- AlterTable
ALTER TABLE "Species" DROP COLUMN "genus",
DROP COLUMN "type",
ADD COLUMN     "genusId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "GenusType";

-- DropEnum
DROP TYPE "TaskType";

-- CreateTable
CREATE TABLE "Genus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PlantType" NOT NULL,

    CONSTRAINT "Genus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Genus_name_key" ON "Genus"("name");

-- AddForeignKey
ALTER TABLE "Species" ADD CONSTRAINT "Species_genusId_fkey" FOREIGN KEY ("genusId") REFERENCES "Genus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
