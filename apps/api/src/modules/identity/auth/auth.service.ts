import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { User } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../../notifications/email.service';
import { JwtPayload } from './strategies/jwt.strategy';

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

interface PendingReset {
  userId: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  // Tokens de reset en memoria (spec-006 RF-7): de corta vida, no justifican
  // una tabla/migración nueva; mismo patrón que el estado de riego/plagas.
  private readonly pendingResets = new Map<string, PendingReset>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string }> {
    const user = await this.validateCredentials(email, password);
    const payload: JwtPayload = { userId: user.id, role: user.role };
    return { accessToken: await this.jwt.signAsync(payload) };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // No revela si el email existe (evita enumeración de cuentas).
      return;
    }
    const token = randomBytes(24).toString('base64url');
    this.pendingResets.set(token, {
      userId: user.id,
      expiresAt: Date.now() + RESET_TOKEN_TTL_MS,
    });
    await this.email.send(
      user.email,
      'Restablece tu contraseña de SmartRiego MX',
      `Tu código para restablecer la contraseña es: ${token} (válido 30 min).`,
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const pending = this.pendingResets.get(token);
    if (!pending || pending.expiresAt < Date.now()) {
      throw new UnauthorizedException('Token de reset inválido o expirado');
    }
    this.pendingResets.delete(token);
    const passwordHash = await hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: pending.userId },
      data: { passwordHash },
    });
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
