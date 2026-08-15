-- CreateEnum
CREATE TYPE "DosingSource" AS ENUM ('ROUTINE', 'DEFERRED');

-- CreateEnum
CREATE TYPE "DosageUnit" AS ENUM ('ML_PER_L', 'G_PER_L', 'CC_PER_L', 'DROPS_PER_L');

-- AlterTable: Agrochemical (agregar campos de dosificación y mezclas)
ALTER TABLE "Agrochemical" ADD COLUMN "dosageUnit" "DosageUnit",
ADD COLUMN "dosageValue" DOUBLE PRECISION,
ADD COLUMN "isMix" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: AgrochemicalMixItem
CREATE TABLE "AgrochemicalMixItem" (
    "id" TEXT NOT NULL,
    "parentMixId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "dosageValue" DOUBLE PRECISION NOT NULL,
    "dosageUnit" "DosageUnit" NOT NULL,

    CONSTRAINT "AgrochemicalMixItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DosingSchedule
CREATE TABLE "DosingSchedule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "purpose" "TaskPurpose" NOT NULL,
    "cronTrigger" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 0,
    "zones" "ZoneType"[],
    "fertilizationProgramId" TEXT,
    "phytosanitaryProgramId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DosingSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DosingLog
CREATE TABLE "DosingLog" (
    "id" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "executedAt" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "source" "DosingSource" NOT NULL DEFAULT 'DEFERRED',
    "purpose" "TaskPurpose" NOT NULL,
    "zones" "ZoneType"[],
    "duration" INTEGER NOT NULL DEFAULT 15,
    "notes" TEXT,
    "agrochemicalId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DosingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable: FilterCleaningLog
CREATE TABLE "FilterCleaningLog" (
    "id" TEXT NOT NULL,
    "cleanedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextDueAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "confirmedBy" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FilterCleaningLog_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Notification (vincular a DosingLog)
ALTER TABLE "Notification" ADD COLUMN "dosingLogId" TEXT;

-- AlterTable: AutomationSchedule (eliminar executionType y garantizar name único)
DROP INDEX IF EXISTS "AutomationSchedule_name_executionType_key";
ALTER TABLE "AutomationSchedule" DROP COLUMN IF EXISTS "executionType";
CREATE UNIQUE INDEX "AutomationSchedule_name_key" ON "AutomationSchedule"("name");

-- DropTable: ManualDosingLog si existía
DROP TABLE IF EXISTS "ManualDosingLog";

-- DropEnum: ExecutionType si existía
DROP TYPE IF EXISTS "ExecutionType";

-- CreateIndex: AgrochemicalMixItem
CREATE UNIQUE INDEX "AgrochemicalMixItem_parentMixId_ingredientId_key" ON "AgrochemicalMixItem"("parentMixId", "ingredientId");

-- CreateIndex: DosingSchedule
CREATE UNIQUE INDEX "DosingSchedule_name_key" ON "DosingSchedule"("name");

-- CreateIndex: DosingLog
CREATE INDEX "DosingLog_scheduledAt_idx" ON "DosingLog"("scheduledAt");
CREATE INDEX "DosingLog_status_idx" ON "DosingLog"("status");

-- CreateIndex: FilterCleaningLog
CREATE INDEX "FilterCleaningLog_cleanedAt_idx" ON "FilterCleaningLog"("cleanedAt");
CREATE INDEX "FilterCleaningLog_nextDueAt_idx" ON "FilterCleaningLog"("nextDueAt");

-- AddForeignKey: AgrochemicalMixItem
ALTER TABLE "AgrochemicalMixItem" ADD CONSTRAINT "AgrochemicalMixItem_parentMixId_fkey" FOREIGN KEY ("parentMixId") REFERENCES "Agrochemical"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgrochemicalMixItem" ADD CONSTRAINT "AgrochemicalMixItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Agrochemical"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: DosingSchedule
ALTER TABLE "DosingSchedule" ADD CONSTRAINT "DosingSchedule_fertilizationProgramId_fkey" FOREIGN KEY ("fertilizationProgramId") REFERENCES "FertilizationProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DosingSchedule" ADD CONSTRAINT "DosingSchedule_phytosanitaryProgramId_fkey" FOREIGN KEY ("phytosanitaryProgramId") REFERENCES "PhytosanitaryProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: DosingLog
ALTER TABLE "DosingLog" ADD CONSTRAINT "DosingLog_agrochemicalId_fkey" FOREIGN KEY ("agrochemicalId") REFERENCES "Agrochemical"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DosingLog" ADD CONSTRAINT "DosingLog_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "DosingSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Notification
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_dosingLogId_fkey" FOREIGN KEY ("dosingLogId") REFERENCES "DosingLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
