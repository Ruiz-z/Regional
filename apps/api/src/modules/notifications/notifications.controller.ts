import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.notificationsService.findAllFor(user.userId, user.role);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.notificationsService.markRead(id, user.userId, user.role);
  }

  @Patch('push-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  registerPushToken(
    @CurrentUser() user: AuthUser,
    @Body() dto: RegisterPushTokenDto,
  ) {
    return this.notificationsService.registerPushToken(
      user.userId,
      dto.expoPushToken,
    );
  }

  // Sin cron real (fuera de alcance de hackathon): job disparable a mano por
  // el Admin, ver spec-006 RF-8 y tasks.md BE-035.
  @Post('weekly-summary')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async triggerWeeklySummary() {
    const sent = await this.notificationsService.sendWeeklySummaries();
    return { sent };
  }
}
