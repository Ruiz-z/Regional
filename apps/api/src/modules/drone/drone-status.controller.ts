import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentDevice } from '../devices/current-device.decorator';
import type { DeviceRequest } from '../devices/current-device.decorator';
import { DeviceKeyGuard } from '../devices/guards/device-key.guard';
import { DroneService } from './drone.service';

// Sin guards de clase a propósito (mismo criterio que
// WeeklySummaryCronController): lo consulta el ESP32, que no tiene JWT, solo
// su X-Device-Key.
@Controller('drone-status')
@UseGuards(DeviceKeyGuard)
export class DroneStatusController {
  constructor(private readonly droneService: DroneService) {}

  @Get()
  check(@CurrentDevice() device: DeviceRequest['device']): {
    shouldActivate: boolean;
  } {
    return {
      shouldActivate: device.zoneId
        ? this.droneService.consumeServoRequest(device.zoneId)
        : false,
    };
  }
}
