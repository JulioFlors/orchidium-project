-- AlterTable
ALTER TABLE "FloweringEvent" ADD COLUMN     "difAtInduction" DOUBLE PRECISION,
ADD COLUMN     "dliAtInduction" DOUBLE PRECISION,
ADD COLUMN     "humDayAverage" DOUBLE PRECISION,
ADD COLUMN     "humNightAverage" DOUBLE PRECISION,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "tempDayAverage" DOUBLE PRECISION,
ADD COLUMN     "tempNightAverage" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);
