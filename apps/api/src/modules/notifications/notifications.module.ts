import { Module } from '@nestjs/common';
import { CronSecretGuard } from '../../common/guards/cron-secret.guard';
import { EmailService } from './email.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { WeeklySummaryCronController } from './weekly-summary-cron.controller';

@Module({
  controllers: [NotificationsController, WeeklySummaryCronController],
  providers: [NotificationsService, EmailService, PushService, CronSecretGuard],
  exports: [NotificationsService, EmailService],
})
export class NotificationsModule {}
