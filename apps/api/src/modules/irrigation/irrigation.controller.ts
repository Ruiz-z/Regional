import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentDevice } from '../devices/current-device.decorator';
import { DeviceKeyGuard } from '../devices/guards/device-key.guard';
import { CreateIrrigationEventDto } from './dto/create-irrigation-event.dto';
import { CreateReadingDto } from './dto/create-reading.dto';
import { IrrigationService } from './irrigation.service';

interface DeviceContext {
  zoneId: string | null;
}

@Controller()
@UseGuards(DeviceKeyGuard)
export class IrrigationController {
  constructor(private readonly irrigationService: IrrigationService) {}

  @Post('readings')
  @HttpCode(HttpStatus.OK)
  createReading(
    @CurrentDevice() device: DeviceContext,
    @Body() dto: CreateReadingDto,
  ) {
    const zoneId = this.requireZone(device);
    return this.irrigationService.recordReading(zoneId, dto);
  }

  @Post('irrigation-events')
  @HttpCode(HttpStatus.CREATED)
  createIrrigationEvent(
    @CurrentDevice() device: DeviceContext,
    @Body() dto: CreateIrrigationEventDto,
  ) {
    const zoneId = this.requireZone(device);
    return this.irrigationService.recordIrrigationEvent(zoneId, dto);
  }

  private requireZone(device: DeviceContext): string {
    if (!device.zoneId) {
      throw new BadRequestException('Dispositivo sin zona asignada');
    }
    return device.zoneId;
  }
}
