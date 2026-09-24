import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import type { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';
import type { DeviceRequest } from '../current-device.decorator';

@Injectable()
export class DeviceKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request & DeviceRequest>();
    const key = (req.headers['x-device-key'] as string | undefined) ?? '';

    if (!key) {
      throw new UnauthorizedException('Falta header X-Device-Key');
    }

    const hash = createHash('sha256').update(key).digest('base64url');

    const device = await this.prisma.device.findUnique({
      where: { apiKeyHash: hash },
    });

    if (!device || device.revokedAt) {
      throw new UnauthorizedException('API key inválida o revocada');
    }

    req.device = device;

    await this.prisma.device.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date() },
    });

    return true;
  }
}
