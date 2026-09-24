import { Module } from '@nestjs/common';
import { ParcelsController } from './parcels.controller';
import { ParcelsService } from './parcels.service';
import { ZonesController } from './zones/zones.controller';
import { ZonesService } from './zones/zones.service';

@Module({
  controllers: [ParcelsController, ZonesController],
  providers: [ParcelsService, ZonesService],
  exports: [ParcelsService, ZonesService],
})
export class ParcelsModule {}
