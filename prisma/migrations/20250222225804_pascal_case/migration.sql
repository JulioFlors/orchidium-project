/*
  Warnings:

  - The values [CATTLEYA,DENDROBIUM,ADENIUM_OBESUM,MAMMILLARIA,HAWORTHIA] on the enum `GenusType` will be removed. If these variants are still used in the database, this will fail.
  - The values [ORCHID,ADENIUM,CACTUS,SUCCULENT] on the enum `PlantType` will be removed. If these variants are still used in the database, this will fail.
  - The values [USER,ADMIN] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - The values [MESA_1,MESA_2,MESA_3,MESA_4,MESA_5,MESA_6] on the enum `TableType` will be removed. If these variants are still used in the database, this will fail.
  - The values [ZONA_A,ZONA_B,ZONA_C,ZONA_D] on the enum `ZoneType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GenusType_new" AS ENUM ('Cattleya', 'Dendrobium', 'Dimerandra', 'Enciclea', 'AdeniumObesum', 'Mammillaria', 'Haworthia');
ALTER TABLE "Species" ALTER COLUMN "genus" TYPE "GenusType_new" USING ("genus"::text::"GenusType_new");
ALTER TYPE "GenusType" RENAME TO "GenusType_old";
ALTER TYPE "GenusType_new" RENAME TO "GenusType";
DROP TYPE "GenusType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PlantType_new" AS ENUM ('Orchid', 'Adenium', 'Cactus', 'Succulent');
ALTER TABLE "Species" ALTER COLUMN "type" TYPE "PlantType_new" USING ("type"::text::"PlantType_new");
ALTER TYPE "PlantType" RENAME TO "PlantType_old";
ALTER TYPE "PlantType_new" RENAME TO "PlantType";
DROP TYPE "PlantType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('User', 'Admin');
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TableType_new" AS ENUM ('Mesa1', 'Mesa2', 'Mesa3', 'Mesa4', 'Mesa5', 'Mesa6');
ALTER TABLE "Location" ALTER COLUMN "table" TYPE "TableType_new" USING ("table"::text::"TableType_new");
ALTER TYPE "TableType" RENAME TO "TableType_old";
ALTER TYPE "TableType_new" RENAME TO "TableType";
DROP TYPE "TableType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ZoneType_new" AS ENUM ('ZonaA', 'ZonaB', 'ZonaC', 'ZonaD');
ALTER TABLE "Location" ALTER COLUMN "zone" TYPE "ZoneType_new" USING ("zone"::text::"ZoneType_new");
ALTER TYPE "ZoneType" RENAME TO "ZoneType_old";
ALTER TYPE "ZoneType_new" RENAME TO "ZoneType";
DROP TYPE "ZoneType_old";
COMMIT;
