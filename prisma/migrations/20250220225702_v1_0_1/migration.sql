/*
  Warnings:

  - Made the column `stockId` on table `Species` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Species" ALTER COLUMN "stockId" SET NOT NULL;
