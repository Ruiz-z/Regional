import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Notification,
  NotificationSeverity,
  NotificationType,
  UserRole,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';
import { PushService } from './push.service';

const COPY: Record<NotificationType, { title: string; body: string }> = {
  RAIN_CORRECTION: {
    title: 'Riego de respaldo por lluvia insuficiente',
    body: 'La lluvia prevista no fue suficiente; se inició un riego de respaldo. No requiere ninguna acción de tu parte.',
  },
  IRRIGATION_ANOMALY: {
    title: 'Posible falla de riego',
    body: 'Una zona lleva 3 riegos seguidos sin subir la humedad. Revisa la válvula, el sensor o el suministro de agua.',
  },
  PEST_ALERT: {
    title: 'Foco de plaga confirmado',
    body: 'Se confirmó presencia de la plaga en una de tus zonas.',
  },
};

@Injectable()
export class NotificationsService {
  // Dedup en memoria: evita re-notificar en cada ciclo mientras la misma
  // anomalía/foco sigue sin resolverse (spec-006, casos límite).
  private readonly notifiedAnomalyZones = new Set<string>();
  private readonly notifiedPestZones = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly push: PushService,
  ) {}

  async notifyRainCorrection(zoneId: string, userId: string): Promise<void> {
    await this.create(userId, zoneId, NotificationType.RAIN_CORRECTION);
  }

  async notifyIrrigationAnomaly(
    zoneId: string,
    userId: string,
    isAnomaly: boolean,
  ): Promise<void> {
    if (!isAnomaly) {
      this.notifiedAnomalyZones.delete(zoneId);
      return;
    }
    if (this.notifiedAnomalyZones.has(zoneId)) {
      return;
    }
    this.notifiedAnomalyZones.add(zoneId);
    await this.create(userId, zoneId, NotificationType.IRRIGATION_ANOMALY);
  }

  async notifyPestAlert(
    zoneId: string,
    userId: string,
    justConfirmed: boolean,
  ): Promise<void> {
    if (!justConfirmed) {
      return;
    }
    if (this.notifiedPestZones.has(zoneId)) {
      return;
    }
    this.notifiedPestZones.add(zoneId);
    await this.create(userId, zoneId, NotificationType.PEST_ALERT);
  }

  // Permite reabrir la alerta si la zona vuelve a confirmar plaga tras
  // resolverse (spec-006, casos límite).
  resetPestAlert(zoneId: string): void {
    this.notifiedPestZones.delete(zoneId);
  }

  findAllFor(userId: string, role: UserRole): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: role === UserRole.ADMIN ? {} : { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRead(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<Notification> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }
    if (role !== UserRole.ADMIN && notification.userId !== userId) {
      throw new ForbiddenException('No es tu notificación');
    }
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async registerPushToken(
    userId: string,
    expoPushToken: string,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { expoPushToken },
    });
  }

  async sendWelcomeEmail(email: string): Promise<void> {
    await this.email.send(
      email,
      'Bienvenido a SmartRiego MX',
      'Tu cuenta de Agricultor ya está lista. Ingresa con el correo y la contraseña que te compartió tu Administrador.',
    );
  }

  async sendWeeklySummaries(): Promise<number> {
    const agricultores = await this.prisma.user.findMany({
      where: { role: UserRole.AGRICULTOR },
      include: {
        parcels: {
          include: { zones: { include: { irrigationEvents: true } } },
        },
      },
    });

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let sent = 0;
    for (const agricultor of agricultores) {
      const eventosSemana = agricultor.parcels
        .flatMap((p) => p.zones)
        .flatMap((z) => z.irrigationEvents)
        .filter((e) => e.createdAt >= weekAgo);
      const minutosRegados = eventosSemana.reduce(
        (sum, e) => sum + (e.durationMinutes ?? 0),
        0,
      );
      await this.email.send(
        agricultor.email,
        'Tu resumen semanal de SmartRiego MX',
        `Esta semana se registraron ${eventosSemana.length} riegos, con un total de ${minutosRegados} minutos regados.`,
      );
      sent += 1;
    }
    return sent;
  }

  private async create(
    userId: string,
    zoneId: string,
    type: NotificationType,
  ): Promise<Notification> {
    const severity =
      type === NotificationType.RAIN_CORRECTION
        ? NotificationSeverity.INFO
        : NotificationSeverity.CRITICAL;

    const notification = await this.prisma.notification.create({
      data: { userId, zoneId, type, severity },
    });

    const copy = COPY[type];
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await this.push.send(user.expoPushToken, copy.title, copy.body);
      if (severity === NotificationSeverity.CRITICAL) {
        await this.email.send(user.email, copy.title, copy.body);
      }
    }

    return notification;
  }
}
