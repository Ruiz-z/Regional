export interface AppConfig {
  port: number;
  jwt: {
    secret: string;
    expiresIn: number;
  };
  openMeteo: {
    geocodingUrl: string;
    forecastUrl: string;
  };
  resend: {
    apiKey: string;
    fromEmail: string;
  };
  cronSecret: string;
  drone: {
    visionServiceUrl: string;
    visionInternalSecret: string;
  };
}

export const loadConfig = (): AppConfig => ({
  port: Number(process.env.PORT ?? 3000),
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret',
    expiresIn: Number(process.env.JWT_EXPIRES_IN ?? 86400),
  },
  openMeteo: {
    // Open-Meteo no requiere API key (tier gratuito). geocodingUrl resuelve
    // parcel.location (texto libre, ej. "Guanajuato, MX") a lat/lon;
    // forecastUrl consulta el pronóstico con esas coordenadas.
    geocodingUrl:
      process.env.OPEN_METEO_GEOCODING_URL ??
      'https://geocoding-api.open-meteo.com/v1/search',
    forecastUrl:
      process.env.OPEN_METEO_FORECAST_URL ??
      'https://api.open-meteo.com/v1/forecast',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY ?? '',
    fromEmail:
      process.env.RESEND_FROM_EMAIL ??
      'SmartRiego MX <notificaciones@smartriego.mx>',
  },
  // Autentica al Vercel Cron Job del resumen semanal (ver
  // CronSecretGuard) — no confundir con JWT_SECRET, que es para usuarios.
  cronSecret: process.env.CRON_SECRET ?? '',
  drone: {
    visionServiceUrl: process.env.VISION_SERVICE_URL ?? 'http://localhost:8001',
    // Autentica la llamada backend -> servicio de visión en /detect. Mismo
    // criterio "falla cerrado" que CRON_SECRET: sin valor, el servicio de
    // visión rechaza siempre.
    visionInternalSecret: process.env.VISION_INTERNAL_SECRET ?? '',
  },
});
