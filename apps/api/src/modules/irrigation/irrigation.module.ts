import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { WeatherModule } from '../weather/weather.module';
import { IrrigationController } from './irrigation.controller';
import { IrrigationService } from './irrigation.service';

@Module({
  imports: [WeatherModule, NotificationsModule],
  controllers: [IrrigationController],
  providers: [IrrigationService],
})
export class IrrigationModule {}
