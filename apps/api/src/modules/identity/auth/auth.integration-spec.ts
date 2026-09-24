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

const login = (
  server: ReturnType<INestApplication['getHttpServer']>,
  email: string,
  password: string,
) => request(server).post('/auth/login').send({ email, password });

describe('Auth (integración)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const email = 'auth-it@smartriego.test';
  const password = 'secret123';

  beforeAll(async () => {
    ({ app } = await createTestApp());
    prisma = app.get(PrismaService);
    const { hash } = await import('bcryptjs');
    await prisma.user.create({
      data: {
        email,
        passwordHash: await hash(password, 4),
        role: UserRole.AGRICULTOR,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('responde 200 con accessToken en login válido', async () => {
    const res = await login(app.getHttpServer(), email, password);
    expect(res.status).toBe(200);
    expect(accessTokenOf(res)).toBeDefined();
  });

  it('responde 401 para contraseña incorrecta', async () => {
    const res = await login(app.getHttpServer(), email, 'incorrecta');
    expect(res.status).toBe(401);
  });

  it('responde 401 para un email inexistente', async () => {
    const res = await login(
      app.getHttpServer(),
      'nadie@smartriego.test',
      password,
    );
    expect(res.status).toBe(401);
  });

  it('GET /users/me exige token (401 sin token)', async () => {
    const res = await request(app.getHttpServer()).get('/users/me');
    expect(res.status).toBe(401);
  });

  it('GET /users/me devuelve userId y role con token válido', async () => {
    const loginRes = await login(app.getHttpServer(), email, password);
    const res = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessTokenOf(loginRes)}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ role: UserRole.AGRICULTOR });
    expect((res.body as { userId?: string }).userId).toBeDefined();
  });
});
