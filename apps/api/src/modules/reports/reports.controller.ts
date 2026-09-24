import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { Parcel } from '../../generated/prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentParcel } from '../parcels/current-parcel.decorator';
import { ParcelOwnerGuard } from '../parcels/guards/parcel-owner.guard';
import { HistoryQueryDto } from './dto/history-query.dto';
import { ReportsService } from './reports.service';

@Controller('parcels')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get(':id/history')
  @UseGuards(ParcelOwnerGuard)
  getHistory(@CurrentParcel() parcel: Parcel, @Query() query: HistoryQueryDto) {
    return this.reportsService.getHistory(
      parcel.id,
      new Date(query.from),
      new Date(query.to),
    );
  }
}
