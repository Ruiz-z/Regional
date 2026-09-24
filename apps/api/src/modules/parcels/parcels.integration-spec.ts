import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { hash } from 'bcryptjs';
import { UserRole } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { createTestApp } from '../../test-utils/create-test-app';

interface LoginBody {
  accessToken: string;
}
const accessTokenOf = (res: request.Response): string =>
  (res.body as LoginBody).accessToken;

describe('Parcels (integración)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const users = {
    admin: { email: 'parc-admin@smartriego.test', password: 'admin1234' },
    agroA: { email: 'parc-a@smartriego.test', password: 'agroA1234' },
    agroB: { email: 'parc-b@smartriego.test', password: 'agroB1234' },
  };
  const createdIds: string[] = [];

  const login = (email: string, password: string) =>
    request(app.getHttpServer()).post('/auth/login').send({ email, password });

  let tokenA: string;
  let tokenB: string;
  let tokenAdmin: string;

  let parcelAId: string;
  let zoneA1: string;

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
          email: users.agroA.email,
          passwordHash: await hash(users.agroA.password, 4),
          role: UserRole.AGRICULTOR,
        },
        {
          email: users.agroB.email,
          passwordHash: await hash(users.agroB.password, 4),
          role: UserRole.AGRICULTOR,
        },
      ],
    });
    tokenA = accessTokenOf(
      await login(users.agroA.email, users.agroA.password),
    );
    tokenB = accessTokenOf(
      await login(users.agroB.email, users.agroB.password),
    );
    tokenAdmin = accessTokenOf(
      await login(users.admin.email, users.admin.password),
    );
  });

  afterAll(async () => {
    await prisma.parcel.deleteMany({ where: { id: { in: createdIds } } });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [users.admin.email, users.agroA.email, users.agroB.email],
        },
      },
    });
    await app.close();
  });

  it('RF-1: un Agricultor crea una parcela asociada a su ownerId', async () => {
    const res = await request(app.getHttpServer())
      .post('/parcels')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Parcela Norte', location: 'Tlaxcala, MX', crop: 'Maíz' });
    expect(res.status).toBe(201);
    const body = res.body as { id: string; ownerId: string; zones: unknown[] };
    parcelAId = body.id;
    createdIds.push(parcelAId);
    expect(body.ownerId.length).toBeGreaterThan(0);
    expect(body.zones).toEqual([]);
  });

  it('RF-3: otro Agricultor no puede ver, editar ni borrar la parcela ajena (403)', async () => {
    const headers = { Authorization: `Bearer ${tokenB}` };
    await expect(
      request(app.getHttpServer()).get(`/parcels/${parcelAId}`).set(headers),
    ).resolves.toMatchObject({ status: 403 });
    await expect(
      request(app.getHttpServer())
        .patch(`/parcels/${parcelAId}`)
        .set(headers)
        .send({ name: 'Hackeado' }),
    ).resolves.toMatchObject({ status: 403 });
    await expect(
      request(app.getHttpServer()).delete(`/parcels/${parcelAId}`).set(headers),
    ).resolves.toMatchObject({ status: 403 });
  });

  it('RF-4: el Admin ve todas las parcelas y puede editarlas', async () => {
    const list = await request(app.getHttpServer())
      .get('/parcels')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect((list.body as { id: string }[]).length).toBeGreaterThan(0);

    const patched = await request(app.getHttpServer())
      .patch(`/parcels/${parcelAId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ name: 'Parcela Norte v2' });
    expect(patched.status).toBe(200);
    expect((patched.body as { name: string }).name).toBe('Parcela Norte v2');
  });

  it('RF-2: el dueño agrega zonas a su parcela', async () => {
    const res = await request(app.getHttpServer())
      .post(`/parcels/${parcelAId}/zones`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'A1', humidityThreshold: 45 });
    expect(res.status).toBe(201);
    zoneA1 = (res.body as { id: string }).id;

    const res2 = await request(app.getHttpServer())
      .post(`/parcels/${parcelAId}/zones`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'A2', humidityThreshold: 60 });
    expect(res2.status).toBe(201);

    const zones = await request(app.getHttpServer())
      .get(`/parcels/${parcelAId}/zones`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(zones.status).toBe(200);
    expect(zones.body).toHaveLength(2);
  });

  it('RF-3: un Agricultor no puede crear zonas en parcela ajena, el Admin sí (403/201)', async () => {
    await expect(
      request(app.getHttpServer())
        .post(`/parcels/${parcelAId}/zones`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'X', humidityThreshold: 30 }),
    ).resolves.toMatchObject({ status: 403 });

    const adminZone = await request(app.getHttpServer())
      .post(`/parcels/${parcelAId}/zones`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ name: 'A3', humidityThreshold: 70 });
    expect(adminZone.status).toBe(201);
    await prisma.zone.delete({
      where: { id: (adminZone.body as { id: string }).id },
    });
  });

  it('RF-5: borrar la parcela borra sus zonas y desvincula (no borra) el dispositivo', async () => {
    const device = await prisma.device.create({
      data: { type: 'ESP32', apiKeyHash: `hash-${Date.now()}`, zoneId: zoneA1 },
    });
    const del = await request(app.getHttpServer())
      .delete(`/parcels/${parcelAId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(del.status).toBe(204);

    const zonesLeft = await prisma.zone.count({
      where: { parcelId: parcelAId },
    });
    expect(zonesLeft).toBe(0);
    const deviceLeft = await prisma.device.findUnique({
      where: { id: device.id },
    });
    expect(deviceLeft).not.toBeNull();
    expect(deviceLeft!.zoneId).toBeNull();
    await prisma.device.delete({ where: { id: device.id } });
  });

  it('listado del Agricultor B está vacío y una parcela inexistente da 404', async () => {
    const list = await request(app.getHttpServer())
      .get('/parcels')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(0);

    await expect(
      request(app.getHttpServer())
        .get('/parcels/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${tokenB}`),
    ).resolves.toMatchObject({ status: 404 });
  });
});
