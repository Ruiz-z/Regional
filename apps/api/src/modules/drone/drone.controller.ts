import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../generated/prisma/client';
import { ZoneOwnerGuard } from '../pest/guards/zone-owner.guard';
import { DroneService } from './drone.service';

interface DetectResponse {
  detected: boolean;
  confidence: number | null;
}

@Controller('zones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DroneController {
  constructor(
    private readonly droneService: DroneService,
    private readonly config: ConfigService,
  ) {}

  @Post(':id/call-drone')
  @Roles(UserRole.AGRICULTOR)
  @UseGuards(ZoneOwnerGuard)
  @HttpCode(HttpStatus.OK)
  async callDrone(@Param('id') zoneId: string): Promise<DetectResponse> {
    const baseUrl = this.config.get<string>('drone.visionServiceUrl');
    const secret = this.config.get<string>('drone.visionInternalSecret');
    try {
      const res = await fetch(`${baseUrl}/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': secret ?? '',
        },
        body: JSON.stringify({ zoneId }),
      });
      if (!res.ok) {
        throw new ServiceUnavailableException(
          'El servicio de visión no pudo procesar la detección',
        );
      }
      return (await res.json()) as DetectResponse;
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new ServiceUnavailableException(
        'No se pudo contactar al servicio de visión',
      );
    }
  }

  @Post(':id/deploy-drone-servo')
  @Roles(UserRole.AGRICULTOR)
  @UseGuards(ZoneOwnerGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  deployDroneServo(@Param('id') zoneId: string): { accepted: true } {
    this.droneService.requestServo(zoneId);
    return { accepted: true };
  }
}
