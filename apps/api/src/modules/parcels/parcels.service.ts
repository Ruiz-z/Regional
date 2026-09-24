import { Injectable } from '@nestjs/common';
import { Parcel, UserRole, Zone } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { CreateParcelDto } from './dto/create-parcel.dto';
import { UpdateParcelDto } from './dto/update-parcel.dto';

export type ParcelWithZones = Parcel & { zones: Zone[] };

@Injectable()
export class ParcelsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthUser): Promise<ParcelWithZones[]> {
    return this.prisma.parcel.findMany({
      where:
        user.role === UserRole.ADMIN ? undefined : { ownerId: user.userId },
      include: { zones: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(user: AuthUser, dto: CreateParcelDto): Promise<ParcelWithZones> {
    return this.prisma.parcel.create({
      data: { ...dto, ownerId: user.userId },
      include: { zones: true },
    });
  }

  async update(
    parcelId: string,
    dto: UpdateParcelDto,
  ): Promise<ParcelWithZones> {
    return this.prisma.parcel.update({
      where: { id: parcelId },
      data: { ...dto },
      include: { zones: true },
    });
  }

  async remove(parcelId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.device.updateMany({
        where: { zone: { parcelId } },
        data: { zoneId: null },
      }),
      this.prisma.parcel.delete({ where: { id: parcelId } }),
    ]);
  }
}
