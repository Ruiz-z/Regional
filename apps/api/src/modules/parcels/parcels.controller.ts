import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateParcelDto } from './dto/create-parcel.dto';
import { UpdateParcelDto } from './dto/update-parcel.dto';
import { CurrentParcel } from './current-parcel.decorator';
import { ParcelOwnerGuard } from './guards/parcel-owner.guard';
import { ParcelsService } from './parcels.service';
import type { Parcel } from '../../generated/prisma/client';

@Controller('parcels')
@UseGuards(JwtAuthGuard)
export class ParcelsController {
  constructor(private readonly parcelsService: ParcelsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.parcelsService.findAll(user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateParcelDto) {
    return this.parcelsService.create(user, dto);
  }

  @Get(':id')
  @UseGuards(ParcelOwnerGuard)
  findOne(@CurrentParcel() parcel: Parcel) {
    return parcel;
  }

  @Patch(':id')
  @UseGuards(ParcelOwnerGuard)
  update(@CurrentParcel() parcel: Parcel, @Body() dto: UpdateParcelDto) {
    return this.parcelsService.update(parcel.id, dto);
  }

  @Delete(':id')
  @UseGuards(ParcelOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentParcel() parcel: Parcel) {
    return this.parcelsService.remove(parcel.id);
  }
}
