-- DropForeignKey
ALTER TABLE "irrigation_events" DROP CONSTRAINT "irrigation_events_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "pest_detections" DROP CONSTRAINT "pest_detections_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "pest_treatments" DROP CONSTRAINT "pest_treatments_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "readings" DROP CONSTRAINT "readings_zoneId_fkey";

-- AddForeignKey
ALTER TABLE "readings" ADD CONSTRAINT "readings_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "irrigation_events" ADD CONSTRAINT "irrigation_events_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pest_detections" ADD CONSTRAINT "pest_detections_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pest_treatments" ADD CONSTRAINT "pest_treatments_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
