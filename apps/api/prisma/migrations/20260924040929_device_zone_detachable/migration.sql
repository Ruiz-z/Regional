-- DropForeignKey
ALTER TABLE "devices" DROP CONSTRAINT "devices_zoneId_fkey";

-- AlterTable
ALTER TABLE "devices" ALTER COLUMN "zoneId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
