import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let config: ConfigService;
  let service: EmailService;
  let fetchSpy: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    config = {
      get: jest.fn((key: string) => {
        if (key === 'resend.apiKey') return 'test-key';
        if (key === 'resend.fromEmail') return 'SmartRiego <no-reply@test.mx>';
        return undefined;
      }),
    } as unknown as ConfigService;
    service = new EmailService(config);
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => fetchSpy.mockRestore());

  it('envía el email vía la API de Resend', async () => {
    fetchSpy.mockResolvedValue({ ok: true } as Response);
    await service.send('a@a.com', 'Asunto', 'Cuerpo');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('sin API key configurada, no llama a fetch (no lanza)', async () => {
    config.get = jest.fn(() => '') as never;
    const noKeyService = new EmailService(config);
    await noKeyService.send('a@a.com', 'x', 'y');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('si Resend falla, no lanza (no bloquea el resto del flujo)', async () => {
    fetchSpy.mockRejectedValue(new Error('network down'));
    await expect(service.send('a@a.com', 'x', 'y')).resolves.toBeUndefined();
  });
});
