import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { WeatherForecast } from './weather.types';

const CACHE_TTL_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 5000;

// Códigos WMO (weather_code de Open-Meteo) que implican lluvia/tormenta:
// llovizna (51-57), lluvia (61-67), chubascos (80-82), tormenta (95-99).
const RAIN_WEATHER_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
]);

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'despejado',
  1: 'mayormente despejado',
  2: 'parcialmente nublado',
  3: 'nublado',
  45: 'niebla',
  48: 'niebla con escarcha',
  51: 'llovizna ligera',
  53: 'llovizna moderada',
  55: 'llovizna densa',
  56: 'llovizna helada',
  57: 'llovizna helada densa',
  61: 'lluvia ligera',
  63: 'lluvia moderada',
  65: 'lluvia fuerte',
  66: 'lluvia helada',
  67: 'lluvia helada fuerte',
  71: 'nevada ligera',
  73: 'nevada moderada',
  75: 'nevada fuerte',
  77: 'granizo',
  80: 'chubascos ligeros',
  81: 'chubascos moderados',
  82: 'chubascos violentos',
  85: 'chubascos de nieve ligeros',
  86: 'chubascos de nieve fuertes',
  95: 'tormenta eléctrica',
  96: 'tormenta con granizo ligero',
  99: 'tormenta con granizo fuerte',
};

interface GeocodingResponse {
  results?: { latitude: number; longitude: number }[];
}

interface ForecastResponse {
  current?: {
    precipitation?: number;
    weather_code?: number;
    temperature_2m?: number;
  };
}

interface CacheEntry {
  data: WeatherForecast;
  expiresAt: number;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly config: ConfigService) {}

  async getForecast(location: string): Promise<WeatherForecast | null> {
    const cached = this.cache.get(location);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const forecast = await this.fetchForecast(location);
    if (forecast) {
      this.cache.set(location, {
        data: forecast,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
    }
    return forecast;
  }

  private async fetchJson<T>(url: string): Promise<T | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        this.logger.warn(`Open-Meteo respondió ${res.status} para ${url}`);
        return null;
      }
      return (await res.json()) as T;
    } catch (err) {
      this.logger.warn(
        `Fallo al consultar Open-Meteo (${url}): ${(err as Error).message}`,
      );
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async fetchForecast(
    location: string,
  ): Promise<WeatherForecast | null> {
    const geocodingUrl = this.config.get<string>('openMeteo.geocodingUrl');
    const forecastUrl = this.config.get<string>('openMeteo.forecastUrl');
    if (!geocodingUrl || !forecastUrl) {
      return null;
    }

    const geocoded = await this.fetchJson<GeocodingResponse>(
      `${geocodingUrl}?name=${encodeURIComponent(location)}&count=1&language=es&format=json`,
    );
    const place = geocoded?.results?.[0];
    if (!place) {
      this.logger.warn(`Open-Meteo no encontró coordenadas para "${location}"`);
      return null;
    }

    const forecast = await this.fetchJson<ForecastResponse>(
      `${forecastUrl}?latitude=${place.latitude}&longitude=${place.longitude}&current=precipitation,weather_code,temperature_2m&timezone=auto`,
    );
    if (!forecast?.current) {
      return null;
    }

    const weatherCode = forecast.current.weather_code ?? 0;
    const rainMm = forecast.current.precipitation ?? 0;
    const willRain = RAIN_WEATHER_CODES.has(weatherCode) || rainMm > 0;

    return {
      willRain,
      rainMm,
      description: WMO_DESCRIPTIONS[weatherCode] ?? 'sin datos',
      temperatureC: forecast.current.temperature_2m ?? 0,
    };
  }
}
