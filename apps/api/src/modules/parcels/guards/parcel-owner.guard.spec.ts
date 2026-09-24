import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthRequest } from '../current-parcel.decorator';
import { ParcelOwnerGuard } from './parcel-owner.guard';

describe('ParcelOwnerGuard', () => {
  const makeParcel = (ownerId: string) => ({ id: 'p-1', ownerId }) as never;
  const makeCtx = (user: AuthRequest['user'], parcelId = 'p-1') =>
    ({
      switchToHttp: () => ({
        getRequest: () =>
          ({
            user,
            params: { id: parcelId },
          }) as AuthRequest & { params: Record<string, string> },
      }),
    }) as never;

  const guardWith = (mock: ReturnType<typeof jest.fn>) =>
    new ParcelOwnerGuard({
      parcel: { findUnique: mock },
    } as unknown as PrismaService);

  it('permite al dueño de la parcela', async () => {
    const findUnique = jest.fn().mockResolvedValue(makeParcel('u-1'));
    await expect(
      guardWith(findUnique).canActivate(
        makeCtx({ userId: 'u-1', role: UserRole.AGRICULTOR }),
      ),
    ).resolves.toBe(true);
  });

  it('bloquea (403) a un Agricultor que no es el dueño', async () => {
    const findUnique = jest.fn().mockResolvedValue(makeParcel('u-2'));
    await expect(
      guardWith(findUnique).canActivate(
        makeCtx({ userId: 'u-1', role: UserRole.AGRICULTOR }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('permite al Admin sin importar el ownerId', async () => {
    const findUnique = jest.fn().mockResolvedValue(makeParcel('u-2'));
    await expect(
      guardWith(findUnique).canActivate(
        makeCtx({ userId: 'admin', role: UserRole.ADMIN }),
      ),
    ).resolves.toBe(true);
  });

  it('lanza 404 si la parcela no existe', async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    await expect(
      guardWith(findUnique).canActivate(
        makeCtx({ userId: 'u-1', role: UserRole.AGRICULTOR }),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
