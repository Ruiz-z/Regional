import { IsEnum, IsOptional, IsString } from 'class-validator';
import type { DeviceType } from '../../../generated/prisma/client';

export class CreateDeviceDto {
  @IsEnum(['ESP32', 'VISION_SERVICE'] as const)
  type!: DeviceType;

  @IsOptional()
  @IsString()
  zoneId?: string;
}
