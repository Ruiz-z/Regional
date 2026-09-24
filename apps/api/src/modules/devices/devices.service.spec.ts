import { createHash } from 'crypto';
import { NotFoundException } from '@nestjs/common';
import { DevicesService } from './devices.service';

const firstCallArg = (mockFn: jest.Mock): unknown =>
  (mockFn.mock.calls as unknown[][])[0][0];

describe('DevicesService', () => {
  let prisma: {
    device: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let service: DevicesService;

  beforeEach(() => {
    prisma = {
      device: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new DevicesService(prisma);
  });

  it('crea un dispositivo y retorna la key en texto plano', async () => {
    prisma.device.create.mockResolvedValue({
      id: 'd-1',
      type: 'ESP32',
      apiKeyHash: 'hash',
      zoneId: 'z-1',
      revokedAt: null,
      lastSeenAt: null,
      createdAt: new Date(),
    });
    const result = await service.create({ type: 'ESP32', zoneId: 'z-1' });
    expect(result.apiKey).toBeDefined();
    expect(result.apiKey.length).toBeGreaterThan(0);
    expect(prisma.device.create).toHaveBeenCalled();
  });

  it('el hash generado coincide con SHA-256 de la key', async () => {
    prisma.device.create.mockResolvedValue({
      id: 'd-1',
      type: 'ESP32',
      apiKeyHash: 'hash',
      zoneId: 'z-1',
      revokedAt: null,
      lastSeenAt: null,
      createdAt: new Date(),
    });
    const result = await service.create({ type: 'ESP32', zoneId: 'z-1' });
    const expectedHash = createHash('sha256')
      .update(result.apiKey)
      .digest('base64url');
    const createCall = firstCallArg(prisma.device.create) as {
      data: { apiKeyHash: string };
    };
    expect(createCall.data.apiKeyHash).toBe(expectedHash);
  });

  it('marca online si lastSeenAt es reciente', async () => {
    const recent = new Date(Date.now() - 60_000);
    prisma.device.findMany.mockResolvedValue([
      {
        id: 'd-1',
        type: 'ESP32',
        lastSeenAt: recent,
        zoneId: 'z-1',
        revokedAt: null,
        apiKeyHash: 'h',
        createdAt: new Date(),
        zone: null,
      },
    ]);
    const result = await service.findAll();
    expect(result[0].online).toBe(true);
  });

  it('marca offline si lastSeenAt es antiguo', async () => {
    const old = new Date(Date.now() - 600_000);
    prisma.device.findMany.mockResolvedValue([
      {
        id: 'd-1',
        type: 'ESP32',
        lastSeenAt: old,
        zoneId: 'z-1',
        revokedAt: null,
        apiKeyHash: 'h',
        createdAt: new Date(),
        zone: null,
      },
    ]);
    const result = await service.findAll();
    expect(result[0].online).toBe(false);
  });

  it('marca offline si nunca recibió lectura', async () => {
    prisma.device.findMany.mockResolvedValue([
      {
        id: 'd-1',
        type: 'ESP32',
        lastSeenAt: null,
        zoneId: 'z-1',
        revokedAt: null,
        apiKeyHash: 'h',
        createdAt: new Date(),
        zone: null,
      },
    ]);
    const result = await service.findAll();
    expect(result[0].online).toBe(false);
  });

  it('revoca un dispositivo', async () => {
    prisma.device.findUnique.mockResolvedValue({ id: 'd-1' });
    prisma.device.update.mockResolvedValue({
      id: 'd-1',
      revokedAt: new Date(),
    });
    await service.revoke('d-1');
    const updateCall = firstCallArg(prisma.device.update) as {
      where: { id: string };
      data: { revokedAt: Date };
    };
    expect(updateCall.where).toEqual({ id: 'd-1' });
    expect(updateCall.data.revokedAt).toBeInstanceOf(Date);
  });

  it('regenera la key y invalida la anterior', async () => {
    prisma.device.findUnique.mockResolvedValue({ id: 'd-1' });
    prisma.device.update.mockResolvedValue({
      id: 'd-1',
      apiKeyHash: 'new-hash',
      revokedAt: null,
    });
    const result = await service.regenerate('d-1');
    expect(result.apiKey).toBeDefined();
    const regenCall = firstCallArg(prisma.device.update) as {
      where: { id: string };
      data: { revokedAt: null };
    };
    expect(regenCall.where).toEqual({ id: 'd-1' });
    expect(regenCall.data.revokedAt).toBeNull();
  });

  it('findOne lanza 404 si no existe', async () => {
    prisma.device.findUnique.mockResolvedValue(null);
    await expect(service.findOne('bad-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
