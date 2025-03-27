/*
  Warnings:

  - You are about to drop the column `productId` on the `FertilizationCycle` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `FertilizationTask` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `PhytosanitaryCycle` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `PhytosanitaryTask` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `Species` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `agrochemicalId` to the `FertilizationCycle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `agrochemicalId` to the `FertilizationTask` table without a default value. This is not possible if the table is not empty.
  - Added the required column `agrochemicalId` to the `PhytosanitaryCycle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `agrochemicalId` to the `PhytosanitaryTask` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AgrochemicalType" AS ENUM ('Fertilizante', 'Fitosanitario');

-- CreateEnum
CREATE TYPE "AgrochemicalPorpose" AS ENUM ('Desarrollo', 'Mantenimiento', 'Floracion', 'Fungicida', 'Insecticida', 'Acaricida');

-- DropForeignKey
ALTER TABLE "FertilizationCycle" DROP CONSTRAINT "FertilizationCycle_productId_fkey";

-- DropForeignKey
ALTER TABLE "FertilizationTask" DROP CONSTRAINT "FertilizationTask_productId_fkey";

-- DropForeignKey
ALTER TABLE "PhytosanitaryCycle" DROP CONSTRAINT "PhytosanitaryCycle_productId_fkey";

-- DropForeignKey
ALTER TABLE "PhytosanitaryTask" DROP CONSTRAINT "PhytosanitaryTask_productId_fkey";

-- AlterTable
ALTER TABLE "FertilizationCycle" DROP COLUMN "productId",
ADD COLUMN     "agrochemicalId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "FertilizationTask" DROP COLUMN "productId",
ADD COLUMN     "agrochemicalId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PhytosanitaryCycle" DROP COLUMN "productId",
ADD COLUMN     "agrochemicalId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PhytosanitaryTask" DROP COLUMN "productId",
ADD COLUMN     "agrochemicalId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Species" ALTER COLUMN "price" SET DEFAULT 0,
ALTER COLUMN "price" SET DATA TYPE INTEGER;

-- DropTable
DROP TABLE "Product";

-- DropEnum
DROP TYPE "ProductPorpose";

-- DropEnum
DROP TYPE "ProductType";

-- CreateTable
CREATE TABLE "Agrochemical" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "AgrochemicalType" NOT NULL,
    "porpose" "AgrochemicalPorpose" NOT NULL,
    "preparation" TEXT NOT NULL,

    CONSTRAINT "Agrochemical_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agrochemical_name_key" ON "Agrochemical"("name");

-- AddForeignKey
ALTER TABLE "FertilizationCycle" ADD CONSTRAINT "FertilizationCycle_agrochemicalId_fkey" FOREIGN KEY ("agrochemicalId") REFERENCES "Agrochemical"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FertilizationTask" ADD CONSTRAINT "FertilizationTask_agrochemicalId_fkey" FOREIGN KEY ("agrochemicalId") REFERENCES "Agrochemical"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhytosanitaryCycle" ADD CONSTRAINT "PhytosanitaryCycle_agrochemicalId_fkey" FOREIGN KEY ("agrochemicalId") REFERENCES "Agrochemical"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhytosanitaryTask" ADD CONSTRAINT "PhytosanitaryTask_agrochemicalId_fkey" FOREIGN KEY ("agrochemicalId") REFERENCES "Agrochemical"("id") ON DELETE CASCADE ON UPDATE CASCADE;
