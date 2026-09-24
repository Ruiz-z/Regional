import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  NotificationSeverity,
  NotificationType,
  UserRole,
} from '../../generated/prisma/client';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let prisma: {
    notification: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    user: { findUnique: jest.Mock; update: jest.Mock; findMany: jest.Mock };
  };
  let email: { send: jest.Mock };
  let push: { send: jest.Mock };
  let service: NotificationsService;

  const agricultor = {
    id: 'user-1',
    email: 'agro@a.com',
    role: UserRole.AGRICULTOR,
    expoPushToken: 'ExponentPushToken[abc]',
  };

  beforeEach(() => {
    prisma = {
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'n-1' }),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(agricultor),
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    email = { send: jest.fn() };
    push = { send: jest.fn() };
    service = new NotificationsService(
      prisma as never,
      email as never,
      push as never,
    );
  });

  it('RF-1: corrección por lluvia crea notificación INFO, push sí, email no', async () => {
    await service.notifyRainCorrection('zone-a', 'user-1');
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        zoneId: 'zone-a',
        type: NotificationType.RAIN_CORRECTION,
        severity: NotificationSeverity.INFO,
      },
    });
    expect(push.send).toHaveBeenCalledTimes(1);
    expect(email.send).not.toHaveBeenCalled();
  });

  it('RF-2/RF-5: anomalía crea notificación CRITICAL, push y email', async () => {
    await service.notifyIrrigationAnomaly('zone-a', 'user-1', true);
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        zoneId: 'zone-a',
        type: NotificationType.IRRIGATION_ANOMALY,
        severity: NotificationSeverity.CRITICAL,
      },
    });
    expect(push.send).toHaveBeenCalledTimes(1);
    expect(email.send).toHaveBeenCalledTimes(1);
  });

  it('anti-spam: no re-notifica la misma anomalía sin resolver', async () => {
    await service.notifyIrrigationAnomaly('zone-a', 'user-1', true);
    await service.notifyIrrigationAnomaly('zone-a', 'user-1', true);
    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
  });

  it('anti-spam: se re-arma si la zona deja de estar en anomalía y reincide', async () => {
    await service.notifyIrrigationAnomaly('zone-a', 'user-1', true);
    await service.notifyIrrigationAnomaly('zone-a', 'user-1', false);
    await service.notifyIrrigationAnomaly('zone-a', 'user-1', true);
    expect(prisma.notification.create).toHaveBeenCalledTimes(2);
  });

  it('RF-3: foco de plaga confirmado crea notificación crítica solo si justConfirmed', async () => {
    await service.notifyPestAlert('zone-a', 'user-1', false);
    expect(prisma.notification.create).not.toHaveBeenCalled();
    await service.notifyPestAlert('zone-a', 'user-1', true);
    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
  });

  it('resetPestAlert permite volver a notificar tras resolverse', async () => {
    await service.notifyPestAlert('zone-a', 'user-1', true);
    service.resetPestAlert('zone-a');
    await service.notifyPestAlert('zone-a', 'user-1', true);
    expect(prisma.notification.create).toHaveBeenCalledTimes(2);
  });

  it('RF-4: sin token push registrado, no se llama push.send con token', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...agricultor,
      expoPushToken: null,
    });
    await service.notifyRainCorrection('zone-a', 'user-1');
    expect(push.send).toHaveBeenCalledWith(
      null,
      expect.any(String) as unknown,
      expect.any(String) as unknown,
    );
  });

  it('RF-9/RF-10: listado filtra por dueño salvo Admin (ve todo)', async () => {
    await service.findAllFor('user-1', UserRole.AGRICULTOR);
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    );
    await service.findAllFor('admin-1', UserRole.ADMIN);
    expect(prisma.notification.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('RF-9: markRead rechaza si la notificación no es del usuario (403)', async () => {
    prisma.notification.findUnique.mockResolvedValue({
      id: 'n-1',
      userId: 'user-2',
    });
    await expect(
      service.markRead('n-1', 'user-1', UserRole.AGRICULTOR),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('markRead lanza 404 si no existe', async () => {
    prisma.notification.findUnique.mockResolvedValue(null);
    await expect(
      service.markRead('n-x', 'user-1', UserRole.AGRICULTOR),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('markRead permite al Admin marcar cualquier notificación', async () => {
    prisma.notification.findUnique.mockResolvedValue({
      id: 'n-1',
      userId: 'user-2',
    });
    prisma.notification.update.mockResolvedValue({ id: 'n-1', read: true });
    const result = await service.markRead('n-1', 'admin-1', UserRole.ADMIN);
    expect(result.read).toBe(true);
  });

  it('sendWelcomeEmail envía un email de bienvenida', async () => {
    await service.sendWelcomeEmail('nuevo@a.com');
    expect(email.send).toHaveBeenCalledWith(
      'nuevo@a.com',
      expect.any(String) as unknown,
      expect.any(String) as unknown,
    );
  });

  it('sendWeeklySummaries envía un email por Agricultor', async () => {
    prisma.user.findMany.mockResolvedValue([
      { email: 'a@a.com', parcels: [] },
      { email: 'b@b.com', parcels: [] },
    ]);
    const sent = await service.sendWeeklySummaries();
    expect(sent).toBe(2);
    expect(email.send).toHaveBeenCalledTimes(2);
  });
});
