import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DeviceKeyGuard } from '../devices/guards/device-key.guard';
import { CreatePestDetectionDto } from './dto/create-pest-detection.dto';
import { PestService } from './pest.service';

@Controller('pest-detections')
@UseGuards(DeviceKeyGuard)
export class PestDetectionsController {
  constructor(private readonly pestService: PestService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  create(@Body() dto: CreatePestDetectionDto) {
    return this.pestService.recordDetection(dto);
  }
}
