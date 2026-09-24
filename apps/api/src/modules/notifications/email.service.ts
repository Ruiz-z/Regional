import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  // Nunca lanza: un fallo de Resend no debe tumbar el flujo que ya mandó
  // push/dashboard (spec-006, casos límite).
  async send(to: string, subject: string, body: string): Promise<void> {
    const apiKey = this.config.get<string>('resend.apiKey');
    if (!apiKey) {
      this.logger.warn(
        `RESEND_API_KEY no configurada, no se envía email a ${to}: "${subject}"`,
      );
      return;
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.config.get<string>('resend.fromEmail'),
          to: [to],
          subject,
          text: body,
        }),
      });
      if (!res.ok) {
        this.logger.error(`Resend respondió ${res.status} enviando a ${to}`);
      }
    } catch (err) {
      this.logger.error(
        `Fallo al enviar email a ${to}: ${(err as Error).message}`,
      );
    }
  }
}
