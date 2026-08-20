-- AlterTable: Species (agregar campos de Benchmark de Floración)
ALTER TABLE "Species" ADD COLUMN "floweringDurationDays" INTEGER;
ALTER TABLE "Species" ADD COLUMN "floweringFrequencyYear" INTEGER;
ALTER TABLE "Species" ADD COLUMN "floweringMonths" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
ALTER TABLE "Species" ADD COLUMN "floweringRecordsCount" INTEGER NOT NULL DEFAULT 0;
