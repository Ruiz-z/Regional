import { IrrigationDecision } from '../../generated/prisma/client';
import { IrrigationService } from './irrigation.service';
import { WeatherService } from '../weather/weather.service';

describe('IrrigationService', () => {
  let prisma: {
    zone: { findUnique: jest.Mock };
    reading: { create: jest.Mock; findMany: jest.Mock };
    irrigationEvent: { create: jest.Mock; findMany: jest.Mock };
  };
  let weather: { getForecast: jest.Mock };
  let service: IrrigationService;

  const zoneA = {
    id: 'zone-a',
    humidityThreshold: 50,
    parcel: { location: 'Guanajuato, MX' },
  };
  const zoneB = {
    id: 'zone-b',
    humidityThreshold: 50,
    parcel: { location: 'Guanajuato, MX' },
  };

  beforeEach(() => {
    prisma = {
      zone: { findUnique: jest.fn() },
      reading: { create: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      irrigationEvent: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    weather = { getForecast: jest.fn().mockResolvedValue(null) };
    service = new IrrigationService(
      prisma as never,
      weather as unknown as WeatherService,
    );
  });

  it('humedad fuera de rango se descarta y no se persiste ni decide', async () => {
    const result = await service.recordReading('zone-a', {
      humidity: 150,
      temperature: 20,
    });
    expect(result).toEqual({
      discarded: true,
      motivo: 'humedad_fuera_de_rango',
    });
    expect(prisma.reading.create).not.toHaveBeenCalled();
  });

  it('humedad baja sin pronóstico -> REGAR', async () => {
    prisma.zone.findUnique.mockResolvedValue(zoneA);
    const result = await service.recordReading('zone-a', {
      humidity: 20,
      temperature: 20,
    });
    expect(result.decision).toBe(IrrigationDecision.REGAR);
    expect(prisma.reading.create).toHaveBeenCalledWith({
      data: { zoneId: 'zone-a', humidity: 20, temperature: 20 },
    });
  });

  it('humedad alta -> ESPERAR', async () => {
    prisma.zone.findUnique.mockResolvedValue(zoneA);
    const result = await service.recordReading('zone-a', {
      humidity: 80,
      temperature: 20,
    });
    expect(result.decision).toBe(IrrigationDecision.ESPERAR);
  });

  it('RF-6: 2 zonas de la misma parcela deciden independiente en el mismo ciclo', async () => {
    prisma.zone.findUnique.mockImplementation(
      ({ where }: { where: { id: string } }) =>
        Promise.resolve(where.id === 'zone-a' ? zoneA : zoneB),
    );
    const resultA = await service.recordReading('zone-a', {
      humidity: 20,
      temperature: 20,
    });
    const resultB = await service.recordReading('zone-b', {
      humidity: 80,
      temperature: 20,
    });
    expect(resultA.decision).toBe(IrrigationDecision.REGAR);
    expect(resultB.decision).toBe(IrrigationDecision.ESPERAR);
  });

  it('RF-8: ESPERAR por lluvia + siguiente ciclo sin mejora suficiente -> REGAR corregido', async () => {
    prisma.zone.findUnique.mockResolvedValue(zoneA);
    weather.getForecast.mockResolvedValue({
      willRain: true,
      rainMm: 2,
      description: 'lluvia',
    });
    const first = await service.recordReading('zone-a', {
      humidity: 20,
      temperature: 20,
    });
    expect(first.decision).toBe(IrrigationDecision.ESPERAR);

    const second = await service.recordReading('zone-a', {
      humidity: 21, // subió solo 1%, menos del umbral esperado (5%)
      temperature: 20,
    });
    expect(second.decision).toBe(IrrigationDecision.REGAR);
    expect(second.reason).toMatchObject({
      motivo: 'correccion_lluvia_insuficiente',
    });
  });

  it('RF-8: ESPERAR por lluvia + siguiente ciclo con mejora suficiente -> sigue ESPERAR', async () => {
    prisma.zone.findUnique.mockResolvedValue(zoneA);
    weather.getForecast.mockResolvedValue({
      willRain: true,
      rainMm: 5,
      description: 'lluvia',
    });
    await service.recordReading('zone-a', { humidity: 20, temperature: 20 });
    const second = await service.recordReading('zone-a', {
      humidity: 30, // subió 10%, suficiente
      temperature: 20,
    });
    expect(second.decision).toBe(IrrigationDecision.ESPERAR);
    expect(second.reason).toMatchObject({ motivo: 'lluvia_cumplida' });
  });

  it('POST irrigation-events persiste el evento con la humedad de la última lectura', async () => {
    prisma.reading.findMany.mockResolvedValue([
      { humidity: 20, createdAt: new Date() },
    ]);
    prisma.irrigationEvent.create.mockResolvedValue({
      id: 'ev-1',
      zoneId: 'zone-a',
      decision: IrrigationDecision.REGAR,
      durationMinutes: 10,
      correctedForRain: false,
    });
    const result = await service.recordIrrigationEvent('zone-a', {
      durationMinutes: 10,
    });
    const createCall = (
      prisma.irrigationEvent.create.mock.calls as unknown[][]
    )[0][0] as {
      data: {
        zoneId: string;
        decision: IrrigationDecision;
        durationMinutes: number;
        correctedForRain: boolean;
      };
    };
    expect(createCall.data.zoneId).toBe('zone-a');
    expect(createCall.data.decision).toBe(IrrigationDecision.REGAR);
    expect(createCall.data.durationMinutes).toBe(10);
    expect(createCall.data.correctedForRain).toBe(false);
    expect(result.anomalyDetected).toBe(false);
  });

  it('RF-9: 3 riegos consecutivos sin subir humedad -> anomalía', async () => {
    prisma.reading.findMany.mockResolvedValue([
      { humidity: 20, createdAt: new Date() },
    ]);
    prisma.irrigationEvent.create.mockResolvedValue({ id: 'ev-3' });
    prisma.irrigationEvent.findMany.mockResolvedValue([
      { reason: { humidity: 18 }, createdAt: new Date(3) },
      { reason: { humidity: 19 }, createdAt: new Date(2) },
      { reason: { humidity: 20 }, createdAt: new Date(1) },
    ]);
    const result = await service.recordIrrigationEvent('zone-a', {
      durationMinutes: 10,
    });
    expect(result.anomalyDetected).toBe(true);
  });

  it('RF-9: 2 riegos sin mejora NO disparan anomalía (se necesitan 3)', async () => {
    prisma.reading.findMany.mockResolvedValue([
      { humidity: 20, createdAt: new Date() },
    ]);
    prisma.irrigationEvent.create.mockResolvedValue({ id: 'ev-2' });
    prisma.irrigationEvent.findMany.mockResolvedValue([
      { reason: { humidity: 19 }, createdAt: new Date(2) },
      { reason: { humidity: 20 }, createdAt: new Date(1) },
    ]);
    const result = await service.recordIrrigationEvent('zone-a', {
      durationMinutes: 10,
    });
    expect(result.anomalyDetected).toBe(false);
  });
});
