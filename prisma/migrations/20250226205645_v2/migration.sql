-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('Fertilizacion', 'Fumigacion', 'Riego');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('Pendiente', 'Completada', 'Cancelada', 'Reprogramada');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('Desarrollo', 'Mantenimiento', 'Floracion', 'General', 'Fungicida', 'Insecticida', 'Acaricida', 'Herbicida');

-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('Diario', 'Interdiario', 'Sensores');

-- CreateEnum
CREATE TYPE "ActuatorType" AS ENUM ('Aspercion', 'Nebulizacion', 'Humedecer_Suelo');

-- CreateEnum
CREATE TYPE "SensorType" AS ENUM ('Humedad_Relativa', 'Temperatura', 'Intensidad_Luminosa');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "porpose" "TaskType" NOT NULL,
    "type" "ProductType" NOT NULL,
    "preparation" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FertilizationProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weeksInCycle" INTEGER NOT NULL DEFAULT 4,

    CONSTRAINT "FertilizationProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FertilizationCycleWeek" (
    "id" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,

    CONSTRAINT "FertilizationCycleWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FertilizationTask" (
    "id" TEXT NOT NULL,
    "type" "TaskType" NOT NULL DEFAULT 'Fertilizacion',
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "executionDate" TIMESTAMP(3),
    "zones" "ZoneType"[],
    "note" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'Pendiente',
    "productId" TEXT NOT NULL,
    "cycleWeekId" TEXT,

    CONSTRAINT "FertilizationTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhytosanitaryProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cycleWeeks" INTEGER NOT NULL DEFAULT 3,
    "frequencyMonths" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "PhytosanitaryProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhytosanitaryTask" (
    "id" TEXT NOT NULL,
    "type" "TaskType" NOT NULL DEFAULT 'Fumigacion',
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "executionDate" TIMESTAMP(3),
    "zones" "ZoneType"[],
    "note" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'Pendiente',
    "productId" TEXT NOT NULL,
    "programId" TEXT,

    CONSTRAINT "PhytosanitaryTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IrrigationProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" "TriggerType" NOT NULL DEFAULT 'Interdiario',
    "actuator" "ActuatorType" NOT NULL DEFAULT 'Aspercion',
    "startTime" TEXT NOT NULL DEFAULT '05:00',
    "duration" INTEGER NOT NULL DEFAULT 20,
    "zones" "ZoneType"[] DEFAULT ARRAY['Zona_A', 'Zona_B']::"ZoneType"[],

    CONSTRAINT "IrrigationProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IrrigationTask" (
    "id" TEXT NOT NULL,
    "taskType" "TaskType" NOT NULL DEFAULT 'Riego',
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "executionDate" TIMESTAMP(3),
    "actuator" "ActuatorType" NOT NULL,
    "duration" INTEGER NOT NULL,
    "zones" "ZoneType"[],
    "status" "TaskStatus" NOT NULL DEFAULT 'Pendiente',
    "programId" TEXT,

    CONSTRAINT "IrrigationTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorReading" (
    "id" TEXT NOT NULL,
    "zone" "ZoneType" NOT NULL,
    "sensorType" "SensorType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensorReading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FertilizationProgram_name_key" ON "FertilizationProgram"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PhytosanitaryProgram_name_key" ON "PhytosanitaryProgram"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IrrigationProgram_name_key" ON "IrrigationProgram"("name");

-- AddForeignKey
ALTER TABLE "FertilizationCycleWeek" ADD CONSTRAINT "FertilizationCycleWeek_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FertilizationCycleWeek" ADD CONSTRAINT "FertilizationCycleWeek_programId_fkey" FOREIGN KEY ("programId") REFERENCES "FertilizationProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FertilizationTask" ADD CONSTRAINT "FertilizationTask_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FertilizationTask" ADD CONSTRAINT "FertilizationTask_cycleWeekId_fkey" FOREIGN KEY ("cycleWeekId") REFERENCES "FertilizationCycleWeek"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhytosanitaryProgram" ADD CONSTRAINT "PhytosanitaryProgram_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhytosanitaryTask" ADD CONSTRAINT "PhytosanitaryTask_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhytosanitaryTask" ADD CONSTRAINT "PhytosanitaryTask_programId_fkey" FOREIGN KEY ("programId") REFERENCES "PhytosanitaryProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IrrigationTask" ADD CONSTRAINT "IrrigationTask_programId_fkey" FOREIGN KEY ("programId") REFERENCES "IrrigationProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;
