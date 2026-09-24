import { Module } from '@nestjs/common';
import { PestDetectionsController } from './pest-detections.controller';
import { PestService } from './pest.service';
import { ZonesTreatController } from './zones-treat.controller';

@Module({
  controllers: [PestDetectionsController, ZonesTreatController],
  providers: [PestService],
})
export class PestModule {}
