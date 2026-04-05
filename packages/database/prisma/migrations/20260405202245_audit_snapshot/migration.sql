-- CreateTable
CREATE TABLE "AuditSnapshot" (
    "id" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditSnapshot_device_category_idx" ON "AuditSnapshot"("device", "category");

-- CreateIndex
CREATE INDEX "AuditSnapshot_createdAt_idx" ON "AuditSnapshot"("createdAt");
