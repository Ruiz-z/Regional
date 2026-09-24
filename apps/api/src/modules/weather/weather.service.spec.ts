import { ConfigService } from '@nestjs/config';
import { WeatherService } from './weather.service';

describe('WeatherService', () => {
  let service: WeatherService;
  let config: ConfigService;
  let fetchSpy: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    config = {
      get: jest.fn((key: string) => {
        if (key === 'openWeather.apiKey') return 'test-key';
        if (key === 'openWeather.baseUrl')
          return 'https://api.openweathermap.org/data/2.5/weather';
        return undefined;
      }),
    } as unknown as ConfigService;
    service = new WeatherService(config);
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  const mockResponse = (body: unknown, ok = true) =>
    ({
      ok,
      status: ok ? 200 : 500,
      json: () => Promise.resolve(body),
    }) as Response;

  it('consulta OpenWeather y clasifica lluvia por código de condición', async () => {
    fetchSpy.mockResolvedValue(
      mockResponse({ weather: [{ id: 500, description: 'lluvia ligera' }] }),
    );
    const forecast = await service.getForecast('Guanajuato, MX');
    expect(forecast).toEqual({
      willRain: true,
      rainMm: 0,
      description: 'lluvia ligera',
    });
  });

  it('cachea la respuesta 10 minutos: 2 llamadas en la ventana = 1 solo fetch', async () => {
    fetchSpy.mockResolvedValue(
      mockResponse({ weather: [{ id: 800, description: 'despejado' }] }),
    );
    await service.getForecast('Guanajuato, MX');
    await service.getForecast('Guanajuato, MX');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('sin API key configurada, retorna null sin llamar a fetch', async () => {
    config.get = jest.fn(() => '') as never;
    const noKeyService = new WeatherService(config);
    const forecast = await noKeyService.getForecast('Guanajuato, MX');
    expect(forecast).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('si OpenWeather falla (network error), retorna null en vez de lanzar', async () => {
    fetchSpy.mockRejectedValue(new Error('network down'));
    const forecast = await service.getForecast('Guanajuato, MX');
    expect(forecast).toBeNull();
  });

  it('si OpenWeather responde con error HTTP, retorna null', async () => {
    fetchSpy.mockResolvedValue(mockResponse({}, false));
    const forecast = await service.getForecast('Guanajuato, MX');
    expect(forecast).toBeNull();
  });
});
