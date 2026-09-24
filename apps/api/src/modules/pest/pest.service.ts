import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PestTreatment, TreatmentTrigger } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePestDetectionDto } from './dto/create-pest-detection.dto';

export type PestLevel = 'NORMAL' | 'MONITOREO' | 'INTERVENCION';

const CONSECUTIVE_FRAMES_TO_CONFIRM = 3;
// "Umbral configurable" (constitution.md #8): sin un valor oficial del
// dataset todavía, un conteo confirmado >= 5 detecciones/frame escala a
// Intervención (dispara tratamiento automático); por debajo, Monitoreo.
const INTERVENTION_COUNT_THRESHOLD = 5;
const TREATMENT_COOLDOWN_MS = 10 * 60 * 1000;

interface ZonePestState {
  consecutiveFrames: number;
  level: PestLevel;
  lastTreatmentAt: number | null;
}

export interface DetectionResult {
  zoneId: string;
  level: PestLevel;
  consecutiveFrames: number;
  treatmentTriggered: boolean;
}

@Injectable()
export class PestService {
  private readonly logger = new Logger(PestService.name);

  // Estado en memoria por zona (misma instancia, un frame por vez): contador
  // de frames consecutivos, nivel confirmado y cooldown del tratamiento.
  private readonly zoneStates = new Map<string, ZonePestState>();

  constructor(private readonly prisma: PrismaService) {}

  getLevel(zoneId: string): PestLevel {
    return this.getState(zoneId).level;
  }

  async recordDetection(dto: CreatePestDetectionDto): Promise<DetectionResult> {
    const zone = await this.prisma.zone.findUnique({
      where: { id: dto.zoneId },
    });
    if (!zone) {
      throw new BadRequestException('Zona no encontrada');
    }

    await this.prisma.pestDetection.create({
      data: {
        zoneId: dto.zoneId,
        count: dto.count,
        frameAt: dto.frameAt ? new Date(dto.frameAt) : new Date(),
      },
    });

    const state = this.getState(dto.zoneId);

    if (dto.count <= 0) {
      state.consecutiveFrames = 0;
      return this.toResult(dto.zoneId, state, false);
    }

    state.consecutiveFrames += 1;
    if (state.consecutiveFrames < CONSECUTIVE_FRAMES_TO_CONFIRM) {
      return this.toResult(dto.zoneId, state, false);
    }

    state.level =
      dto.count >= INTERVENTION_COUNT_THRESHOLD ? 'INTERVENCION' : 'MONITOREO';

    let treatmentTriggered = false;
    if (state.level === 'INTERVENCION' && !this.isInCooldown(state)) {
      await this.executeTreatment(dto.zoneId, TreatmentTrigger.AUTOMATIC, null);
      state.lastTreatmentAt = Date.now();
      treatmentTriggered = true;
      this.logger.warn(
        `Tratamiento automático ejecutado en zona ${dto.zoneId}`,
      );
    }

    return this.toResult(dto.zoneId, state, treatmentTriggered);
  }

  async treatManually(zoneId: string, userId: string): Promise<PestTreatment> {
    const state = this.getState(zoneId);
    if (state.level === 'NORMAL') {
      throw new BadRequestException('La zona no muestra indicios de plaga');
    }
    if (this.isInCooldown(state)) {
      const remainingMs =
        TREATMENT_COOLDOWN_MS - (Date.now() - state.lastTreatmentAt!);
      throw new ConflictException(
        `Tratamiento en cooldown, faltan ${Math.ceil(remainingMs / 1000)}s`,
      );
    }
    const treatment = await this.executeTreatment(
      zoneId,
      TreatmentTrigger.MANUAL,
      userId,
    );
    state.lastTreatmentAt = Date.now();
    return treatment;
  }

  private getState(zoneId: string): ZonePestState {
    let state = this.zoneStates.get(zoneId);
    if (!state) {
      state = { consecutiveFrames: 0, level: 'NORMAL', lastTreatmentAt: null };
      this.zoneStates.set(zoneId, state);
    }
    return state;
  }

  private isInCooldown(state: ZonePestState): boolean {
    return (
      state.lastTreatmentAt !== null &&
      Date.now() - state.lastTreatmentAt < TREATMENT_COOLDOWN_MS
    );
  }

  private executeTreatment(
    zoneId: string,
    trigger: TreatmentTrigger,
    triggeredBy: string | null,
  ): Promise<PestTreatment> {
    return this.prisma.pestTreatment.create({
      data: { zoneId, trigger, triggeredBy, executedAt: new Date() },
    });
  }

  private toResult(
    zoneId: string,
    state: ZonePestState,
    treatmentTriggered: boolean,
  ): DetectionResult {
    return {
      zoneId,
      level: state.level,
      consecutiveFrames: state.consecutiveFrames,
      treatmentTriggered,
    };
  }
}
