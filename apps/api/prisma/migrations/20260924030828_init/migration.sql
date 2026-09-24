-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('AGRICULTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('ESP32', 'VISION_SERVICE');

-- CreateEnum
CREATE TYPE "IrrigationDecision" AS ENUM ('REGAR', 'ESPERAR');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('RAIN_CORRECTION', 'IRRIGATION_ANOMALY', 'PEST_ALERT');

-- CreateEnum
CREATE TYPE "NotificationSeverity" AS ENUM ('INFO', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TreatmentTrigger" AS ENUM ('AUTOMATIC', 'MANUAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcels" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "crop" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "parcels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "humidityThreshold" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "type" "DeviceType" NOT NULL,
    "zoneId" TEXT NOT NULL,
    "apiKeyHash" TEXT NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "lastSeenAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readings" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "irrigation_events" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "decision" "IrrigationDecision" NOT NULL,
    "durationMinutes" INTEGER,
    "reason" JSONB NOT NULL,
    "correctedForRain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "irrigation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pest_detections" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "frameAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pest_detections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pest_treatments" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "trigger" "TreatmentTrigger" NOT NULL,
    "triggeredBy" TEXT,
    "executedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pest_treatments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "zoneId" TEXT,
    "type" "NotificationType" NOT NULL,
    "severity" "NotificationSeverity" NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "parcels_ownerId_idx" ON "parcels"("ownerId");

-- CreateIndex
CREATE INDEX "zones_parcelId_idx" ON "zones"("parcelId");

-- CreateIndex
CREATE UNIQUE INDEX "devices_apiKeyHash_key" ON "devices"("apiKeyHash");

-- CreateIndex
CREATE INDEX "devices_zoneId_idx" ON "devices"("zoneId");

-- CreateIndex
CREATE INDEX "readings_zoneId_createdAt_idx" ON "readings"("zoneId", "createdAt");

-- CreateIndex
CREATE INDEX "irrigation_events_zoneId_createdAt_idx" ON "irrigation_events"("zoneId", "createdAt");

-- CreateIndex
CREATE INDEX "pest_detections_zoneId_createdAt_idx" ON "pest_detections"("zoneId", "createdAt");

-- CreateIndex
CREATE INDEX "pest_treatments_zoneId_createdAt_idx" ON "pest_treatments"("zoneId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "readings" ADD CONSTRAINT "readings_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "irrigation_events" ADD CONSTRAINT "irrigation_events_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pest_detections" ADD CONSTRAINT "pest_detections_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pest_treatments" ADD CONSTRAINT "pest_treatments_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
