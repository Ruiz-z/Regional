import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthRequest } from '../current-parcel.decorator';

@Injectable()
export class ParcelOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException();
    }
    const parcelId = request.params.id;
    const parcel = await this.prisma.parcel.findUnique({
      where: { id: parcelId },
    });
    if (!parcel) {
      throw new NotFoundException('Parcela no encontrada');
    }
    if (user.role !== UserRole.ADMIN && parcel.ownerId !== user.userId) {
      throw new ForbiddenException('No tienes acceso a esta parcela');
    }
    request.parcel = parcel;
    return true;
  }
}
