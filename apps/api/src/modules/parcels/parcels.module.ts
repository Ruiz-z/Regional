import { Module } from '@nestjs/common';
import { PestModule } from '../pest/pest.module';
import { WeatherModule } from '../weather/weather.module';
import { CropCatalogController } from './crop-catalog.controller';
import { ParcelsController } from './parcels.controller';
import { ParcelsService } from './parcels.service';
import { ZonesController } from './zones/zones.controller';
import { ZonesService } from './zones/zones.service';
import { ZoneStatusService } from './zones/zone-status.service';

@Module({
  imports: [PestModule, WeatherModule],
  controllers: [ParcelsController, ZonesController, CropCatalogController],
  providers: [ParcelsService, ZonesService, ZoneStatusService],
  exports: [ParcelsService, ZonesService],
})
export class ParcelsModule {}
