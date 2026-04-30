-- AlterEnum
BEGIN;
CREATE TYPE "TaskStatus_new" AS ENUM ('CANCELLED', 'COMPLETED', 'CONFIRMED', 'FAILED', 'IN_PROGRESS', 'PENDING', 'WAITING_CONFIRMATION', 'AUTHORIZED', 'DISPATCHED', 'ACKNOWLEDGED', 'EXPIRED');

-- Update any existing SKIPPED rows to CANCELLED just in case
UPDATE "TaskLog" SET "status" = 'CANCELLED' WHERE "status"::text = 'SKIPPED';
UPDATE "TaskEventLog" SET "status" = 'CANCELLED' WHERE "status"::text = 'SKIPPED';

ALTER TABLE "TaskLog" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "TaskEventLog" ALTER COLUMN "status" TYPE "TaskStatus_new" USING ("status"::text::"TaskStatus_new");
ALTER TABLE "TaskLog" ALTER COLUMN "status" TYPE "TaskStatus_new" USING ("status"::text::"TaskStatus_new");

ALTER TYPE "TaskStatus" RENAME TO "TaskStatus_old";
ALTER TYPE "TaskStatus_new" RENAME TO "TaskStatus";
DROP TYPE "TaskStatus_old";

ALTER TABLE "TaskLog" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
