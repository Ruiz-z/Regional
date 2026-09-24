import { Module } from '@nestjs/common';
import { WeatherModule } from '../weather/weather.module';
import { IrrigationController } from './irrigation.controller';
import { IrrigationService } from './irrigation.service';

@Module({
  imports: [WeatherModule],
  controllers: [IrrigationController],
  providers: [IrrigationService],
})
export class IrrigationModule {}
