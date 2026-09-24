import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthUser } from '../../../common/decorators/current-user.decorator';
import { PrismaService } from '../../../prisma/prisma.service';

interface ZoneOwnerRequest {
  user: AuthUser;
  params: { id: string };
}

// A diferencia de ParcelOwnerGuard, este guard NUNCA deja pasar al
// Administrador: el tratamiento manual es exclusivo del Agricultor dueño
// (constitution.md #9, spec-005 RF-10). El rol ya se filtra con @Roles antes.
@Injectable()
export class ZoneOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ZoneOwnerRequest>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException();
    }
    const zone = await this.prisma.zone.findUnique({
      where: { id: request.params.id },
      include: { parcel: true },
    });
    if (!zone) {
      throw new NotFoundException('Zona no encontrada');
    }
    if (zone.parcel.ownerId !== user.userId) {
      throw new ForbiddenException('No eres el dueño de esta zona');
    }
    return true;
  }
}
