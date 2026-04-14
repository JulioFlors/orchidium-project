/*
  Warnings:

  - The values [ORACLE_INFERENCE] on the enum `TaskSource` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TaskSource_new" AS ENUM ('MANUAL', 'DEFERRED', 'ROUTINE', 'INFERENCE');
ALTER TABLE "public"."TaskLog" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "TaskLog" ALTER COLUMN "source" TYPE "TaskSource_new" USING ("source"::text::"TaskSource_new");
ALTER TYPE "TaskSource" RENAME TO "TaskSource_old";
ALTER TYPE "TaskSource_new" RENAME TO "TaskSource";
DROP TYPE "public"."TaskSource_old";
ALTER TABLE "TaskLog" ALTER COLUMN "source" SET DEFAULT 'MANUAL';
COMMIT;
