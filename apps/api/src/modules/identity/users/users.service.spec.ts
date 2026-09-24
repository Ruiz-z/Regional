import { ConflictException } from '@nestjs/common';
import { Prisma, UserRole } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let prisma: { user: { create: jest.Mock } };
  let service: UsersService;

  beforeEach(() => {
    prisma = { user: { create: jest.fn() } };
    service = new UsersService(prisma as unknown as PrismaService);
  });

  it('hashea la contraseña y asigna AGRICULTOR por defecto', async () => {
    prisma.user.create.mockImplementation(
      ({ data }: Prisma.UserCreateArgs) => ({
        id: 'u-1',
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
      }),
    );
    const user = await service.create({
      email: 'a@a.com',
      password: '12345678',
    });
    expect(user.role).toBe(UserRole.AGRICULTOR);
    expect(user.passwordHash).not.toBe('12345678');
    expect(user.passwordHash).toMatch(/^\$2/);
  });

  it('permite crear con rol explícito', async () => {
    prisma.user.create.mockImplementation(
      ({ data }: Prisma.UserCreateArgs) => ({
        id: 'u-1',
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
      }),
    );
    const user = await service.create({
      email: 'a@a.com',
      password: '12345678',
      role: UserRole.ADMIN,
    });
    expect(user.role).toBe(UserRole.ADMIN);
  });

  it('rechaza con 409 un email duplicado', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('dupe', {
      code: 'P2002',
      clientVersion: '7.10.0',
    });
    prisma.user.create.mockRejectedValue(error);
    await expect(
      service.create({ email: 'a@a.com', password: '12345678' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
