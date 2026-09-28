import { DroneService } from './drone.service';

describe('DroneService', () => {
  let service: DroneService;

  beforeEach(() => {
    service = new DroneService();
  });

  it('sin solicitud previa, consumeServoRequest da false', () => {
    expect(service.consumeServoRequest('zone-1')).toBe(false);
  });

  it('requestServo marca la zona y consumeServoRequest la lee una sola vez (one-shot)', () => {
    service.requestServo('zone-1');
    expect(service.consumeServoRequest('zone-1')).toBe(true);
    expect(service.consumeServoRequest('zone-1')).toBe(false);
  });

  it('las solicitudes son independientes por zona', () => {
    service.requestServo('zone-1');
    expect(service.consumeServoRequest('zone-2')).toBe(false);
    expect(service.consumeServoRequest('zone-1')).toBe(true);
  });
});
