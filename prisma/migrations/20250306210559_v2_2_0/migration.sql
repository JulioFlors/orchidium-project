/*
  Warnings:

  - The values [General,Herbicida] on the enum `ProductType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `weeksInCycle` on the `FertilizationProgram` table. All the data in the column will be lost.
  - You are about to drop the column `cycleWeekId` on the `FertilizationTask` table. All the data in the column will be lost.
  - You are about to drop the column `cycleWeeks` on the `PhytosanitaryProgram` table. All the data in the column will be lost.
  - You are about to drop the column `frequencyMonths` on the `PhytosanitaryProgram` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `PhytosanitaryProgram` table. All the data in the column will be lost.
  - You are about to drop the column `programId` on the `PhytosanitaryTask` table. All the data in the column will be lost.
  - You are about to drop the `FertilizationCycleWeek` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `weeklyFrequency` to the `FertilizationProgram` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monthlyFrequency` to the `PhytosanitaryProgram` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProductType_new" AS ENUM ('Desarrollo', 'Mantenimiento', 'Floracion', 'Fungicida', 'Insecticida', 'Acaricida');
ALTER TABLE "Product" ALTER COLUMN "type" TYPE "ProductType_new" USING ("type"::text::"ProductType_new");
ALTER TYPE "ProductType" RENAME TO "ProductType_old";
ALTER TYPE "ProductType_new" RENAME TO "ProductType";
DROP TYPE "ProductType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "FertilizationCycleWeek" DROP CONSTRAINT "FertilizationCycleWeek_productId_fkey";

-- DropForeignKey
ALTER TABLE "FertilizationCycleWeek" DROP CONSTRAINT "FertilizationCycleWeek_programId_fkey";

-- DropForeignKey
ALTER TABLE "FertilizationTask" DROP CONSTRAINT "FertilizationTask_cycleWeekId_fkey";

-- DropForeignKey
ALTER TABLE "FertilizationTask" DROP CONSTRAINT "FertilizationTask_productId_fkey";

-- DropForeignKey
ALTER TABLE "IrrigationTask" DROP CONSTRAINT "IrrigationTask_programId_fkey";

-- DropForeignKey
ALTER TABLE "PhytosanitaryProgram" DROP CONSTRAINT "PhytosanitaryProgram_productId_fkey";

-- DropForeignKey
ALTER TABLE "PhytosanitaryTask" DROP CONSTRAINT "PhytosanitaryTask_productId_fkey";

-- DropForeignKey
ALTER TABLE "PhytosanitaryTask" DROP CONSTRAINT "PhytosanitaryTask_programId_fkey";

-- DropForeignKey
ALTER TABLE "Plant" DROP CONSTRAINT "Plant_speciesId_fkey";

-- AlterTable
ALTER TABLE "FertilizationProgram" DROP COLUMN "weeksInCycle",
ADD COLUMN     "weeklyFrequency" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "FertilizationTask" DROP COLUMN "cycleWeekId",
ADD COLUMN     "productsCycleId" TEXT;

-- AlterTable
ALTER TABLE "PhytosanitaryProgram" DROP COLUMN "cycleWeeks",
DROP COLUMN "frequencyMonths",
DROP COLUMN "productId",
ADD COLUMN     "monthlyFrequency" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "PhytosanitaryTask" DROP COLUMN "programId",
ADD COLUMN     "productsCycleId" TEXT;

-- DropTable
DROP TABLE "FertilizationCycleWeek";

-- CreateTable
CREATE TABLE "FertilizationCycle" (
    "id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,

    CONSTRAINT "FertilizationCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhytosanitaryCycle" (
    "id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,

    CONSTRAINT "PhytosanitaryCycle_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FertilizationCycle" ADD CONSTRAINT "FertilizationCycle_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FertilizationCycle" ADD CONSTRAINT "FertilizationCycle_programId_fkey" FOREIGN KEY ("programId") REFERENCES "FertilizationProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FertilizationTask" ADD CONSTRAINT "FertilizationTask_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FertilizationTask" ADD CONSTRAINT "FertilizationTask_productsCycleId_fkey" FOREIGN KEY ("productsCycleId") REFERENCES "FertilizationCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhytosanitaryCycle" ADD CONSTRAINT "PhytosanitaryCycle_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhytosanitaryCycle" ADD CONSTRAINT "PhytosanitaryCycle_programId_fkey" FOREIGN KEY ("programId") REFERENCES "PhytosanitaryProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhytosanitaryTask" ADD CONSTRAINT "PhytosanitaryTask_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhytosanitaryTask" ADD CONSTRAINT "PhytosanitaryTask_productsCycleId_fkey" FOREIGN KEY ("productsCycleId") REFERENCES "PhytosanitaryCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IrrigationTask" ADD CONSTRAINT "IrrigationTask_programId_fkey" FOREIGN KEY ("programId") REFERENCES "IrrigationProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
