import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { DeviceKeyGuard } from './device-key.guard';

describe('DeviceKeyGuard', () => {
  const makeDevice = (overrides: Record<string, unknown> = {}) => ({
    id: 'd-1',
    type: 'ESP32',
    zoneId: 'z-1',
    apiKeyHash: '',
    revokedAt: null,
    lastSeenAt: null,
    createdAt: new Date(),
    ...overrides,
  });

  const makeCtx = (headers: Record<string, string>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers }) as never,
      }),
    }) as never;

  const guardWith = (mock: ReturnType<typeof jest.fn>) =>
    new DeviceKeyGuard({
      device: { findUnique: mock, update: jest.fn() },
    } as unknown as PrismaService);

  it('lanza 401 si falta X-Device-Key', async () => {
    const guard = guardWith(jest.fn());
    await expect(guard.canActivate(makeCtx({}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('lanza 401 si la key no existe', async () => {
    const guard = guardWith(jest.fn().mockResolvedValue(null));
    await expect(
      guard.canActivate(makeCtx({ 'x-device-key': 'test-key' })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('lanza 401 si el dispositivo está revocado', async () => {
    const key = 'valid-key';
    const hash = createHash('sha256').update(key).digest('base64url');
    const guard = guardWith(
      jest
        .fn()
        .mockResolvedValue(
          makeDevice({ apiKeyHash: hash, revokedAt: new Date() }),
        ),
    );
    await expect(
      guard.canActivate(makeCtx({ 'x-device-key': key })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('retorna true si la key es válida y no revocada', async () => {
    const key = 'valid-key';
    const hash = createHash('sha256').update(key).digest('base64url');
    const guard = guardWith(
      jest.fn().mockResolvedValue(makeDevice({ apiKeyHash: hash })),
    );
    await expect(
      guard.canActivate(makeCtx({ 'x-device-key': key })),
    ).resolves.toBe(true);
  });
});
