-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('User', 'Admin');

-- CreateEnum
CREATE TYPE "public"."ZoneType" AS ENUM ('Zona_A', 'Zona_B', 'Zona_C', 'Zona_D');

-- CreateEnum
CREATE TYPE "public"."TableType" AS ENUM ('Mesa_1', 'Mesa_2', 'Mesa_3', 'Mesa_4', 'Mesa_5', 'Mesa_6');

-- CreateEnum
CREATE TYPE "public"."PlantType" AS ENUM ('Adenium_Obesum', 'Bromeliad', 'Cactus', 'Orchid', 'Succulent');

-- CreateEnum
CREATE TYPE "public"."PotSize" AS ENUM ('Nro_5', 'Nro_7', 'Nro_10', 'Nro_14');

-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('Pendiente', 'Completada', 'Cancelada', 'Reprogramada');

-- CreateEnum
CREATE TYPE "public"."AgrochemicalType" AS ENUM ('Fertilizante', 'Fitosanitario');

-- CreateEnum
CREATE TYPE "public"."AgrochemicalPorpose" AS ENUM ('Desarrollo', 'Floracion', 'Mantenimiento', 'Acaricida', 'Bactericida', 'Fungicida', 'Insecticida');

-- CreateEnum
CREATE TYPE "public"."TriggerType" AS ENUM ('Diario', 'Interdiario', 'Sensores');

-- CreateEnum
CREATE TYPE "public"."ActuatorType" AS ENUM ('Aspercion', 'Nebulizacion', 'Humedecer_Suelo');

-- CreateEnum
CREATE TYPE "public"."Metric" AS ENUM ('Humidity', 'Light_intensity', 'Pressure', 'Rain_intensity_percent', 'Temperature');

-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('Irrigation_State', 'Rain_State', 'Rain_Duration', 'Device_Status');

