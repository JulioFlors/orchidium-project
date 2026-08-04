-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAYMENT_VERIFYING', 'PAID', 'DISPATCHED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAGO_MOVIL', 'ZELLE', 'BANESCO_PANAMA', 'TRANSFERENCIA_VES', 'EFECTIVO_DIVISAS');

-- CreateEnum
CREATE TYPE "SaleType" AS ENUM ('ONLINE_ORDER', 'DIRECT_MANUAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PlantStatus" ADD VALUE 'RESERVED';
ALTER TYPE "PlantStatus" ADD VALUE 'SOLD';
