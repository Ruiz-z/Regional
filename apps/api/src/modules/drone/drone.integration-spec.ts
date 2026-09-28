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

const accessTokenOf = (res: request.Response): string =>
  (res.body as LoginBody).accessToken;

describe('Drone (integración)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const owner = { email: 'drone-owner@smartriego.test', password: 'agro1234' };
  const other = { email: 'drone-other@smartriego.test', password: 'agro1234' };
  const admin = { email: 'drone-admin@smartriego.test', password: 'admin1234' };
  let tokenOwner: string;
  let tokenOther: string;
  let tokenAdmin: string;
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
          email: owner.email,
          passwordHash: await hash(owner.password, 4),
          role: UserRole.AGRICULTOR,
        },
        {
          email: other.email,
          passwordHash: await hash(other.password, 4),
          role: UserRole.AGRICULTOR,
        },
        {
          email: admin.email,
          passwordHash: await hash(admin.password, 4),
          role: UserRole.ADMIN,
        },
      ],
    });
    tokenOwner = accessTokenOf(await login(owner.email, owner.password));
    tokenOther = accessTokenOf(await login(other.email, other.password));
    tokenAdmin = accessTokenOf(await login(admin.email, admin.password));

    const parcelRes = await request(app.getHttpServer())
      .post('/parcels')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ name: 'Parcela dron', location: 'Guanajuato, MX', crop: 'maíz' });
    parcelId = (parcelRes.body as ParcelBody).id;

    const zoneRes = await request(app.getHttpServer())
      .post(`/parcels/${parcelId}/zones`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ name: 'Zona 1', humidityThreshold: 50 });
    zoneId = (zoneRes.body as ZoneBody).id;

    const deviceRes = await request(app.getHttpServer())
      .post('/devices')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ type: 'ESP32', zoneId });
    deviceKey = (deviceRes.body as DeviceBody).apiKey;
  });

  afterAll(async () => {
    await prisma.parcel.deleteMany({ where: { id: parcelId } });
    await prisma.user.deleteMany({
      where: { email: { in: [owner.email, other.email, admin.email] } },
    });
    await app.close();
  });

  it('POST /zones/:id/deploy-drone-servo rechaza a quien no es dueño (403)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/zones/${zoneId}/deploy-drone-servo`)
      .set('Authorization', `Bearer ${tokenOther}`);
    expect(res.status).toBe(403);
  });

  it('rechaza sin token (401)', async () => {
    const res = await request(app.getHttpServer()).post(
      `/zones/${zoneId}/deploy-drone-servo`,
    );
    expect(res.status).toBe(401);
  });

  it('GET /drone-status rechaza sin X-Device-Key (401)', async () => {
    const res = await request(app.getHttpServer()).get('/drone-status');
    expect(res.status).toBe(401);
  });

  it('el dueño activa el servo (202) y el próximo poll del device lo consume una sola vez', async () => {
    const deploy = await request(app.getHttpServer())
      .post(`/zones/${zoneId}/deploy-drone-servo`)
      .set('Authorization', `Bearer ${tokenOwner}`);
    expect(deploy.status).toBe(202);

    const first = await request(app.getHttpServer())
      .get('/drone-status')
      .set('X-Device-Key', deviceKey);
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ shouldActivate: true });

    const second = await request(app.getHttpServer())
      .get('/drone-status')
      .set('X-Device-Key', deviceKey);
    expect(second.body).toEqual({ shouldActivate: false });
  });
});
