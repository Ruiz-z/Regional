import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService, PushService],
  exports: [NotificationsService, EmailService],
})
export class NotificationsModule {}
