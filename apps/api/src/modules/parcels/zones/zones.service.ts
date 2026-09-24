import { Injectable, NotFoundException } from '@nestjs/common';
import { Zone } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Injectable()
export class ZonesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(parcelId: string): Promise<Zone[]> {
    return this.prisma.zone.findMany({
      where: { parcelId },
      orderBy: { createdAt: 'asc' },
    });
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
