-- CreateTable
CREATE TABLE "RainEvent" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "peakIntensity" DOUBLE PRECISION,
    "zone" "ZoneType" NOT NULL DEFAULT 'EXTERIOR',
    "closedBy" TEXT,

    CONSTRAINT "RainEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RainEvent_startedAt_idx" ON "RainEvent"("startedAt");

-- CreateIndex
CREATE INDEX "RainEvent_zone_idx" ON "RainEvent"("zone");

-- CreateIndex
CREATE INDEX "RainEvent_endedAt_idx" ON "RainEvent"("endedAt");
