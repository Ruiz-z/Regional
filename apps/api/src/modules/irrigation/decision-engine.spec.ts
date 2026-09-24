import { decide } from './decision-engine';
import { IrrigationDecision } from '../../generated/prisma/client';

describe('decision-engine', () => {
  it('humedad >= umbral -> ESPERAR (humedad suficiente)', () => {
    const result = decide({
      humidity: 60,
      threshold: 50,
      forecast: null,
      modelScore: 0.5,
    });
    expect(result.decision).toBe(IrrigationDecision.ESPERAR);
    expect(result.durationMinutes).toBeNull();
    expect(result.reason.motivo).toBe('humedad_suficiente');
    expect(result.esperaPorLluvia).toBe(false);
  });

  it('humedad < umbral y sin pronóstico -> REGAR con duración', () => {
    const result = decide({
      humidity: 20,
      threshold: 50,
      forecast: null,
      modelScore: 0.5,
    });
    expect(result.decision).toBe(IrrigationDecision.REGAR);
    expect(result.durationMinutes).toBeGreaterThan(0);
    expect(result.reason.motivo).toBe('humedad_baja');
  });

  it('humedad < umbral pero se pronostica lluvia -> ESPERAR por lluvia', () => {
    const result = decide({
      humidity: 20,
      threshold: 50,
      forecast: { willRain: true, rainMm: 3, description: 'lluvia' },
      modelScore: 0.5,
    });
    expect(result.decision).toBe(IrrigationDecision.ESPERAR);
    expect(result.esperaPorLluvia).toBe(true);
    expect(result.reason.motivo).toBe('lluvia_prevista');
  });

  it('humedad < umbral y pronóstico sin lluvia -> REGAR (decide igual sin pronóstico útil)', () => {
    const result = decide({
      humidity: 20,
      threshold: 50,
      forecast: { willRain: false, rainMm: 0, description: 'despejado' },
      modelScore: 0.5,
    });
    expect(result.decision).toBe(IrrigationDecision.REGAR);
  });

  it('la duración de riego respeta el rango 5-30 minutos', () => {
    const casiSinDeficit = decide({
      humidity: 49,
      threshold: 50,
      forecast: null,
      modelScore: 0.5,
    });
    expect(casiSinDeficit.durationMinutes).toBe(5);

    const deficitEnorme = decide({
      humidity: 0,
      threshold: 100,
      forecast: null,
      modelScore: 0.5,
    });
    expect(deficitEnorme.durationMinutes).toBe(30);
  });
});
