-- AlterTable
ALTER TABLE "DailyEnvironmentStat" ADD COLUMN "avgIllumDawn" DOUBLE PRECISION;
ALTER TABLE "DailyEnvironmentStat" ADD COLUMN "minIllumDawn" DOUBLE PRECISION;
ALTER TABLE "DailyEnvironmentStat" ADD COLUMN "minIllumDawnTime" TEXT;
ALTER TABLE "DailyEnvironmentStat" ADD COLUMN "maxIllumDawn" DOUBLE PRECISION;
ALTER TABLE "DailyEnvironmentStat" ADD COLUMN "maxIllumDawnTime" TEXT;

ALTER TABLE "DailyEnvironmentStat" ADD COLUMN "avgIllumDay" DOUBLE PRECISION;
ALTER TABLE "DailyEnvironmentStat" ADD COLUMN "minIllumDay" DOUBLE PRECISION;
ALTER TABLE "DailyEnvironmentStat" ADD COLUMN "minIllumDayTime" TEXT;
ALTER TABLE "DailyEnvironmentStat" ADD COLUMN "maxIllumDay" DOUBLE PRECISION;
ALTER TABLE "DailyEnvironmentStat" ADD COLUMN "maxIllumDayTime" TEXT;

ALTER TABLE "DailyEnvironmentStat" ADD COLUMN "avgIllumDusk" DOUBLE PRECISION;
ALTER TABLE "DailyEnvironmentStat" ADD COLUMN "minIllumDusk" DOUBLE PRECISION;
ALTER TABLE "DailyEnvironmentStat" ADD COLUMN "minIllumDuskTime" TEXT;
ALTER TABLE "DailyEnvironmentStat" ADD COLUMN "maxIllumDusk" DOUBLE PRECISION;
ALTER TABLE "DailyEnvironmentStat" ADD COLUMN "maxIllumDuskTime" TEXT;
