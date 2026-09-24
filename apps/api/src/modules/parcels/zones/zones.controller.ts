import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentParcel } from '../current-parcel.decorator';
import type { Parcel } from '../../../generated/prisma/client';
import { ParcelOwnerGuard } from '../guards/parcel-owner.guard';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { ZonesService } from './zones.service';

@Controller('parcels/:id/zones')
@UseGuards(JwtAuthGuard, ParcelOwnerGuard)
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Get()
  findAll(@CurrentParcel() parcel: Parcel) {
    return this.zonesService.findAll(parcel.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentParcel() parcel: Parcel, @Body() dto: CreateZoneDto) {
    return this.zonesService.create(parcel.id, dto);
  }

  @Patch(':zoneId')
  update(
    @CurrentParcel() parcel: Parcel,
    @Param('zoneId') zoneId: string,
    @Body() dto: UpdateZoneDto,
  ) {
    return this.zonesService.update(parcel.id, zoneId, dto);
  }

  @Delete(':zoneId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentParcel() parcel: Parcel, @Param('zoneId') zoneId: string) {
    return this.zonesService.remove(parcel.id, zoneId);
  }
}
