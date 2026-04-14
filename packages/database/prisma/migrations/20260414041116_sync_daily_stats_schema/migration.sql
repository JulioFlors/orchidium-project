/*
  Warnings:

  - You are about to drop the column `phytosanetaryProgramId` on the `AutomationSchedule` table. All the data in the column will be lost.
  - Added the required column `minIlluminance` to the `DailyEnvironmentStat` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AutomationSchedule" DROP CONSTRAINT "AutomationSchedule_phytosanetaryProgramId_fkey";

-- AlterTable
ALTER TABLE "AutomationSchedule" DROP COLUMN "phytosanetaryProgramId",
ADD COLUMN     "phytosanitaryProgramId" TEXT;

-- AlterTable
ALTER TABLE "DailyEnvironmentStat" ADD COLUMN     "avgTempDay" DOUBLE PRECISION,
ADD COLUMN     "avgTempNight" DOUBLE PRECISION,
ADD COLUMN     "dif" DOUBLE PRECISION,
ADD COLUMN     "dli" DOUBLE PRECISION,
ADD COLUMN     "highHumidityHours" DOUBLE PRECISION,
ADD COLUMN     "irrigationMinutes" INTEGER,
ADD COLUMN     "maxHumTime" TEXT,
ADD COLUMN     "maxIllumTime" TEXT,
ADD COLUMN     "maxTempTime" TEXT,
ADD COLUMN     "minHumTime" TEXT,
ADD COLUMN     "minIllumTime" TEXT,
ADD COLUMN     "minIlluminance" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "minTempTime" TEXT,
ADD COLUMN     "nebulizationMinutes" INTEGER,
ADD COLUMN     "totalWaterEvents" INTEGER,
ADD COLUMN     "vpdAvg" DOUBLE PRECISION,
ADD COLUMN     "vpdMax" DOUBLE PRECISION,
ADD COLUMN     "vpdMin" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "AutomationSchedule" ADD CONSTRAINT "AutomationSchedule_phytosanitaryProgramId_fkey" FOREIGN KEY ("phytosanitaryProgramId") REFERENCES "PhytosanitaryProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;
