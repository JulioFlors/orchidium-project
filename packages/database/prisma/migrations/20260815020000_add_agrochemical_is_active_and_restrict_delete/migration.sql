-- AlterTable: Agrochemical (agregar isActive con valor por defecto true)
ALTER TABLE "Agrochemical" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex: Agrochemical_isActive_idx
CREATE INDEX "Agrochemical_isActive_idx" ON "Agrochemical"("isActive");

-- Redefine foreign keys with ON DELETE RESTRICT

-- DosingLog -> Agrochemical
ALTER TABLE "DosingLog" DROP CONSTRAINT IF EXISTS "DosingLog_agrochemicalId_fkey";
ALTER TABLE "DosingLog" ADD CONSTRAINT "DosingLog_agrochemicalId_fkey" FOREIGN KEY ("agrochemicalId") REFERENCES "Agrochemical"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- FertilizationCycle -> Agrochemical
ALTER TABLE "FertilizationCycle" DROP CONSTRAINT IF EXISTS "FertilizationCycle_agrochemicalId_fkey";
ALTER TABLE "FertilizationCycle" ADD CONSTRAINT "FertilizationCycle_agrochemicalId_fkey" FOREIGN KEY ("agrochemicalId") REFERENCES "Agrochemical"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- PhytosanitaryCycle -> Agrochemical
ALTER TABLE "PhytosanitaryCycle" DROP CONSTRAINT IF EXISTS "PhytosanitaryCycle_agrochemicalId_fkey";
ALTER TABLE "PhytosanitaryCycle" ADD CONSTRAINT "PhytosanitaryCycle_agrochemicalId_fkey" FOREIGN KEY ("agrochemicalId") REFERENCES "Agrochemical"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
