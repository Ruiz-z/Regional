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

export const calcDurationMinutes = (
  humidity: number,
  threshold: number,
): number => {
  const deficit = threshold - humidity;
  return Math.min(
    MAX_DURATION_MINUTES,
    Math.max(MIN_DURATION_MINUTES, Math.round(deficit / 2)),
  );
};

export const decide = ({
  humidity,
  threshold,
  forecast,
  modelScore,
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
    durationMinutes: calcDurationMinutes(humidity, threshold),
    reason: { ...baseReason, motivo: 'humedad_baja' },
    esperaPorLluvia: false,
  };
};
