import { ConfigService } from '@nestjs/config';
import { WeatherService } from './weather.service';

describe('WeatherService', () => {
  let service: WeatherService;
  let config: ConfigService;
  let fetchSpy: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    config = {
      get: jest.fn((key: string) => {
        if (key === 'openMeteo.geocodingUrl')
          return 'https://geocoding-api.open-meteo.com/v1/search';
        if (key === 'openMeteo.forecastUrl')
          return 'https://api.open-meteo.com/v1/forecast';
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

  const mockGeocodingThenForecast = (forecastBody: unknown) => {
    fetchSpy
      .mockResolvedValueOnce(
        mockResponse({ results: [{ latitude: 21.02, longitude: -101.26 }] }),
      )
      .mockResolvedValueOnce(mockResponse(forecastBody));
  };

  it('geocodifica el location y clasifica lluvia por weather_code', async () => {
    mockGeocodingThenForecast({
      current: { precipitation: 0, weather_code: 61, temperature_2m: 22.4 },
    });
    const forecast = await service.getForecast('Guanajuato, MX');
    expect(forecast).toEqual({
      willRain: true,
      rainMm: 0,
      description: 'lluvia ligera',
      temperatureC: 22.4,
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('sin lluvia (weather_code despejado y precipitación 0)', async () => {
    mockGeocodingThenForecast({
      current: { precipitation: 0, weather_code: 0, temperature_2m: 30.1 },
    });
    const forecast = await service.getForecast('Guanajuato, MX');
    expect(forecast).toEqual({
      willRain: false,
      rainMm: 0,
      description: 'despejado',
      temperatureC: 30.1,
    });
  });

  it('cachea la respuesta 10 minutos: 2 llamadas en la ventana = 1 solo par de fetch', async () => {
    mockGeocodingThenForecast({
      current: { precipitation: 0, weather_code: 0, temperature_2m: 30.1 },
    });
    await service.getForecast('Guanajuato, MX');
    await service.getForecast('Guanajuato, MX');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('si el geocoding no encuentra resultados, retorna null sin llamar al forecast', async () => {
    fetchSpy.mockResolvedValueOnce(mockResponse({ results: [] }));
    const forecast = await service.getForecast('Lugar Inexistente');
    expect(forecast).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('si Open-Meteo falla (network error), retorna null en vez de lanzar', async () => {
    fetchSpy.mockRejectedValue(new Error('network down'));
    const forecast = await service.getForecast('Guanajuato, MX');
    expect(forecast).toBeNull();
  });

  it('si Open-Meteo responde con error HTTP, retorna null', async () => {
    fetchSpy.mockResolvedValue(mockResponse({}, false));
    const forecast = await service.getForecast('Guanajuato, MX');
    expect(forecast).toBeNull();
  });
});
