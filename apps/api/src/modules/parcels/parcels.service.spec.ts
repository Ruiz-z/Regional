import { UserRole } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ParcelsService } from './parcels.service';

describe('ParcelsService', () => {
  let prisma: {
    parcel: {
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    device: { updateMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let service: ParcelsService;

  beforeEach(() => {
    prisma = {
      parcel: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      device: { updateMany: jest.fn() },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
    };
    service = new ParcelsService(prisma as unknown as PrismaService);
  });

  it('en lista, el Agricultor solo ve las suyas', async () => {
    prisma.parcel.findMany.mockResolvedValue([]);
    await service.findAll({ userId: 'u-1', role: UserRole.AGRICULTOR });
    expect(prisma.parcel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ownerId: 'u-1' } }),
    );
  });

  it('en lista, el Admin ve todas (sin filtro por ownerId)', async () => {
    prisma.parcel.findMany.mockResolvedValue([]);
    await service.findAll({ userId: 'u-1', role: UserRole.ADMIN });
    expect(prisma.parcel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { zones: true },
        orderBy: { createdAt: 'desc' },
      }),
    );
    expect(prisma.parcel.findMany).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: { ownerId: 'u-1' } }),
    );
  });

  it('crea la parcela con ownerId del usuario', async () => {
    prisma.parcel.create.mockResolvedValue({ id: 'p-1' });
    const user = { userId: 'u-9', role: UserRole.AGRICULTOR };
    await service.create(user, {
      name: 'Norte',
      location: 'Tlaxcala',
      crop: 'Maíz',
    });
    expect(prisma.parcel.create).toHaveBeenCalledWith({
      data: {
        name: 'Norte',
        location: 'Tlaxcala',
        crop: 'Maíz',
        ownerId: 'u-9',
      },
      include: { zones: true },
    });
  });

  it('al borrar desvincula los dispositivos de sus zonas y luego borra la parcela', async () => {
    await service.remove('p-1');
    expect(prisma.device.updateMany).toHaveBeenCalledWith({
      where: { zone: { parcelId: 'p-1' } },
      data: { zoneId: null },
    });
    expect(prisma.parcel.delete).toHaveBeenCalledWith({ where: { id: 'p-1' } });
  });
});
