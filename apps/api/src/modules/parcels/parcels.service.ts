import { Injectable } from '@nestjs/common';
import { Parcel, UserRole } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { CreateParcelDto } from './dto/create-parcel.dto';
import { UpdateParcelDto } from './dto/update-parcel.dto';
import { ZoneStatusService, ZoneWithStatus } from './zones/zone-status.service';

export type ParcelWithZones = Parcel & { zones: ZoneWithStatus[] };

@Injectable()
export class ParcelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly zoneStatus: ZoneStatusService,
  ) {}

  async findAll(user: AuthUser): Promise<ParcelWithZones[]> {
    const parcels = await this.prisma.parcel.findMany({
      where:
        user.role === UserRole.ADMIN ? undefined : { ownerId: user.userId },
      include: { zones: true },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(
      parcels.map(async (parcel) => ({
        ...parcel,
        zones: await this.zoneStatus.attach(parcel.zones),
      })),
    );
  }

  async findOne(parcelId: string): Promise<ParcelWithZones> {
    const parcel = await this.prisma.parcel.findUniqueOrThrow({
      where: { id: parcelId },
      include: { zones: true },
    });
    return { ...parcel, zones: await this.zoneStatus.attach(parcel.zones) };
  }

  async create(user: AuthUser, dto: CreateParcelDto): Promise<ParcelWithZones> {
    const parcel = await this.prisma.parcel.create({
      data: { ...dto, ownerId: user.userId },
      include: { zones: true },
    });
    return { ...parcel, zones: await this.zoneStatus.attach(parcel.zones) };
  }

  async update(
    parcelId: string,
    dto: UpdateParcelDto,
  ): Promise<ParcelWithZones> {
    const parcel = await this.prisma.parcel.update({
      where: { id: parcelId },
      data: { ...dto },
      include: { zones: true },
    });
    return { ...parcel, zones: await this.zoneStatus.attach(parcel.zones) };
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