-- CreateTable
CREATE TABLE "public"."Stock" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Genus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."PlantType" NOT NULL,

    CONSTRAINT "Genus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Species" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "genusId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,

    CONSTRAINT "Species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SpeciesImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,

    CONSTRAINT "SpeciesImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Location" (
    "id" TEXT NOT NULL,
    "zone" "public"."ZoneType" NOT NULL,
    "table" "public"."TableType" NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Plant" (
    "id" TEXT NOT NULL,
    "pottingDate" TIMESTAMP(3),
    "speciesId" TEXT NOT NULL,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Agrochemical" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "public"."AgrochemicalType" NOT NULL,
    "porpose" "public"."AgrochemicalPorpose" NOT NULL,
    "preparation" TEXT NOT NULL,

    CONSTRAINT "Agrochemical_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FertilizationProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weeklyFrequency" INTEGER NOT NULL,

    CONSTRAINT "FertilizationProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FertilizationCycle" (
    "id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "agrochemicalId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,

    CONSTRAINT "FertilizationCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FertilizationTask" (
    "id" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "executionDate" TIMESTAMP(3),
    "zones" "public"."ZoneType"[],
    "note" TEXT,
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'Pendiente',
    "agrochemicalId" TEXT NOT NULL,
    "productsCycleId" TEXT,

    CONSTRAINT "FertilizationTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PhytosanitaryProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyFrequency" INTEGER NOT NULL,

    CONSTRAINT "PhytosanitaryProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PhytosanitaryCycle" (
    "id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "agrochemicalId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,

    CONSTRAINT "PhytosanitaryCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PhytosanitaryTask" (
    "id" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "executionDate" TIMESTAMP(3),
    "zones" "public"."ZoneType"[],
    "note" TEXT,
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'Pendiente',
    "agrochemicalId" TEXT NOT NULL,
    "productsCycleId" TEXT,

    CONSTRAINT "PhytosanitaryTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IrrigationProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" "public"."TriggerType" NOT NULL DEFAULT 'Interdiario',
    "actuator" "public"."ActuatorType" NOT NULL DEFAULT 'Aspercion',
    "startTime" TEXT NOT NULL DEFAULT '05:00',
    "duration" INTEGER NOT NULL DEFAULT 20,
    "zones" "public"."ZoneType"[] DEFAULT ARRAY['Zona_A', 'Zona_B']::"public"."ZoneType"[],

    CONSTRAINT "IrrigationProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IrrigationTask" (
    "id" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "executionDate" TIMESTAMP(3),
    "actuator" "public"."ActuatorType" NOT NULL,
    "duration" INTEGER NOT NULL,
    "zones" "public"."ZoneType"[],
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'Pendiente',
    "programId" TEXT,

    CONSTRAINT "IrrigationTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SensorReading" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zone" "public"."ZoneType" NOT NULL,
    "metric" "public"."Metric" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "topic" TEXT NOT NULL,

    CONSTRAINT "SensorReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zone" "public"."ZoneType" NOT NULL,
    "eventType" "public"."EventType" NOT NULL,
    "value" TEXT NOT NULL,
    "topic" TEXT NOT NULL,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Genus_name_key" ON "public"."Genus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Species_name_key" ON "public"."Species"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Species_slug_key" ON "public"."Species"("slug");

-- CreateIndex
CREATE INDEX "Species_genusId_idx" ON "public"."Species"("genusId");

-- CreateIndex
CREATE UNIQUE INDEX "SpeciesImage_url_key" ON "public"."SpeciesImage"("url");

-- CreateIndex
CREATE INDEX "SpeciesImage_speciesId_idx" ON "public"."SpeciesImage"("speciesId");

-- CreateIndex
CREATE INDEX "Plant_speciesId_idx" ON "public"."Plant"("speciesId");

-- CreateIndex
CREATE INDEX "Plant_locationId_idx" ON "public"."Plant"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "Agrochemical_name_key" ON "public"."Agrochemical"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FertilizationProgram_name_key" ON "public"."FertilizationProgram"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PhytosanitaryProgram_name_key" ON "public"."PhytosanitaryProgram"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IrrigationProgram_name_key" ON "public"."IrrigationProgram"("name");

-- AddForeignKey
ALTER TABLE "public"."Species" ADD CONSTRAINT "Species_genusId_fkey" FOREIGN KEY ("genusId") REFERENCES "public"."Genus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Species" ADD CONSTRAINT "Species_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "public"."Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SpeciesImage" ADD CONSTRAINT "SpeciesImage_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "public"."Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Plant" ADD CONSTRAINT "Plant_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "public"."Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Plant" ADD CONSTRAINT "Plant_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FertilizationCycle" ADD CONSTRAINT "FertilizationCycle_agrochemicalId_fkey" FOREIGN KEY ("agrochemicalId") REFERENCES "public"."Agrochemical"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FertilizationCycle" ADD CONSTRAINT "FertilizationCycle_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."FertilizationProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FertilizationTask" ADD CONSTRAINT "FertilizationTask_agrochemicalId_fkey" FOREIGN KEY ("agrochemicalId") REFERENCES "public"."Agrochemical"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FertilizationTask" ADD CONSTRAINT "FertilizationTask_productsCycleId_fkey" FOREIGN KEY ("productsCycleId") REFERENCES "public"."FertilizationCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PhytosanitaryCycle" ADD CONSTRAINT "PhytosanitaryCycle_agrochemicalId_fkey" FOREIGN KEY ("agrochemicalId") REFERENCES "public"."Agrochemical"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PhytosanitaryCycle" ADD CONSTRAINT "PhytosanitaryCycle_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."PhytosanitaryProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PhytosanitaryTask" ADD CONSTRAINT "PhytosanitaryTask_agrochemicalId_fkey" FOREIGN KEY ("agrochemicalId") REFERENCES "public"."Agrochemical"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PhytosanitaryTask" ADD CONSTRAINT "PhytosanitaryTask_productsCycleId_fkey" FOREIGN KEY ("productsCycleId") REFERENCES "public"."PhytosanitaryCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IrrigationTask" ADD CONSTRAINT "IrrigationTask_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."IrrigationProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
