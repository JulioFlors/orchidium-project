-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ONLINE', 'OFFLINE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TaskStatus" ADD VALUE 'AUTHORIZED';
ALTER TYPE "TaskStatus" ADD VALUE 'DISPATCHED';
ALTER TYPE "TaskStatus" ADD VALUE 'ACKNOWLEDGED';

-- AlterTable
ALTER TABLE "TaskLog" ADD COLUMN     "actualStartAt" TIMESTAMP(3),
ADD COLUMN     "completedMinutes" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "TaskEventLog" (
    "id" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "taskId" TEXT NOT NULL,

    CONSTRAINT "TaskEventLog_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE INDEX "TaskEventLog_taskId_idx" ON "TaskEventLog"("taskId");

-- CreateIndex
CREATE INDEX "TaskEventLog_timestamp_idx" ON "TaskEventLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceLog_device_key" ON "DeviceLog"("device");

-- CreateIndex
CREATE INDEX "DeviceLog_device_idx" ON "DeviceLog"("device");

-- CreateIndex
CREATE INDEX "DeviceLog_timestamp_idx" ON "DeviceLog"("timestamp");

-- AddForeignKey
ALTER TABLE "TaskEventLog" ADD CONSTRAINT "TaskEventLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TaskLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
