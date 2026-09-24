import { Module } from '@nestjs/common';
import { PestModule } from '../pest/pest.module';
import { ParcelsController } from './parcels.controller';
import { ParcelsService } from './parcels.service';
import { ZonesController } from './zones/zones.controller';
import { ZonesService } from './zones/zones.service';
import { ZoneStatusService } from './zones/zone-status.service';

@Module({
  imports: [PestModule],
  controllers: [ParcelsController, ZonesController],
  providers: [ParcelsService, ZonesService, ZoneStatusService],
  exports: [ParcelsService, ZonesService],
})
export class ParcelsModule {}
