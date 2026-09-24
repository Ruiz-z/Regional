import { Injectable, NotFoundException } from '@nestjs/common';
import { Zone } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { ZoneStatusService, ZoneWithStatus } from './zone-status.service';

@Injectable()
export class ZonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly zoneStatus: ZoneStatusService,
  ) {}

  async findAll(parcelId: string): Promise<ZoneWithStatus[]> {
    const zones = await this.prisma.zone.findMany({
      where: { parcelId },
      orderBy: { createdAt: 'asc' },
    });
    return this.zoneStatus.attach(zones);
  }

  create(parcelId: string, dto: CreateZoneDto): Promise<Zone> {
    return this.prisma.zone.create({ data: { ...dto, parcelId } });
  }

  async update(
    parcelId: string,
    zoneId: string,
    dto: UpdateZoneDto,
  ): Promise<Zone> {
    const zone = await this.prisma.zone.findFirst({
      where: { id: zoneId, parcelId },
    });
    if (!zone) {
      throw new NotFoundException('Zona no encontrada');
    }
    return this.prisma.zone.update({ where: { id: zoneId }, data: dto });
  }

  async remove(parcelId: string, zoneId: string): Promise<void> {
    const zone = await this.prisma.zone.findFirst({
      where: { id: zoneId, parcelId },
    });
    if (!zone) {
      throw new NotFoundException('Zona no encontrada');
    }
    await this.prisma.zone.delete({ where: { id: zoneId } });
  }
}
