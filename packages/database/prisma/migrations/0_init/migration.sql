-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ZoneType" AS ENUM ('ZONA_A', 'ZONA_B', 'ZONA_C', 'ZONA_D', 'EXTERIOR');

-- CreateEnum
CREATE TYPE "TableType" AS ENUM ('MESA_1', 'MESA_2', 'MESA_3', 'MESA_4', 'MESA_5', 'MESA_6');

-- CreateEnum
CREATE TYPE "PlantType" AS ENUM ('ADENIUM_OBESUM', 'BROMELIAD', 'CACTUS', 'ORCHID', 'SUCCULENT');

-- CreateEnum
CREATE TYPE "PotSize" AS ENUM ('NRO_5', 'NRO_7', 'NRO_10', 'NRO_14');

-- CreateEnum
CREATE TYPE "PlantStatus" AS ENUM ('AVAILABLE', 'MOTHER');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('CANCELLED', 'COMPLETED', 'CONFIRMED', 'FAILED', 'IN_PROGRESS', 'PENDING', 'SKIPPED', 'WAITING_CONFIRMATION', 'AUTHORIZED', 'DISPATCHED', 'ACKNOWLEDGED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TaskSource" AS ENUM ('MANUAL', 'DEFERRED', 'ROUTINE', 'INFERENCE');

-- CreateEnum
CREATE TYPE "TaskPurpose" AS ENUM ('IRRIGATION', 'FERTIGATION', 'FUMIGATION', 'HUMIDIFICATION', 'SOIL_WETTING');

-- CreateEnum
CREATE TYPE "AgrochemicalType" AS ENUM ('FERTILIZANTE', 'FITOSANITARIO');

-- CreateEnum
CREATE TYPE "AgrochemicalPurpose" AS ENUM ('DESARROLLO', 'FLORACION', 'MANTENIMIENTO', 'ACARICIDA', 'BACTERICIDA', 'FUNGICIDA', 'INSECTICIDA');

-- CreateEnum
CREATE TYPE "WeatherCondition" AS ENUM ('CLEAR', 'CLOUDY', 'RAIN', 'STORM', 'FOG', 'SNOW', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PestCategory" AS ENUM ('INSECT', 'FUNGUS', 'BACTERIA', 'MITE', 'VIRUS', 'OTHER');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MAINTENANCE_REMINDER', 'AGROCHEMICAL_CONFIRM', 'SYSTEM_ALERT', 'TASK_STATUS');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'DISMISSED');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "idToken" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
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
    "description" TEXT,
    "genusId" TEXT NOT NULL,

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
    "currentSize" "PotSize" NOT NULL,
    "status" "PlantStatus" NOT NULL DEFAULT 'AVAILABLE',
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
    "purpose" "AgrochemicalPurpose" NOT NULL,
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
    "cronTrigger" TEXT NOT NULL,
    "intervalDays" INTEGER NOT NULL DEFAULT 1,
    "durationMinutes" INTEGER NOT NULL DEFAULT 10,
    "zones" "ZoneType"[],
    "fertilizationProgramId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "phytosanitaryProgramId" TEXT,

    CONSTRAINT "AutomationSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskLog" (
    "id" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "source" "TaskSource" NOT NULL DEFAULT 'MANUAL',
    "purpose" "TaskPurpose" NOT NULL,
    "zones" "ZoneType"[],
    "duration" INTEGER NOT NULL,
    "notes" TEXT,
    "agrochemicalId" TEXT,
    "scheduleId" TEXT,
    "actualStartAt" TIMESTAMP(3),
    "completedMinutes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TaskLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskEventLog" (
    "id" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "taskId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "TaskEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyEnvironmentStat" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "zone" "ZoneType" NOT NULL,
    "avgTemperature" DOUBLE PRECISION,
    "minTemperature" DOUBLE PRECISION,
    "maxTemperature" DOUBLE PRECISION,
    "avgHumidity" DOUBLE PRECISION,
    "minHumidity" DOUBLE PRECISION,
    "maxHumidity" DOUBLE PRECISION,
    "lightDurationHours" DOUBLE PRECISION NOT NULL,
    "totalRainDuration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avgIlluminance" DOUBLE PRECISION,
    "maxIlluminance" DOUBLE PRECISION,
    "avgTempDay" DOUBLE PRECISION,
    "avgTempNight" DOUBLE PRECISION,
    "dif" DOUBLE PRECISION,
    "dli" DOUBLE PRECISION,
    "highHumidityHours" DOUBLE PRECISION,
    "irrigationMinutes" INTEGER,
    "maxHumTime" TEXT,
    "maxIllumTime" TEXT,
    "maxTempTime" TEXT,
    "minHumTime" TEXT,
    "minIllumTime" TEXT,
    "minIlluminance" DOUBLE PRECISION,
    "minTempTime" TEXT,
    "nebulizationMinutes" INTEGER,
    "totalWaterEvents" INTEGER,
    "vpdAvg" DOUBLE PRECISION,
    "vpdMax" DOUBLE PRECISION,
    "vpdMin" DOUBLE PRECISION,
    "dayType" TEXT,

    CONSTRAINT "DailyEnvironmentStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceLog" (
    "id" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "status" "DeviceStatus" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT NOT NULL,

    CONSTRAINT "DeviceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherForecast" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "pressure" DOUBLE PRECISION,
    "precipProb" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "condition" "WeatherCondition" NOT NULL DEFAULT 'UNKNOWN',
    "windSpeed" DOUBLE PRECISION,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "soilMoisture" DOUBLE PRECISION,
    "soilTemp" DOUBLE PRECISION,

    CONSTRAINT "WeatherForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherAlert" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeatherAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "PestCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PestSighting" (
    "id" TEXT NOT NULL,
    "pestId" TEXT,
    "pestName" TEXT,
    "zone" "ZoneType" NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'LOW',
    "notes" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "plantId" TEXT,

    CONSTRAINT "PestSighting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "taskId" TEXT,
    "targetUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Genus_name_key" ON "Genus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Species_name_key" ON "Species"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Species_slug_key" ON "Species"("slug");

-- CreateIndex
CREATE INDEX "Species_genusId_idx" ON "Species"("genusId");

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
CREATE INDEX "Plant_status_idx" ON "Plant"("status");

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
CREATE INDEX "TaskEventLog_taskId_idx" ON "TaskEventLog"("taskId");

-- CreateIndex
CREATE INDEX "TaskEventLog_timestamp_idx" ON "TaskEventLog"("timestamp");

-- CreateIndex
CREATE INDEX "DailyEnvironmentStat_date_idx" ON "DailyEnvironmentStat"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyEnvironmentStat_date_zone_key" ON "DailyEnvironmentStat"("date", "zone");

-- CreateIndex
CREATE INDEX "DeviceLog_device_idx" ON "DeviceLog"("device");

-- CreateIndex
CREATE INDEX "DeviceLog_timestamp_idx" ON "DeviceLog"("timestamp");

-- CreateIndex
CREATE INDEX "WeatherForecast_timestamp_idx" ON "WeatherForecast"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherForecast_timestamp_source_key" ON "WeatherForecast"("timestamp", "source");

-- CreateIndex
CREATE INDEX "WeatherAlert_startsAt_idx" ON "WeatherAlert"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Pest_name_key" ON "Pest"("name");

-- CreateIndex
CREATE INDEX "PestSighting_zone_idx" ON "PestSighting"("zone");

-- CreateIndex
CREATE INDEX "PestSighting_pestId_idx" ON "PestSighting"("pestId");

-- CreateIndex
CREATE INDEX "PestSighting_plantId_idx" ON "PestSighting"("plantId");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_targetUserId_idx" ON "Notification"("targetUserId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species" ADD CONSTRAINT "Species_genusId_fkey" FOREIGN KEY ("genusId") REFERENCES "Genus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesImage" ADD CONSTRAINT "SpeciesImage_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloweringEvent" ADD CONSTRAINT "FloweringEvent_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "TaskEventLog" ADD CONSTRAINT "TaskEventLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TaskLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskEventLog" ADD CONSTRAINT "TaskEventLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PestSighting" ADD CONSTRAINT "PestSighting_pestId_fkey" FOREIGN KEY ("pestId") REFERENCES "Pest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PestSighting" ADD CONSTRAINT "PestSighting_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TaskLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
