import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PestDetectionsController } from './pest-detections.controller';
import { PestService } from './pest.service';
import { ZonesTreatController } from './zones-treat.controller';

@Module({
  imports: [NotificationsModule],
  controllers: [PestDetectionsController, ZonesTreatController],
  providers: [PestService],
})
export class PestModule {}
