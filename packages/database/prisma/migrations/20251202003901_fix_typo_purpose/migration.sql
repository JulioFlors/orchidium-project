/*
  Warnings:

  - You are about to drop the column `porpose` on the `Agrochemical` table. All the data in the column will be lost.
  - You are about to drop the column `cronSchedule` on the `AutomationSchedule` table. All the data in the column will be lost.
  - Added the required column `purpose` to the `Agrochemical` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cronTrigger` to the `AutomationSchedule` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AgrochemicalPurpose" AS ENUM ('DESARROLLO', 'FLORACION', 'MANTENIMIENTO', 'ACARICIDA', 'BACTERICIDA', 'FUNGICIDA', 'INSECTICIDA');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TaskStatus" ADD VALUE 'CONFIRMED';
ALTER TYPE "TaskStatus" ADD VALUE 'IN_PROGRESS';
ALTER TYPE "TaskStatus" ADD VALUE 'WAITING_CONFIRMATION';

-- AlterTable
ALTER TABLE "Agrochemical" DROP COLUMN "porpose",
ADD COLUMN     "purpose" "AgrochemicalPurpose" NOT NULL;

-- AlterTable
ALTER TABLE "AutomationSchedule" DROP COLUMN "cronSchedule",
ADD COLUMN     "cronTrigger" TEXT NOT NULL,
ADD COLUMN     "intervalDays" INTEGER NOT NULL DEFAULT 1;

-- DropEnum
DROP TYPE "AgrochemicalPorpose";
