import { INestApplication } from '@nestjs/common';
import { createHash } from 'crypto';
import request from 'supertest';
import { hash } from 'bcryptjs';
import { UserRole } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { createTestApp } from '../../test-utils/create-test-app';
import { DeviceKeyGuard } from './guards/device-key.guard';

const hashKey = (key: string) =>
  createHash('sha256').update(key).digest('base64url');

interface LoginBody {
  accessToken: string;
}

const accessTokenOf = (res: request.Response): string =>
  (res.body as LoginBody).accessToken;

describe('Devices (integración)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const users = {
    admin: { email: 'dev-admin@smartriego.test', password: 'admin1234' },
    agro: { email: 'dev-agro@smartriego.test', password: 'agro1234' },
  };

  const login = (email: string, password: string) =>
    request(app.getHttpServer()).post('/auth/login').send({ email, password });

  let tokenAdmin: string;
  let tokenAgro: string;
  let deviceId: string;
  let deviceKey: string;

  beforeAll(async () => {
    ({ app } = await createTestApp());
    prisma = app.get(PrismaService);
    await prisma.user.createMany({
      data: [
        {
          email: users.admin.email,
          passwordHash: await hash(users.admin.password, 4),
          role: UserRole.ADMIN,
        },
        {
          email: users.agro.email,
          passwordHash: await hash(users.agro.password, 4),
          role: UserRole.AGRICULTOR,
        },
      ],
    });
    tokenAdmin = accessTokenOf(
      await login(users.admin.email, users.admin.password),
    );
    tokenAgro = accessTokenOf(
      await login(users.agro.email, users.agro.password),
    );
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [users.admin.email, users.agro.email] } },
    });
    await app.close();
  });

  it('RF-1: Admin crea dispositivo y recibe key una sola vez', async () => {
    const res = await request(app.getHttpServer())
      .post('/devices')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ type: 'ESP32', zoneId: null });
    expect(res.status).toBe(201);
    const body = res.body as { apiKey: string; id: string };
    deviceKey = body.apiKey;
    deviceId = body.id;
    expect(typeof deviceKey).toBe('string');
    expect(deviceKey.length).toBeGreaterThan(0);
  });

  it(' Agricultor no puede crear dispositivos (403)', async () => {
    await expect(
      request(app.getHttpServer())
        .post('/devices')
        .set('Authorization', `Bearer ${tokenAgro}`)
        .send({ type: 'ESP32' }),
    ).resolves.toMatchObject({ status: 403 });
  });

  it('RF-5: Admin ve el dispositivo con estado online (lastSeenAt=null = offline)', async () => {
    const res = await request(app.getHttpServer())
      .get('/devices')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    const body = res.body as { online: boolean }[];
    expect(body.length).toBeGreaterThan(0);
    expect(body[0].online).toBe(false);
  });

  it('RF-2: key válida pasa el DeviceKeyGuard', async () => {
    const device = await prisma.device.findUnique({
      where: { apiKeyHash: hashKey(deviceKey) },
    });
    expect(device).not.toBeNull();
    expect(device!.revokedAt).toBeNull();
  });

  it('RF-4: revocar dispositivo invalida su key', async () => {
    const res = await request(app.getHttpServer())
      .post(`/devices/${deviceId}/revoke`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);

    const device = await prisma.device.findUnique({
      where: { apiKeyHash: hashKey(deviceKey) },
    });
    expect(device!.revokedAt).not.toBeNull();
  });

  it('RF-3: key revocada es rechazada por DeviceKeyGuard', async () => {
    const guardInstance = new DeviceKeyGuard(prisma);
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-device-key': deviceKey },
        }),
      }),
    } as never;
    await expect(guardInstance.canActivate(ctx)).rejects.toThrow();
  });

  it('regenerar key genera nueva y la anterior deja de funcionar', async () => {
    const res = await request(app.getHttpServer())
      .post(`/devices/${deviceId}/regenerate`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    const newKey = (res.body as { apiKey: string }).apiKey;
    expect(newKey).toBeDefined();
    expect(newKey).not.toBe(deviceKey);

    const oldDevice = await prisma.device.findUnique({
      where: { apiKeyHash: hashKey(deviceKey) },
    });
    expect(oldDevice).toBeNull();

    await prisma.device.delete({ where: { id: deviceId } });
  });
});
