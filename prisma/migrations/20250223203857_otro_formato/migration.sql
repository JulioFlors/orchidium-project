/*
  Warnings:

  - The values [Mesa1,Mesa2,Mesa3,Mesa4,Mesa5,Mesa6] on the enum `TableType` will be removed. If these variants are still used in the database, this will fail.
  - The values [ZonaA,ZonaB,ZonaC,ZonaD] on the enum `ZoneType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TableType_new" AS ENUM ('Mesa_1', 'Mesa_2', 'Mesa_3', 'Mesa_4', 'Mesa_5', 'Mesa_6');
ALTER TABLE "Location" ALTER COLUMN "table" TYPE "TableType_new" USING ("table"::text::"TableType_new");
ALTER TYPE "TableType" RENAME TO "TableType_old";
ALTER TYPE "TableType_new" RENAME TO "TableType";
DROP TYPE "TableType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ZoneType_new" AS ENUM ('Zona_A', 'Zona_B', 'Zona_C', 'Zona_D');
ALTER TABLE "Location" ALTER COLUMN "zone" TYPE "ZoneType_new" USING ("zone"::text::"ZoneType_new");
ALTER TYPE "ZoneType" RENAME TO "ZoneType_old";
ALTER TYPE "ZoneType_new" RENAME TO "ZoneType";
DROP TYPE "ZoneType_old";
COMMIT;
