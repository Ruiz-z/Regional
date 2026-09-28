import type { WeatherForecast } from '../weather/weather.types';
import { IrrigationDecision } from '../../generated/prisma/client';

// Score de un modelo entrenado con dataset (constitution.md #6). Stub hasta
// que exista el modelo real: no cambia la decisión todavía, solo viaja en
// `reason` para que la respuesta ya sea explicable de punta a punta (BE-022).
export const getModelScore = (): number => 0.5;

export interface DecisionInput {
  humidity: number;
  threshold: number;
  forecast: WeatherForecast | null;
  modelScore: number;
  areaHectares?: number | null;
  efficiencyPerMinute?: number | null;
}

export interface DecisionReason {
  humidity: number;
  threshold: number;
  forecast: WeatherForecast | null;
  modelScore: number;
  motivo: string;
}

export interface DecisionResult {
  decision: IrrigationDecision;
  durationMinutes: number | null;
  reason: DecisionReason;
  esperaPorLluvia: boolean;
}

const MIN_DURATION_MINUTES = 5;
const MAX_DURATION_MINUTES = 30;

export interface DurationOptions {
  // Puntos de humedad ganados por minuto regado, promediados de los
  // riegos pasados reales de la zona (ver
  // IrrigationService.calcZoneEfficiency). Sin historial suficiente, se
  // usa el fallback fijo de siempre (deficit / 2).
  efficiencyPerMinute?: number | null;
  // Superficie real de la zona: a más hectáreas, más tiempo para la misma
  // cobertura (mismo caudal fijo asumido). Sin dato, factor neutro (1x).
  areaHectares?: number | null;
}

export const calcDurationMinutes = (
  humidity: number,
  threshold: number,
  options: DurationOptions = {},
): number => {
  const deficit = threshold - humidity;
  const baseMinutes =
    options.efficiencyPerMinute && options.efficiencyPerMinute > 0
      ? deficit / options.efficiencyPerMinute
      : deficit / 2;
  const areaFactor =
    options.areaHectares && options.areaHectares > 0
      ? options.areaHectares
      : 1;
  return Math.min(
    MAX_DURATION_MINUTES,
    Math.max(MIN_DURATION_MINUTES, Math.round(baseMinutes * areaFactor)),
  );
};

export const decide = ({
  humidity,
  threshold,
  forecast,
  modelScore,
  areaHectares,
  efficiencyPerMinute,
}: DecisionInput): DecisionResult => {
  const baseReason = { humidity, threshold, forecast, modelScore };

  if (humidity >= threshold) {
    return {
      decision: IrrigationDecision.ESPERAR,
      durationMinutes: null,
      reason: { ...baseReason, motivo: 'humedad_suficiente' },
      esperaPorLluvia: false,
    };
  }

  if (forecast?.willRain) {
    return {
      decision: IrrigationDecision.ESPERAR,
      durationMinutes: null,
      reason: { ...baseReason, motivo: 'lluvia_prevista' },
      esperaPorLluvia: true,
    };
  }

  return {
    decision: IrrigationDecision.REGAR,
    durationMinutes: calcDurationMinutes(humidity, threshold, {
      areaHectares,
      efficiencyPerMinute,
    }),
    reason: { ...baseReason, motivo: 'humedad_baja' },
    esperaPorLluvia: false,
  };
};
