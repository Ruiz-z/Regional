import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Línea base de riego tradicional por zona (spec-007 RF-4, "Dudas abiertas":
// sin un valor oficial por cultivo, se usa un fijo documentado y ajustable).
const BASELINE_MINUTES_PER_DAY = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface ZoneReport {
  zoneId: string;
  zoneName: string;
  minutesRegados: number;
  minutesBaseline: number;
  ahorradoMinutos: number;
  ahorradoPorcentaje: number;
  irrigationEvents: unknown[];
  pestDetections: unknown[];
  pestTreatments: unknown[];
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHistory(parcelId: string, from: Date, to: Date) {
    if (from.getTime() > to.getTime()) {
      throw new BadRequestException(
        'El rango de fechas es inválido (from > to)',
      );
    }

    const zones = await this.prisma.zone.findMany({
      where: { parcelId },
      include: {
        irrigationEvents: {
          where: { createdAt: { gte: from, lte: to } },
          orderBy: { createdAt: 'asc' },
        },
        pestDetections: {
          where: { frameAt: { gte: from, lte: to } },
          orderBy: { frameAt: 'asc' },
        },
        pestTreatments: {
          where: { executedAt: { gte: from, lte: to } },
          orderBy: { executedAt: 'asc' },
        },
      },
    });

    const days = Math.max(
      1,
      Math.ceil((to.getTime() - from.getTime()) / DAY_MS),
    );
    const minutesBaseline = BASELINE_MINUTES_PER_DAY * days;

    const zoneReports: ZoneReport[] = zones.map((zone) => {
      const minutesRegados = zone.irrigationEvents.reduce(
        (sum, e) => sum + (e.durationMinutes ?? 0),
        0,
      );
      const ahorradoMinutos = Math.max(0, minutesBaseline - minutesRegados);
      const ahorradoPorcentaje =
        minutesBaseline > 0
          ? Math.round((ahorradoMinutos / minutesBaseline) * 100)
          : 0;

      return {
        zoneId: zone.id,
        zoneName: zone.name,
        minutesRegados,
        minutesBaseline,
        ahorradoMinutos,
        ahorradoPorcentaje,
        irrigationEvents: zone.irrigationEvents,
        pestDetections: zone.pestDetections,
        pestTreatments: zone.pestTreatments,
      };
    });

    const totalMinutesRegados = zoneReports.reduce(
      (sum, z) => sum + z.minutesRegados,
      0,
    );
    const totalMinutesBaseline = zoneReports.reduce(
      (sum, z) => sum + z.minutesBaseline,
      0,
    );
    const totalAhorradoMinutos = Math.max(
      0,
      totalMinutesBaseline - totalMinutesRegados,
    );
    const totalAhorradoPorcentaje =
      totalMinutesBaseline > 0
        ? Math.round((totalAhorradoMinutos / totalMinutesBaseline) * 100)
        : 0;

    return {
      from,
      to,
      zones: zoneReports,
      totals: {
        minutesRegados: totalMinutesRegados,
        minutesBaseline: totalMinutesBaseline,
        ahorradoMinutos: totalAhorradoMinutos,
        ahorradoPorcentaje: totalAhorradoPorcentaje,
      },
    };
  }
}
