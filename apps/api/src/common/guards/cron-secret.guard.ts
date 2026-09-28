import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

// Protege endpoints disparados por Vercel Cron (que no puede llevar un JWT
// de Admin). Vercel agrega automáticamente "Authorization: Bearer
// $CRON_SECRET" cuando el proyecto tiene esa env var seteada. Sin
// CRON_SECRET configurado, el guard rechaza siempre (falla cerrado).
@Injectable()
export class CronSecretGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const secret = this.config.get<string>('cronSecret');
    if (!secret) {
      throw new UnauthorizedException('CRON_SECRET no configurado');
    }

    const req = ctx.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization ?? '';
    if (header !== `Bearer ${secret}`) {
      throw new UnauthorizedException('Credencial de cron inválida');
    }

    return true;
  }
}
