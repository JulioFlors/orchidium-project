/*
  Warnings:

  - Added the required column `topic` to the `SensorReading` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SensorReading" ADD COLUMN     "topic" TEXT NOT NULL;
