import { Injectable, Logger } from '@nestjs/common';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  // Caso límite: Agricultor sin token push registrado -> no hace nada, el
  // dashboard/email ya cubren el aviso (spec-006).
  async send(
    expoPushToken: string | null,
    title: string,
    body: string,
  ): Promise<void> {
    if (!expoPushToken) {
      return;
    }

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: expoPushToken, title, body }),
      });
      if (!res.ok) {
        this.logger.warn(`Expo push respondió ${res.status}`);
      }
    } catch (err) {
      this.logger.warn(`Fallo al enviar push: ${(err as Error).message}`);
    }
  }
}
