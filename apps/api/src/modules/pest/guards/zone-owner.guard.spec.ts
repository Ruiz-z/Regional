import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { ZoneOwnerGuard } from './zone-owner.guard';

describe('ZoneOwnerGuard', () => {
  let prisma: { zone: { findUnique: jest.Mock } };
  let guard: ZoneOwnerGuard;

  const contextFor = (request: unknown) =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    }) as ExecutionContext;

  beforeEach(() => {
    prisma = { zone: { findUnique: jest.fn() } };
    guard = new ZoneOwnerGuard(prisma as never);
  });

  it('rechaza sin usuario autenticado', async () => {
    await expect(
      guard.canActivate(contextFor({ params: { id: 'zone-a' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('404 si la zona no existe', async () => {
    prisma.zone.findUnique.mockResolvedValue(null);
    await expect(
      guard.canActivate(
        contextFor({ user: { userId: 'u1' }, params: { id: 'zone-x' } }),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('403 si el usuario no es dueño de la parcela de la zona', async () => {
    prisma.zone.findUnique.mockResolvedValue({
      id: 'zone-a',
      parcel: { ownerId: 'otro-user' },
    });
    await expect(
      guard.canActivate(
        contextFor({ user: { userId: 'u1' }, params: { id: 'zone-a' } }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('permite si el usuario es dueño de la parcela de la zona', async () => {
    prisma.zone.findUnique.mockResolvedValue({
      id: 'zone-a',
      parcel: { ownerId: 'u1' },
    });
    await expect(
      guard.canActivate(
        contextFor({ user: { userId: 'u1' }, params: { id: 'zone-a' } }),
      ),
    ).resolves.toBe(true);
  });
});
