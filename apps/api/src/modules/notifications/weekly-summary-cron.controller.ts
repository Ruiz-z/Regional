import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { CronSecretGuard } from '../../common/guards/cron-secret.guard';
import { NotificationsService } from './notifications.service';

// Sin guards de clase a propósito: este endpoint lo dispara Vercel Cron
// (no puede llevar un JWT de Admin), así que se protege solo con
// CronSecretGuard. El endpoint humano equivalente (POST
// /notifications/weekly-summary, JWT+Admin) vive en NotificationsController
// y no se toca.
@Controller('notifications/weekly-summary')
export class WeeklySummaryCronController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('cron')
  @UseGuards(CronSecretGuard)
  @HttpCode(HttpStatus.OK)
  async triggerFromCron() {
    const sent = await this.notificationsService.sendWeeklySummaries();
    return { sent };
  }
}
