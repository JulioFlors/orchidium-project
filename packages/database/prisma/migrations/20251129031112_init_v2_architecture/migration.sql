-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ZoneType" AS ENUM ('ZONA_A', 'ZONA_B', 'ZONA_C', 'ZONA_D');

-- CreateEnum
CREATE TYPE "TableType" AS ENUM ('MESA_1', 'MESA_2', 'MESA_3', 'MESA_4', 'MESA_5', 'MESA_6');

-- CreateEnum
CREATE TYPE "PlantType" AS ENUM ('ADENIUM_OBESUM', 'BROMELIAD', 'CACTUS', 'ORCHID', 'SUCCULENT');

-- CreateEnum
CREATE TYPE "PotSize" AS ENUM ('NRO_5', 'NRO_7', 'NRO_10', 'NRO_14');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "TaskPurpose" AS ENUM ('IRRIGATION', 'FERTIGATION', 'FUMIGATION', 'HUMIDIFICATION');

-- CreateEnum
CREATE TYPE "AgrochemicalType" AS ENUM ('FERTILIZANTE', 'FITOSANITARIO');

-- CreateEnum
CREATE TYPE "AgrochemicalPorpose" AS ENUM ('DESARROLLO', 'FLORACION', 'MANTENIMIENTO', 'ACARICIDA', 'BACTERICIDA', 'FUNGICIDA', 'INSECTICIDA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PlantType" NOT NULL,

    CONSTRAINT "Genus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Species" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "genusId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,

    CONSTRAINT "Species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "size" "PotSize" NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT false,
    "speciesId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "FloweringEvent" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "plantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FloweringEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plant" (
    "id" TEXT NOT NULL,
    "pottingDate" TIMESTAMP(3),
    "speciesId" TEXT NOT NULL,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agrochemical" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "AgrochemicalType" NOT NULL,
    "porpose" "AgrochemicalPorpose" NOT NULL,
    "preparation" TEXT NOT NULL,

    CONSTRAINT "Agrochemical_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FertilizationProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weeklyFrequency" INTEGER NOT NULL,

    CONSTRAINT "FertilizationProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FertilizationCycle" (
    "id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "agrochemicalId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,

    CONSTRAINT "FertilizationCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhytosanitaryProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyFrequency" INTEGER NOT NULL,

    CONSTRAINT "PhytosanitaryProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhytosanitaryCycle" (
    "id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "agrochemicalId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,

    CONSTRAINT "PhytosanitaryCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationSchedule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "purpose" "TaskPurpose" NOT NULL,
    "cronSchedule" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 10,
    "zones" "ZoneType"[],
    "fertilizationProgramId" TEXT,
    "phytosanitaryProgramId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskLog" (
    "id" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "purpose" "TaskPurpose" NOT NULL,
    "zones" "ZoneType"[],
    "duration" INTEGER NOT NULL,
    "notes" TEXT,
    "agrochemicalId" TEXT,
    "scheduleId" TEXT,

    CONSTRAINT "TaskLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyEnvironmentStat" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "zone" "ZoneType" NOT NULL,
    "avgTemperature" DOUBLE PRECISION NOT NULL,
    "minTemperature" DOUBLE PRECISION NOT NULL,
    "maxTemperature" DOUBLE PRECISION NOT NULL,
    "avgHumidity" DOUBLE PRECISION NOT NULL,
    "minHumidity" DOUBLE PRECISION NOT NULL,
    "maxHumidity" DOUBLE PRECISION NOT NULL,
    "avgLightIntensity" DOUBLE PRECISION NOT NULL,
    "maxLightIntensity" DOUBLE PRECISION NOT NULL,
    "lightDurationHours" DOUBLE PRECISION NOT NULL,
    "totalRainDuration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyEnvironmentStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Genus_name_key" ON "Genus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Species_name_key" ON "Species"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Species_slug_key" ON "Species"("slug");

-- CreateIndex
CREATE INDEX "Species_genusId_idx" ON "Species"("genusId");

-- CreateIndex
CREATE UNIQUE INDEX "Species_genusId_stockId_key" ON "Species"("genusId", "stockId");

-- CreateIndex
CREATE INDEX "ProductVariant_speciesId_idx" ON "ProductVariant"("speciesId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_speciesId_size_key" ON "ProductVariant"("speciesId", "size");

-- CreateIndex
CREATE UNIQUE INDEX "SpeciesImage_url_key" ON "SpeciesImage"("url");

-- CreateIndex
CREATE INDEX "SpeciesImage_speciesId_idx" ON "SpeciesImage"("speciesId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_zone_table_key" ON "Location"("zone", "table");

-- CreateIndex
CREATE INDEX "FloweringEvent_plantId_idx" ON "FloweringEvent"("plantId");

-- CreateIndex
CREATE INDEX "Plant_speciesId_idx" ON "Plant"("speciesId");

-- CreateIndex
CREATE INDEX "Plant_locationId_idx" ON "Plant"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "Agrochemical_name_key" ON "Agrochemical"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FertilizationProgram_name_key" ON "FertilizationProgram"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FertilizationCycle_programId_sequence_key" ON "FertilizationCycle"("programId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "PhytosanitaryProgram_name_key" ON "PhytosanitaryProgram"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PhytosanitaryCycle_programId_sequence_key" ON "PhytosanitaryCycle"("programId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationSchedule_name_key" ON "AutomationSchedule"("name");

-- CreateIndex
CREATE INDEX "TaskLog_scheduledAt_idx" ON "TaskLog"("scheduledAt");

-- CreateIndex
CREATE INDEX "TaskLog_status_idx" ON "TaskLog"("status");

-- CreateIndex
CREATE INDEX "DailyEnvironmentStat_date_idx" ON "DailyEnvironmentStat"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyEnvironmentStat_date_zone_key" ON "DailyEnvironmentStat"("date", "zone");

-- AddForeignKey
ALTER TABLE "Species" ADD CONSTRAINT "Species_genusId_fkey" FOREIGN KEY ("genusId") REFERENCES "Genus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species" ADD CONSTRAINT "Species_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesImage" ADD CONSTRAINT "SpeciesImage_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloweringEvent" ADD CONSTRAINT "FloweringEvent_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FertilizationCycle" ADD CONSTRAINT "FertilizationCycle_agrochemicalId_fkey" FOREIGN KEY ("agrochemicalId") REFERENCES "Agrochemical"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FertilizationCycle" ADD CONSTRAINT "FertilizationCycle_programId_fkey" FOREIGN KEY ("programId") REFERENCES "FertilizationProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhytosanitaryCycle" ADD CONSTRAINT "PhytosanitaryCycle_agrochemicalId_fkey" FOREIGN KEY ("agrochemicalId") REFERENCES "Agrochemical"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhytosanitaryCycle" ADD CONSTRAINT "PhytosanitaryCycle_programId_fkey" FOREIGN KEY ("programId") REFERENCES "PhytosanitaryProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationSchedule" ADD CONSTRAINT "AutomationSchedule_fertilizationProgramId_fkey" FOREIGN KEY ("fertilizationProgramId") REFERENCES "FertilizationProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationSchedule" ADD CONSTRAINT "AutomationSchedule_phytosanitaryProgramId_fkey" FOREIGN KEY ("phytosanitaryProgramId") REFERENCES "PhytosanitaryProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskLog" ADD CONSTRAINT "TaskLog_agrochemicalId_fkey" FOREIGN KEY ("agrochemicalId") REFERENCES "Agrochemical"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskLog" ADD CONSTRAINT "TaskLog_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "AutomationSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
