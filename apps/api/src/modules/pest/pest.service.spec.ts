import { NotificationsService } from '../notifications/notifications.service';
import { PestService } from './pest.service';

describe('PestService', () => {
  let prisma: {
    zone: { findUnique: jest.Mock };
    pestDetection: { create: jest.Mock };
    pestTreatment: { create: jest.Mock };
  };
  let notifications: { notifyPestAlert: jest.Mock; resetPestAlert: jest.Mock };
  let service: PestService;

  beforeEach(() => {
    prisma = {
      zone: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'zone-a', parcel: { ownerId: 'owner-a' } }),
      },
      pestDetection: { create: jest.fn() },
      pestTreatment: { create: jest.fn().mockResolvedValue({ id: 'tr-1' }) },
    };
    notifications = {
      notifyPestAlert: jest.fn(),
      resetPestAlert: jest.fn(),
    };
    service = new PestService(
      prisma as never,
      notifications as unknown as NotificationsService,
    );
  });

  const detect = (count: number) =>
    service.recordDetection({ zoneId: 'zone-a', count });

  it('RF-2/RF-6: 1-2 detecciones consecutivas no confirman foco (no dispara nada)', async () => {
    const r1 = await detect(2);
    const r2 = await detect(2);
    expect(r1.consecutiveFrames).toBe(1);
    expect(r2.consecutiveFrames).toBe(2);
    expect(r1.level).toBe('NORMAL');
    expect(r2.level).toBe('NORMAL');
    expect(r2.treatmentTriggered).toBe(false);
  });

  it('un frame sin detección resetea el contador', async () => {
    await detect(2);
    await detect(2);
    const reset = await detect(0);
    expect(reset.consecutiveFrames).toBe(0);
    const again = await detect(2);
    expect(again.consecutiveFrames).toBe(1);
  });

  it('RF-3/RF-4: 3 consecutivos con conteo bajo -> Monitoreo, sin tratamiento', async () => {
    await detect(2);
    await detect(2);
    const result = await detect(2);
    expect(result.level).toBe('MONITOREO');
    expect(result.treatmentTriggered).toBe(false);
    expect(prisma.pestTreatment.create).not.toHaveBeenCalled();
  });

  it('spec-006 RF-3: notifica solo al confirmar el foco (frame 3), no en frames posteriores', async () => {
    await detect(2);
    await detect(2);
    await detect(2);
    expect(notifications.notifyPestAlert).toHaveBeenCalledTimes(1);
    expect(notifications.notifyPestAlert).toHaveBeenCalledWith(
      'zone-a',
      'owner-a',
      true,
    );
    await detect(2);
    expect(notifications.notifyPestAlert).toHaveBeenCalledTimes(2);
    expect(notifications.notifyPestAlert).toHaveBeenLastCalledWith(
      'zone-a',
      'owner-a',
      false,
    );
  });

  it('RF-4/RF-5: 3 consecutivos con conteo alto -> Intervención, dispara tratamiento automático', async () => {
    await detect(6);
    await detect(6);
    const result = await detect(6);
    expect(result.level).toBe('INTERVENCION');
    expect(result.treatmentTriggered).toBe(true);
    expect(prisma.pestTreatment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        zoneId: 'zone-a',
        trigger: 'AUTOMATIC',
        triggeredBy: null,
      }) as unknown,
    });
  });

  it('RF-8: no repite tratamiento automático dentro del cooldown', async () => {
    await detect(6);
    await detect(6);
    await detect(6); // dispara el primero
    const second = await detect(6); // sigue en Intervención pero en cooldown
    expect(second.treatmentTriggered).toBe(false);
    expect(prisma.pestTreatment.create).toHaveBeenCalledTimes(1);
  });

  it('RF-9: tratamiento manual rechazado si la zona está en Normal', async () => {
    await expect(service.treatManually('zone-a', 'user-1')).rejects.toThrow(
      'La zona no muestra indicios de plaga',
    );
  });

  it('RF-9: tratamiento manual permitido en Monitoreo', async () => {
    await detect(2);
    await detect(2);
    await detect(2);
    const result = await service.treatManually('zone-a', 'user-1');
    expect(result).toEqual({ id: 'tr-1' });
    expect(prisma.pestTreatment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        zoneId: 'zone-a',
        trigger: 'MANUAL',
        triggeredBy: 'user-1',
      }) as unknown,
    });
  });

  it('RF-8/RF-9: tratamiento manual rechazado en cooldown', async () => {
    await detect(2);
    await detect(2);
    await detect(2);
    await service.treatManually('zone-a', 'user-1');
    await expect(service.treatManually('zone-a', 'user-1')).rejects.toThrow(
      /cooldown/,
    );
  });
});
