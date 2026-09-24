import { Injectable } from '@nestjs/common';
import type { Zone } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PestService } from '../../pest/pest.service';
import type { PestLevel } from '../../pest/pest.service';

export interface ZoneWithStatus extends Zone {
  latestReading: {
    humidity: number;
    temperature: number;
    createdAt: Date;
  } | null;
  pestLevel: PestLevel;
  cooldownUntil: Date | null;
  lastTreatmentAt: Date | null;
}

// Enriquece zonas con su estado actual (lectura más reciente + nivel de
// plaga) para el dashboard — reutilizado por /parcels y /parcels/:id/zones,
// no cambia el contrato de ninguno de los dos (solo agrega campos).
@Injectable()
export class ZoneStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pestService: PestService,
  ) {}

  async attach(zones: Zone[]): Promise<ZoneWithStatus[]> {
    return Promise.all(
      zones.map(async (zone) => {
        const latestReading = await this.prisma.reading.findFirst({
          where: { zoneId: zone.id },
          orderBy: { createdAt: 'desc' },
          select: { humidity: true, temperature: true, createdAt: true },
        });
        return {
          ...zone,
          latestReading,
          pestLevel: this.pestService.getLevel(zone.id),
          cooldownUntil: this.pestService.getCooldownUntil(zone.id),
          lastTreatmentAt: this.pestService.getLastTreatmentAt(zone.id),
        };
      }),
    );
  }
}
