/*
  Warnings:

  - You are about to drop the column `avgLightIntensity` on the `DailyEnvironmentStat` table. All the data in the column will be lost.
  - You are about to drop the column `maxLightIntensity` on the `DailyEnvironmentStat` table. All the data in the column will be lost.
  - You are about to drop the column `cancellationReason` on the `TaskLog` table. All the data in the column will be lost.
  - Added the required column `avgIlluminance` to the `DailyEnvironmentStat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxIlluminance` to the `DailyEnvironmentStat` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WeatherCondition" AS ENUM ('CLEAR', 'CLOUDY', 'RAIN', 'STORM', 'FOG', 'SNOW', 'UNKNOWN');

-- AlterEnum
ALTER TYPE "ZoneType" ADD VALUE 'EXTERIOR';

-- AlterTable
ALTER TABLE "DailyEnvironmentStat" DROP COLUMN "avgLightIntensity",
DROP COLUMN "maxLightIntensity",
ADD COLUMN     "avgIlluminance" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "maxIlluminance" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "TaskLog" DROP COLUMN "cancellationReason";

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

-- CreateIndex
CREATE INDEX "WeatherForecast_timestamp_idx" ON "WeatherForecast"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherForecast_timestamp_source_key" ON "WeatherForecast"("timestamp", "source");

-- CreateIndex
CREATE INDEX "WeatherAlert_startsAt_idx" ON "WeatherAlert"("startsAt");
