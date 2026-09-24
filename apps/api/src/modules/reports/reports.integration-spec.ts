import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { hash } from 'bcryptjs';
import { UserRole } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { createTestApp } from '../../test-utils/create-test-app';

interface LoginBody {
  accessToken: string;
}
interface ParcelBody {
  id: string;
}
interface ZoneBody {
  id: string;
}
interface DeviceBody {
  apiKey: string;
}
interface HistoryBody {
  zones: { zoneId: string; minutesRegados: number }[];
  totals: { minutesRegados: number };
}

const accessTokenOf = (res: request.Response): string =>
  (res.body as LoginBody).accessToken;

describe('Reports (integración)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const admin = {
    email: 'reports-admin@smartriego.test',
    password: 'admin1234',
  };
  const agroA = { email: 'reports-a@smartriego.test', password: 'agroA1234' };
  const agroB = { email: 'reports-b@smartriego.test', password: 'agroB1234' };
  let tokenAdmin: string;
  let tokenA: string;
  let tokenB: string;
  let parcelId: string;
  let zoneId: string;
  let deviceKey: string;

  const login = (email: string, password: string) =>
    request(app.getHttpServer()).post('/auth/login').send({ email, password });

  const from = '2026-01-01T00:00:00.000Z';
  const to = '2026-12-31T00:00:00.000Z';

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
          email: agroA.email,
          passwordHash: await hash(agroA.password, 4),
          role: UserRole.AGRICULTOR,
        },
        {
          email: agroB.email,
          passwordHash: await hash(agroB.password, 4),
          role: UserRole.AGRICULTOR,
        },
      ],
    });
    tokenAdmin = accessTokenOf(await login(admin.email, admin.password));
    tokenA = accessTokenOf(await login(agroA.email, agroA.password));
    tokenB = accessTokenOf(await login(agroB.email, agroB.password));

    const parcelRes = await request(app.getHttpServer())
      .post('/parcels')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Parcela reportes',
        location: 'Guanajuato, MX',
        crop: 'maíz',
      });
    parcelId = (parcelRes.body as ParcelBody).id;

    const zoneRes = await request(app.getHttpServer())
      .post(`/parcels/${parcelId}/zones`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Zona 1', humidityThreshold: 50 });
    zoneId = (zoneRes.body as ZoneBody).id;

    const deviceRes = await request(app.getHttpServer())
      .post('/devices')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ type: 'ESP32', zoneId });
    deviceKey = (deviceRes.body as DeviceBody).apiKey;

    // Genera un riego real dentro del rango consultado.
    await request(app.getHttpServer())
      .post('/readings')
      .set('X-Device-Key', deviceKey)
      .send({ humidity: 10, temperature: 22 });
    await request(app.getHttpServer())
      .post('/irrigation-events')
      .set('X-Device-Key', deviceKey)
      .send({ durationMinutes: 12 });
  });

  afterAll(async () => {
    await prisma.irrigationEvent.deleteMany({ where: { zoneId } });
    await prisma.reading.deleteMany({ where: { zoneId } });
    await prisma.device.deleteMany({ where: { zoneId } });
    await prisma.parcel.deleteMany({ where: { id: parcelId } });
    await prisma.user.deleteMany({
      where: { email: { in: [admin.email, agroA.email, agroB.email] } },
    });
    await app.close();
  });

  it('RF-5: el dueño puede consultar el histórico de su parcela', async () => {
    const res = await request(app.getHttpServer())
      .get(`/parcels/${parcelId}/history`)
      .query({ from, to })
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    const body = res.body as HistoryBody;
    expect(body.totals.minutesRegados).toBe(12);
    expect(body.zones[0].zoneId).toBe(zoneId);
  });

  it('RF-5: otro Agricultor no puede consultar una parcela ajena (403)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/parcels/${parcelId}/history`)
      .query({ from, to })
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
  });

  it('RF-5: el Administrador puede consultar cualquier parcela', async () => {
    const res = await request(app.getHttpServer())
      .get(`/parcels/${parcelId}/history`)
      .query({ from, to })
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
  });

  it('Caso límite: rango inválido (from > to) responde 400', async () => {
    const res = await request(app.getHttpServer())
      .get(`/parcels/${parcelId}/history`)
      .query({ from: to, to: from })
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(400);
  });

  it('Caso límite: sin eventos en el rango responde vacío, no error', async () => {
    const res = await request(app.getHttpServer())
      .get(`/parcels/${parcelId}/history`)
      .query({
        from: '2020-01-01T00:00:00.000Z',
        to: '2020-01-02T00:00:00.000Z',
      })
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect((res.body as HistoryBody).totals.minutesRegados).toBe(0);
  });
});
