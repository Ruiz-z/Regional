import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { IrrigationDecision } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WeatherService } from '../weather/weather.service';
import { CreateIrrigationEventDto } from './dto/create-irrigation-event.dto';
import { CreateReadingDto } from './dto/create-reading.dto';
import { calcDurationMinutes, decide, getModelScore } from './decision-engine';

// Heurística de "lluvia suficiente" para RF-8: sin un dato oficial de mm
// esperados por parte de OpenWeather-por-ubicación, se usa un umbral fijo de
// incremento de humedad entre ciclos (documentado, ajustable a futuro).
const EXPECTED_RAIN_HUMIDITY_INCREASE = 5;
const CONSECUTIVE_REGAR_FOR_ANOMALY = 3;

interface EventReason {
  humidity: number;
  previousHumidity: number | null;
}

@Injectable()
export class IrrigationService {
  private readonly logger = new Logger(IrrigationService.name);

  // Estado en memoria (una sola instancia, ciclo de 1 min): zona en espera
  // por lluvia pendiente de verificar en el siguiente ciclo (RF-8), y zonas
  // cuyo próximo evento de riego debe marcarse como corrección.
  private readonly pendingRainWait = new Map<
    string,
    { humidityAtDecision: number }
  >();
  private readonly pendingRainCorrection = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly weather: WeatherService,
  ) {}

  async recordReading(zoneId: string, dto: CreateReadingDto) {
    if (dto.humidity < 0 || dto.humidity > 100) {
      this.logger.warn(
        `Lectura de humedad fuera de rango (${dto.humidity}%) en zona ${zoneId}, se descarta`,
      );
      return { discarded: true, motivo: 'humedad_fuera_de_rango' };
    }

    const zone = await this.prisma.zone.findUnique({
      where: { id: zoneId },
      include: { parcel: true },
    });
    if (!zone) {
      throw new BadRequestException('Zona no encontrada para este dispositivo');
    }

    await this.prisma.reading.create({
      data: {
        zoneId,
        humidity: dto.humidity,
        temperature: dto.temperature,
      },
    });

    const pending = this.pendingRainWait.get(zoneId);
    if (pending) {
      this.pendingRainWait.delete(zoneId);
      const increase = dto.humidity - pending.humidityAtDecision;
      if (increase < EXPECTED_RAIN_HUMIDITY_INCREASE) {
        this.pendingRainCorrection.add(zoneId);
        return {
          decision: IrrigationDecision.REGAR,
          durationMinutes: calcDurationMinutes(
            dto.humidity,
            zone.humidityThreshold,
          ),
          reason: {
            humidity: dto.humidity,
            motivo: 'correccion_lluvia_insuficiente',
            incrementoEsperado: EXPECTED_RAIN_HUMIDITY_INCREASE,
            incrementoReal: increase,
          },
        };
      }
      return {
        decision: IrrigationDecision.ESPERAR,
        durationMinutes: null,
        reason: {
          humidity: dto.humidity,
          motivo: 'lluvia_cumplida',
          incrementoEsperado: EXPECTED_RAIN_HUMIDITY_INCREASE,
          incrementoReal: increase,
        },
      };
    }

    const forecast = await this.weather.getForecast(zone.parcel.location);
    const result = decide({
      humidity: dto.humidity,
      threshold: zone.humidityThreshold,
      forecast,
      modelScore: getModelScore(),
    });

    if (result.esperaPorLluvia) {
      this.pendingRainWait.set(zoneId, { humidityAtDecision: dto.humidity });
    }

    return {
      decision: result.decision,
      durationMinutes: result.durationMinutes,
      reason: result.reason,
    };
  }

  async recordIrrigationEvent(zoneId: string, dto: CreateIrrigationEventDto) {
    const readings = await this.prisma.reading.findMany({
      where: { zoneId },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });
    const reason: EventReason = {
      humidity: readings[0]?.humidity ?? 0,
      previousHumidity: readings[1]?.humidity ?? null,
    };

    const correctedForRain = this.pendingRainCorrection.delete(zoneId);

    const event = await this.prisma.irrigationEvent.create({
      data: {
        zoneId,
        decision: IrrigationDecision.REGAR,
        durationMinutes: dto.durationMinutes,
        reason: reason as unknown as Prisma.InputJsonValue,
        correctedForRain,
      },
    });

    const anomalyDetected = await this.detectAnomaly(zoneId);
    if (anomalyDetected) {
      this.logger.warn(`Anomalía de riego detectada en zona ${zoneId}`);
    }

    return { ...event, anomalyDetected };
  }

  private async detectAnomaly(zoneId: string): Promise<boolean> {
    const lastEvents = await this.prisma.irrigationEvent.findMany({
      where: { zoneId, decision: IrrigationDecision.REGAR },
      orderBy: { createdAt: 'desc' },
      take: CONSECUTIVE_REGAR_FOR_ANOMALY,
    });
    if (lastEvents.length < CONSECUTIVE_REGAR_FOR_ANOMALY) {
      return false;
    }

    const chronological = [...lastEvents].reverse();
    return chronological.every((event, index) => {
      if (index === 0) return true;
      const prevReason = chronological[index - 1]
        .reason as unknown as EventReason;
      const reason = event.reason as unknown as EventReason;
      return reason.humidity <= prevReason.humidity;
    });
  }
}
