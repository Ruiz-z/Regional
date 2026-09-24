import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { WeatherForecast } from './weather.types';

const CACHE_TTL_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 5000;
// Códigos de condición de OpenWeather 2xx-5xx = tormenta/llovizna/lluvia.
const RAIN_CONDITION_MAX_ID = 600;

interface OpenWeatherResponse {
  weather?: { id: number; description: string }[];
  rain?: { '1h'?: number; '3h'?: number };
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

  private async fetchForecast(
    location: string,
  ): Promise<WeatherForecast | null> {
    const apiKey = this.config.get<string>('openWeather.apiKey');
    const baseUrl = this.config.get<string>('openWeather.baseUrl');
    if (!apiKey) {
      return null;
    }

    const url = `${baseUrl}?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric&lang=es`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        this.logger.warn(
          `OpenWeather respondió ${res.status} para "${location}"`,
        );
        return null;
      }
      const body = (await res.json()) as OpenWeatherResponse;
      const conditions = body.weather ?? [];
      const willRain = conditions.some((c) => c.id < RAIN_CONDITION_MAX_ID);
      const rainMm = body.rain?.['1h'] ?? body.rain?.['3h'] ?? 0;

      return {
        willRain,
        rainMm,
        description: conditions[0]?.description ?? 'sin datos',
      };
    } catch (err) {
      this.logger.warn(
        `Fallo al consultar OpenWeather para "${location}": ${(err as Error).message}`,
      );
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
