import { Module } from '@nestjs/common';
import { DroneController } from './drone.controller';
import { DroneStatusController } from './drone-status.controller';
import { DroneService } from './drone.service';

@Module({
  controllers: [DroneController, DroneStatusController],
  providers: [DroneService],
})
export class DroneModule {}
