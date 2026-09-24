import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ZonesService } from './zones.service';

describe('ZonesService', () => {
  let prisma: {
    zone: {
      findMany: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let service: ZonesService;

  beforeEach(() => {
    prisma = {
      zone: {
        findMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new ZonesService(
      prisma as unknown as PrismaService,
      { attach: (zones: unknown) => Promise.resolve(zones) } as never,
    );
  });

  it('crea la zona asociada a la parcela', async () => {
    prisma.zone.create.mockResolvedValue({ id: 'z-1' });
    await service.create('p-1', { name: 'A1', humidityThreshold: 50 });
    expect(prisma.zone.create).toHaveBeenCalledWith({
      data: { name: 'A1', humidityThreshold: 50, parcelId: 'p-1' },
    });
  });

  it('scopes la zona a la parcela al editar', async () => {
    prisma.zone.findFirst.mockResolvedValue(null);
    await expect(
      service.update('p-1', 'z-9', { name: 'B2' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.zone.findFirst).toHaveBeenCalledWith({
      where: { id: 'z-9', parcelId: 'p-1' },
    });
  });

  it('borra la zona correcta tras verificar pertenencia', async () => {
    prisma.zone.findFirst.mockResolvedValue({ id: 'z-1' });
    await service.remove('p-1', 'z-1');
    expect(prisma.zone.delete).toHaveBeenCalledWith({ where: { id: 'z-1' } });
  });
});
