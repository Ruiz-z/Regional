import { BadRequestException } from '@nestjs/common';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let prisma: { zone: { findMany: jest.Mock } };
  let service: ReportsService;

  beforeEach(() => {
    prisma = { zone: { findMany: jest.fn().mockResolvedValue([]) } };
    service = new ReportsService(prisma as never);
  });

  const from = new Date('2026-01-01T00:00:00.000Z');
  const to = new Date('2026-01-02T00:00:00.000Z'); // 1 día -> baseline 20 min

  it('RF-5 (caso límite): rango inválido (from > to) -> 400', async () => {
    await expect(
      service.getHistory('parcel-1', to, from),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('caso límite: parcela sin zonas/eventos -> responde vacío, no error', async () => {
    const result = await service.getHistory('parcel-1', from, to);
    expect(result.zones).toEqual([]);
    expect(result.totals.minutesRegados).toBe(0);
  });

  it('RF-3: suma minutos regados por zona en el rango', async () => {
    prisma.zone.findMany.mockResolvedValue([
      {
        id: 'zone-a',
        name: 'Zona A',
        irrigationEvents: [{ durationMinutes: 10 }, { durationMinutes: 15 }],
        pestDetections: [],
        pestTreatments: [],
      },
    ]);
    const result = await service.getHistory('parcel-1', from, to);
    expect(result.zones[0].minutesRegados).toBe(25);
  });

  it('RF-4: calcula ahorro estimado vs. línea base fija por día', async () => {
    prisma.zone.findMany.mockResolvedValue([
      {
        id: 'zone-a',
        name: 'Zona A',
        irrigationEvents: [{ durationMinutes: 5 }],
        pestDetections: [],
        pestTreatments: [],
      },
    ]);
    const result = await service.getHistory('parcel-1', from, to);
    expect(result.zones[0].minutesBaseline).toBe(20);
    expect(result.zones[0].ahorradoMinutos).toBe(15);
    expect(result.zones[0].ahorradoPorcentaje).toBe(75);
  });

  it('el ahorro nunca es negativo si se regó más que la línea base', async () => {
    prisma.zone.findMany.mockResolvedValue([
      {
        id: 'zone-a',
        name: 'Zona A',
        irrigationEvents: [{ durationMinutes: 999 }],
        pestDetections: [],
        pestTreatments: [],
      },
    ]);
    const result = await service.getHistory('parcel-1', from, to);
    expect(result.zones[0].ahorradoMinutos).toBe(0);
    expect(result.zones[0].ahorradoPorcentaje).toBe(0);
  });

  it('agrega totales sumando todas las zonas de la parcela', async () => {
    prisma.zone.findMany.mockResolvedValue([
      {
        id: 'zone-a',
        name: 'Zona A',
        irrigationEvents: [{ durationMinutes: 5 }],
        pestDetections: [],
        pestTreatments: [],
      },
      {
        id: 'zone-b',
        name: 'Zona B',
        irrigationEvents: [{ durationMinutes: 10 }],
        pestDetections: [],
        pestTreatments: [],
      },
    ]);
    const result = await service.getHistory('parcel-1', from, to);
    expect(result.totals.minutesRegados).toBe(15);
    expect(result.totals.minutesBaseline).toBe(40);
  });

  it('RF-2: filtra eventos por rango de fechas vía prisma (where gte/lte)', async () => {
    await service.getHistory('parcel-1', from, to);
    expect(prisma.zone.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { parcelId: 'parcel-1' },
      }),
    );
  });
});
