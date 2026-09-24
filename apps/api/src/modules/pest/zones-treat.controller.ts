import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZoneOwnerGuard } from './guards/zone-owner.guard';
import { PestService } from './pest.service';

@Controller('zones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ZonesTreatController {
  constructor(private readonly pestService: PestService) {}

  @Post(':id/treat')
  @Roles('AGRICULTOR')
  @UseGuards(ZoneOwnerGuard)
  @HttpCode(HttpStatus.CREATED)
  treat(@Param('id') zoneId: string, @CurrentUser() user: AuthUser) {
    return this.pestService.treatManually(zoneId, user.userId);
  }
}
