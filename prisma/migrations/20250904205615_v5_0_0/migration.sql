/*
  Warnings:

  - You are about to drop the column `sensorType` on the `SensorReading` table. All the data in the column will be lost.
  - Added the required column `metric` to the `SensorReading` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Metric" AS ENUM ('Humidity', 'Light_intensity', 'Pressure', 'Rain_intensity_percent', 'Temperature');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('Irrigation_State', 'Rain_State', 'Rain_Duration', 'Device_Status');

-- AlterEnum
ALTER TYPE "AgrochemicalPorpose" ADD VALUE 'Bactericida';

-- AlterTable
ALTER TABLE "SensorReading" DROP COLUMN "sensorType",
ADD COLUMN     "metric" "Metric" NOT NULL;

-- DropEnum
DROP TYPE "SensorType";

-- CreateTable
CREATE TABLE "EventLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zone" "ZoneType" NOT NULL,
    "eventType" "EventType" NOT NULL,
    "value" TEXT NOT NULL,
    "topic" TEXT NOT NULL,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);
