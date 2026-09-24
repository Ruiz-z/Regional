import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserRole } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { createTestApp } from '../../../test-utils/create-test-app';

interface LoginBody {
  accessToken: string;
}

const accessTokenOf = (res: request.Response): string =>
  (res.body as LoginBody).accessToken;

describe('Users (integración)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const adminEmail = 'admin-it@smartriego.test';
  const agricultorEmail = 'agro-it@smartriego.test';
  const createdEmails: string[] = [adminEmail, agricultorEmail];

  const login = (email: string, password: string) =>
    request(app.getHttpServer()).post('/auth/login').send({ email, password });

  beforeAll(async () => {
    ({ app } = await createTestApp());
    prisma = app.get(PrismaService);
    const { hash } = await import('bcryptjs');
    await prisma.user.createMany({
      data: [
        {
          email: adminEmail,
          passwordHash: await hash('admin1234', 4),
          role: UserRole.ADMIN,
        },
        {
          email: agricultorEmail,
          passwordHash: await hash('agro12345', 4),
          role: UserRole.AGRICULTOR,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
    await app.close();
  });

  it('un Admin crea un Agricultor (201) y la contraseña queda hasheada', async () => {
    const loginRes = await login(adminEmail, 'admin1234');
    const newEmail = 'nuevo-agro@smartriego.test';
    createdEmails.push(newEmail);
    const res = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${accessTokenOf(loginRes)}`)
      .send({ email: newEmail, password: 'otraclave8' });
    expect(res.status).toBe(201);
    const body = res.body as { passwordHash?: string };
    expect(body.passwordHash).toBeUndefined();
    const created = await prisma.user.findUnique({
      where: { email: newEmail },
    });
    expect(created).not.toBeNull();
    expect(created!.role).toBe(UserRole.AGRICULTOR);
    expect(created!.passwordHash).not.toBe('otraclave8');
  });

  it('rechaza 409 un email duplicado', async () => {
    const loginRes = await login(adminEmail, 'admin1234');
    const res = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${accessTokenOf(loginRes)}`)
      .send({ email: agricultorEmail, password: 'otraclave8' });
    expect(res.status).toBe(409);
  });

  it('un Agricultor no puede crear usuarios (403)', async () => {
    const loginRes = await login(agricultorEmail, 'agro12345');
    const res = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${accessTokenOf(loginRes)}`)
      .send({ email: 'x@smartriego.test', password: 'otraclave8' });
    expect(res.status).toBe(403);
  });

  it('rechaza 401 crear usuario sin token', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .send({ email: 'y@smartriego.test', password: 'otraclave8' });
    expect(res.status).toBe(401);
  });

  it('el usuario recién creado puede autenticarse', async () => {
    const res = await login('nuevo-agro@smartriego.test', 'otraclave8');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.any(Object));
    expect(accessTokenOf(res)).toBeDefined();
  });

  it('GET /users/me devuelve el usuario real (con email) sin el passwordHash', async () => {
    const loginRes = await login(agricultorEmail, 'agro12345');
    const res = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessTokenOf(loginRes)}`);
    expect(res.status).toBe(200);
    const body = res.body as {
      email: string;
      role: string;
      passwordHash?: string;
    };
    expect(body.email).toBe(agricultorEmail);
    expect(body.role).toBe(UserRole.AGRICULTOR);
    expect(body.passwordHash).toBeUndefined();
  });
});
