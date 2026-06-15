-- AlterTable
ALTER TABLE "RainEvent" RENAME COLUMN "isVirtual" TO "isInfered";
ALTER TABLE "RainEvent" ADD COLUMN "baselineTemp" DOUBLE PRECISION;
ALTER TABLE "RainEvent" ADD COLUMN "baselineHum" DOUBLE PRECISION;
ALTER TABLE "RainEvent" ADD COLUMN "baselineLux" DOUBLE PRECISION;
ALTER TABLE "RainEvent" ADD COLUMN "triggerReason" TEXT;
ALTER TABLE "RainEvent" ADD COLUMN "closeReason" TEXT;
