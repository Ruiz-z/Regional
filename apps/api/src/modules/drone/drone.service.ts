import { Injectable } from '@nestjs/common';

// Estado en memoria por zona (mismo criterio que PestService.zoneStates /
// IrrigationService.pendingRainWait): no justifica una tabla nueva. El
// ESP32 no puede recibir un push directo (aislamiento de red de la WiFi,
// ver notas de esta sesión), así que "activar el servo" es un flag que el
// dispositivo consulta (poll) en su ciclo de 4s, no una llamada directa.
@Injectable()
export class DroneService {
  private readonly servoRequests = new Set<string>();

  requestServo(zoneId: string): void {
    this.servoRequests.add(zoneId);
  }

  // One-shot: se resetea al leerlo para no reactivar el dron en cada poll.
  consumeServoRequest(zoneId: string): boolean {
    const requested = this.servoRequests.has(zoneId);
    this.servoRequests.delete(zoneId);
    return requested;
  }
}
