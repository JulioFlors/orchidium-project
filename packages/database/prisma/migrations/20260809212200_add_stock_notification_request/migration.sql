-- CreateEnum
CREATE TYPE "StockRequestStatus" AS ENUM ('PENDING', 'NOTIFIED', 'COMPLETED', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('PAGO_MOVIL', 'TRANSFERENCIA_VES', 'EFECTIVO_DIVISAS');
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "public"."PaymentMethod_old";
COMMIT;

-- CreateTable
CREATE TABLE "StockNotificationRequest" (
    "id" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "variantId" TEXT,
    "size" "PotSize",
    "status" "StockRequestStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockNotificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockNotificationRequest_phoneNumber_idx" ON "StockNotificationRequest"("phoneNumber");

-- CreateIndex
CREATE INDEX "StockNotificationRequest_speciesId_idx" ON "StockNotificationRequest"("speciesId");

-- CreateIndex
CREATE INDEX "StockNotificationRequest_status_idx" ON "StockNotificationRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StockNotificationRequest_phoneNumber_speciesId_size_key" ON "StockNotificationRequest"("phoneNumber", "speciesId", "size");

-- AddForeignKey
ALTER TABLE "StockNotificationRequest" ADD CONSTRAINT "StockNotificationRequest_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockNotificationRequest" ADD CONSTRAINT "StockNotificationRequest_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
