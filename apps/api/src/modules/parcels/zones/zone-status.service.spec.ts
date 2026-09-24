import { ZoneStatusService } from './zone-status.service';

describe('ZoneStatusService', () => {
  let prisma: { reading: { findFirst: jest.Mock } };
  let pestService: {
    getLevel: jest.Mock;
    getCooldownUntil: jest.Mock;
    getLastTreatmentAt: jest.Mock;
  };
  let service: ZoneStatusService;

  beforeEach(() => {
    prisma = { reading: { findFirst: jest.fn() } };
    pestService = {
      getLevel: jest.fn().mockReturnValue('NORMAL'),
      getCooldownUntil: jest.fn().mockReturnValue(null),
      getLastTreatmentAt: jest.fn().mockReturnValue(null),
    };
    service = new ZoneStatusService(prisma as never, pestService as never);
  });

  it('agrega la última lectura y el nivel de plaga a cada zona', async () => {
    prisma.reading.findFirst.mockResolvedValue({
      humidity: 42,
      temperature: 21,
      createdAt: new Date('2026-01-01'),
    });
    pestService.getLevel.mockReturnValue('MONITOREO');

    const result = await service.attach([
      { id: 'zone-a', name: 'Zona A' } as never,
    ]);

    expect(result[0].latestReading).toEqual({
      humidity: 42,
      temperature: 21,
      createdAt: new Date('2026-01-01'),
    });
    expect(result[0].pestLevel).toBe('MONITOREO');
    expect(prisma.reading.findFirst).toHaveBeenCalledWith({
      where: { zoneId: 'zone-a' },
      orderBy: { createdAt: 'desc' },
      select: { humidity: true, temperature: true, createdAt: true },
    });
  });

  it('zona sin lecturas aún -> latestReading null, nivel Normal por defecto', async () => {
    prisma.reading.findFirst.mockResolvedValue(null);
    pestService.getLevel.mockReturnValue('NORMAL');

    const result = await service.attach([{ id: 'zone-b' } as never]);

    expect(result[0].latestReading).toBeNull();
    expect(result[0].pestLevel).toBe('NORMAL');
  });

  it('procesa varias zonas de forma independiente', async () => {
    prisma.reading.findFirst
      .mockResolvedValueOnce({
        humidity: 10,
        temperature: 20,
        createdAt: new Date(),
      })
      .mockResolvedValueOnce(null);
    pestService.getLevel
      .mockReturnValueOnce('INTERVENCION')
      .mockReturnValueOnce('NORMAL');

    const result = await service.attach([
      { id: 'zone-a' } as never,
      { id: 'zone-b' } as never,
    ]);

    expect(result[0].pestLevel).toBe('INTERVENCION');
    expect(result[1].pestLevel).toBe('NORMAL');
  });

  it('agrega el cooldown de tratamiento vigente (null si no hay uno)', async () => {
    prisma.reading.findFirst.mockResolvedValue(null);
    const until = new Date('2026-01-01T00:10:00.000Z');
    pestService.getCooldownUntil.mockReturnValue(until);

    const result = await service.attach([{ id: 'zone-a' } as never]);

    expect(result[0].cooldownUntil).toBe(until);
  });

  it('agrega el timestamp del último tratamiento (null si nunca se trató)', async () => {
    prisma.reading.findFirst.mockResolvedValue(null);
    const last = new Date('2026-01-01T00:00:00.000Z');
    pestService.getLastTreatmentAt.mockReturnValue(last);

    const result = await service.attach([{ id: 'zone-a' } as never]);

    expect(result[0].lastTreatmentAt).toBe(last);
  });
});
