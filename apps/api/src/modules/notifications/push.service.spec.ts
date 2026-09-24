import { PushService } from './push.service';

describe('PushService', () => {
  let service: PushService;
  let fetchSpy: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    service = new PushService();
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => fetchSpy.mockRestore());

  it('sin token registrado, no llama a fetch', async () => {
    await service.send(null, 'x', 'y');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('con token, llama a la API de push de Expo', async () => {
    fetchSpy.mockResolvedValue({ ok: true } as Response);
    await service.send('ExponentPushToken[abc]', 'Titulo', 'Cuerpo');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://exp.host/--/api/v2/push/send',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('si falla el envío, no lanza', async () => {
    fetchSpy.mockRejectedValue(new Error('down'));
    await expect(
      service.send('ExponentPushToken[abc]', 'x', 'y'),
    ).resolves.toBeUndefined();
  });
});
