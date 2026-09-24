import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import type { Device } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

const KEY_BYTES = 32;
const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000;

export type DeviceWithZone = Device & {
  zone?: { id: string; name: string } | null;
};

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateDeviceDto,
  ): Promise<DeviceWithZone & { apiKey: string }> {
    const apiKey = randomBytes(KEY_BYTES).toString('base64url');
    const apiKeyHash = createHash('sha256').update(apiKey).digest('base64url');

    const device = await this.prisma.device.create({
      data: {
        type: dto.type,
        apiKeyHash,
        zoneId: dto.zoneId ?? null,
      },
      include: { zone: { select: { id: true, name: true } } },
    });

    return { ...device, apiKey };
  }

  async findAll(): Promise<(DeviceWithZone & { online: boolean })[]> {
    const now = Date.now();
    const devices = await this.prisma.device.findMany({
      include: { zone: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return devices.map((d) => ({
      ...d,
      online: d.lastSeenAt
        ? now - d.lastSeenAt.getTime() < OFFLINE_THRESHOLD_MS
        : false,
    }));
  }

  async findOne(id: string): Promise<DeviceWithZone> {
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: { zone: { select: { id: true, name: true } } },
    });
    if (!device) throw new NotFoundException('Dispositivo no encontrado');
    return device;
  }

  async update(id: string, dto: UpdateDeviceDto): Promise<DeviceWithZone> {
    await this.findOne(id);
    return this.prisma.device.update({
      where: { id },
      data: { zoneId: dto.zoneId ?? null },
      include: { zone: { select: { id: true, name: true } } },
    });
  }

  async revoke(id: string): Promise<Device> {
    await this.findOne(id);
    return this.prisma.device.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async regenerate(id: string): Promise<DeviceWithZone & { apiKey: string }> {
    await this.findOne(id);
    const apiKey = randomBytes(KEY_BYTES).toString('base64url');
    const apiKeyHash = createHash('sha256').update(apiKey).digest('base64url');

    const device = await this.prisma.device.update({
      where: { id },
      data: { apiKeyHash, revokedAt: null },
      include: { zone: { select: { id: true, name: true } } },
    });

    return { ...device, apiKey };
  }
}
