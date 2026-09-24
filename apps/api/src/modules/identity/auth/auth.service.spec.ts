import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import { UserRole } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthService } from './auth.service';
import { toAuthUser } from './strategies/jwt.strategy';

describe('AuthService', () => {
  const hashPassword = (pwd: string) => hash(pwd, 4);

  const makeUser = (overrides: Record<string, unknown> = {}) => ({
    id: 'u-1',
    email: 'user@example.com',
    passwordHash: '',
    role: UserRole.AGRICULTOR,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  let prisma: { user: { findUnique: jest.Mock } };
  let jwt: { signAsync: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn() } };
    jwt = { signAsync: jest.fn().mockResolvedValue('token') };
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
    );
  });

  it('devuelve accessToken cuando las credenciales son válidas', async () => {
    const user = makeUser({ passwordHash: await hashPassword('secret123') });
    prisma.user.findUnique.mockResolvedValue(user);
    const result = await service.login('user@example.com', 'secret123');
    expect(result.accessToken).toBe('token');
    expect(jwt.signAsync).toHaveBeenCalledWith({
      userId: 'u-1',
      role: UserRole.AGRICULTOR,
    });
  });

  it('lanza 401 para contraseña incorrecta', async () => {
    const user = makeUser({ passwordHash: await hashPassword('secret123') });
    prisma.user.findUnique.mockResolvedValue(user);
    await expect(
      service.login('user@example.com', 'wrong'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('lanza 401 para un email inexistente', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login('nadie@example.com', 'any'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('no filtra el motivo de fallo (mismo error para usuario inexistente y contraseña mala)', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    const a = service.login('x@x.com', 'a');
    prisma.user.findUnique.mockResolvedValueOnce(
      makeUser({ passwordHash: await hashPassword('z') }),
    );
    const b = service.login('x@x.com', 'password-que-no-es');
    const [ea, eb] = await Promise.allSettled([a, b]);
    expect(reasonOf(ea)).toBe(reasonOf(eb));
  });
});

function reasonOf(result: PromiseSettledResult<unknown>): string {
  if (result.status === 'rejected') {
    return (result.reason as Error).message;
  }
  return 'resolved';
}

describe('toAuthUser', () => {
  it('mapea el payload a userId y role', () => {
    expect(toAuthUser({ userId: 'u-1', role: UserRole.ADMIN })).toEqual({
      userId: 'u-1',
      role: UserRole.ADMIN,
    });
  });
});
