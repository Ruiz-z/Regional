import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { User } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string }> {
    const user = await this.validateCredentials(email, password);
    const payload: JwtPayload = { userId: user.id, role: user.role };
    return { accessToken: await this.jwt.signAsync(payload) };
  }

  private async validateCredentials(
    email: string,
    password: string,
  ): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const ok = user && (await compare(password, user.passwordHash));
    if (!ok) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return user;
  }
}
