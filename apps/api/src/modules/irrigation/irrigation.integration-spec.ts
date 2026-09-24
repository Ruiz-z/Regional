import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { hash } from 'bcryptjs';
import { UserRole } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { createTestApp } from '../../test-utils/create-test-app';

interface LoginBody {
  accessToken: string;
}

interface DeviceBody {
  id: string;
  apiKey: string;
}

interface ParcelBody {
  id: string;
}

interface ZoneBody {
  id: string;
}

interface ReadingResponseBody {
  discarded?: boolean;
  decision?: 'REGAR' | 'ESPERAR';
  durationMinutes?: number | null;
  reason?: Record<string, unknown>;
}

const accessTokenOf = (res: request.Response): string =>
  (res.body as LoginBody).accessToken;

describe('Irrigation (integración)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const admin = {
    email: 'irrigation-admin@smartriego.test',
    password: 'admin1234',
  };
  const agro = {
    email: 'irrigation-agro@smartriego.test',
    password: 'agro1234',
  };
  let tokenAdmin: string;
  let tokenAgro: string;
  let parcelId: string;
  let zoneId: string;
  let deviceKey: string;

  const login = (email: string, password: string) =>
    request(app.getHttpServer()).post('/auth/login').send({ email, password });

  beforeAll(async () => {
    ({ app } = await createTestApp());
    prisma = app.get(PrismaService);
    await prisma.user.createMany({
      data: [
        {
          email: admin.email,
          passwordHash: await hash(admin.password, 4),
          role: UserRole.ADMIN,
        },
        {
          email: agro.email,
          passwordHash: await hash(agro.password, 4),
          role: UserRole.AGRICULTOR,
        },
      ],
    });
    tokenAdmin = accessTokenOf(await login(admin.email, admin.password));
    tokenAgro = accessTokenOf(await login(agro.email, agro.password));

    const parcelRes = await request(app.getHttpServer())
      .post('/parcels')
      .set('Authorization', `Bearer ${tokenAgro}`)
      .send({
        name: 'Parcela riego',
        location: 'Guanajuato, MX',
        crop: 'maíz',
      });
    parcelId = (parcelRes.body as ParcelBody).id;

    const zoneRes = await request(app.getHttpServer())
      .post(`/parcels/${parcelId}/zones`)
      .set('Authorization', `Bearer ${tokenAgro}`)
      .send({ name: 'Zona 1', humidityThreshold: 50 });
    zoneId = (zoneRes.body as ZoneBody).id;

    const deviceRes = await request(app.getHttpServer())
      .post('/devices')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ type: 'ESP32', zoneId });
    const device = deviceRes.body as DeviceBody;
    deviceKey = device.apiKey;
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { zoneId } });
    await prisma.irrigationEvent.deleteMany({ where: { zoneId } });
    await prisma.reading.deleteMany({ where: { zoneId } });
    await prisma.device.deleteMany({ where: { zoneId } });
    await prisma.parcel.deleteMany({ where: { id: parcelId } });
    await prisma.user.deleteMany({
      where: { email: { in: [admin.email, agro.email] } },
    });
    await app.close();
  });

  it('RF-1: humedad fuera de rango se descarta (200, no 400)', async () => {
    const res = await request(app.getHttpServer())
      .post('/readings')
      .set('X-Device-Key', deviceKey)
      .send({ humidity: 150, temperature: 22 });
    expect(res.status).toBe(200);
    expect((res.body as ReadingResponseBody).discarded).toBe(true);
  });

  it('sin X-Device-Key es rechazado (401)', async () => {
    const res = await request(app.getHttpServer())
      .post('/readings')
      .send({ humidity: 20, temperature: 22 });
    expect(res.status).toBe(401);
  });

  it('RF-1/RF-3/RF-4: humedad baja sin pronóstico -> REGAR con duración y razón', async () => {
    const res = await request(app.getHttpServer())
      .post('/readings')
      .set('X-Device-Key', deviceKey)
      .send({ humidity: 15, temperature: 22 });
    expect(res.status).toBe(200);
    const body = res.body as ReadingResponseBody;
    expect(body.decision).toBe('REGAR');
    expect(body.durationMinutes).toBeGreaterThan(0);
    expect(body.reason).toBeDefined();

    const readings = await prisma.reading.findMany({ where: { zoneId } });
    expect(readings.length).toBeGreaterThan(0);
  });

  it('RF-4: humedad alta -> ESPERAR sin duración', async () => {
    const res = await request(app.getHttpServer())
      .post('/readings')
      .set('X-Device-Key', deviceKey)
      .send({ humidity: 90, temperature: 22 });
    expect(res.status).toBe(200);
    const body = res.body as ReadingResponseBody;
    expect(body.decision).toBe('ESPERAR');
    expect(body.durationMinutes).toBeNull();
  });

  it('RF-5/RF-9: 3 riegos consecutivos sin subir humedad disparan anomalía, 2 no', async () => {
    const readAndReport = async (humidity: number) => {
      await request(app.getHttpServer())
        .post('/readings')
        .set('X-Device-Key', deviceKey)
        .send({ humidity, temperature: 22 });
      return request(app.getHttpServer())
        .post('/irrigation-events')
        .set('X-Device-Key', deviceKey)
        .send({ durationMinutes: 10 });
    };

    const first = await readAndReport(10);
    expect((first.body as { anomalyDetected: boolean }).anomalyDetected).toBe(
      false,
    );

    const second = await readAndReport(10);
    expect((second.body as { anomalyDetected: boolean }).anomalyDetected).toBe(
      false,
    );

    const third = await readAndReport(9);
    expect((third.body as { anomalyDetected: boolean }).anomalyDetected).toBe(
      true,
    );
  });
});
