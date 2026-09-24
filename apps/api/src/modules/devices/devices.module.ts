import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { DeviceKeyGuard } from './guards/device-key.guard';

@Module({
  controllers: [DevicesController],
  providers: [DevicesService, DeviceKeyGuard],
  exports: [DevicesService, DeviceKeyGuard],
})
export class DevicesModule {}
