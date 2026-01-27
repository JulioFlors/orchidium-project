/*
  Warnings:

  - You are about to drop the column `phytosanitaryProgramId` on the `AutomationSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Species` table. All the data in the column will be lost.
  - You are about to drop the column `stockId` on the `Species` table. All the data in the column will be lost.
  - You are about to drop the `Stock` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `currentSize` to the `Plant` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PlantStatus" AS ENUM ('AVAILABLE', 'MOTHER');

-- DropForeignKey
ALTER TABLE "AutomationSchedule" DROP CONSTRAINT "AutomationSchedule_phytosanitaryProgramId_fkey";

-- DropForeignKey
ALTER TABLE "Species" DROP CONSTRAINT "Species_stockId_fkey";

-- DropIndex
DROP INDEX "Species_genusId_stockId_key";

-- AlterTable
ALTER TABLE "AutomationSchedule" DROP COLUMN "phytosanitaryProgramId",
ADD COLUMN     "phytosanetaryProgramId" TEXT;

-- AlterTable
ALTER TABLE "Plant" ADD COLUMN     "currentSize" "PotSize" NOT NULL,
ADD COLUMN     "status" "PlantStatus" NOT NULL DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE "Species" DROP COLUMN "price",
DROP COLUMN "stockId";

-- DropTable
DROP TABLE "Stock";

-- CreateIndex
CREATE INDEX "Plant_status_idx" ON "Plant"("status");

-- AddForeignKey
ALTER TABLE "AutomationSchedule" ADD CONSTRAINT "AutomationSchedule_phytosanetaryProgramId_fkey" FOREIGN KEY ("phytosanetaryProgramId") REFERENCES "PhytosanitaryProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;
