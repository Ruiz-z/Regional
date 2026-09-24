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
interface DetectionBody {
  level: string;
  consecutiveFrames: number;
  treatmentTriggered: boolean;
}

const accessTokenOf = (res: request.Response): string =>
  (res.body as LoginBody).accessToken;

describe('Pest (integración)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const admin = { email: 'pest-admin@smartriego.test', password: 'admin1234' };
  const agro = { email: 'pest-agro@smartriego.test', password: 'agro1234' };
  let tokenAdmin: string;
  let tokenAgro: string;
  let parcelId: string;
  let zoneId: string;
  let visionKey: string;

  const login = (email: string, password: string) =>
    request(app.getHttpServer()).post('/auth/login').send({ email, password });

  const detect = (count: number) =>
    request(app.getHttpServer())
      .post('/pest-detections')
      .set('X-Device-Key', visionKey)
      .send({ zoneId, count });

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
        name: 'Parcela plagas',
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
      .send({ type: 'VISION_SERVICE', zoneId: null });
    visionKey = (deviceRes.body as DeviceBody).apiKey;
  });

  afterAll(async () => {
    await prisma.pestTreatment.deleteMany({ where: { zoneId } });
    await prisma.pestDetection.deleteMany({ where: { zoneId } });
    await prisma.parcel.deleteMany({ where: { id: parcelId } });
    await prisma.user.deleteMany({
      where: { email: { in: [admin.email, agro.email] } },
    });
    await app.close();
  });

  it('RF-9: Agricultor no puede tratar una zona en Normal (400)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/zones/${zoneId}/treat`)
      .set('Authorization', `Bearer ${tokenAgro}`);
    expect(res.status).toBe(400);
  });

  it('RF-10: Administrador nunca puede activar tratamiento manual (403)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/zones/${zoneId}/treat`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(403);
  });

  it('RF-2/RF-3/RF-4: 3 detecciones consecutivas confirman Monitoreo', async () => {
    await detect(2);
    await detect(2);
    const res = await detect(2);
    const body = res.body as DetectionBody;
    expect(body.level).toBe('MONITOREO');
    expect(body.treatmentTriggered).toBe(false);
  });

  it('RF-9: en Monitoreo, el Agricultor dueño sí puede activar tratamiento manual', async () => {
    const res = await request(app.getHttpServer())
      .post(`/zones/${zoneId}/treat`)
      .set('Authorization', `Bearer ${tokenAgro}`);
    expect(res.status).toBe(201);

    const treatments = await prisma.pestTreatment.findMany({
      where: { zoneId },
    });
    expect(treatments).toHaveLength(1);
    expect(treatments[0].trigger).toBe('MANUAL');
  });

  it('RF-8: el mismo tratamiento manual en cooldown es rechazado (409)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/zones/${zoneId}/treat`)
      .set('Authorization', `Bearer ${tokenAgro}`);
    expect(res.status).toBe(409);
  });
});
