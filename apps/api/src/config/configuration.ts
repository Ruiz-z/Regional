export interface AppConfig {
  port: number;
  jwt: {
    secret: string;
    expiresIn: number;
  };
  openWeather: {
    apiKey: string;
    baseUrl: string;
  };
  resend: {
    apiKey: string;
    fromEmail: string;
  };
}

export const loadConfig = (): AppConfig => ({
  port: Number(process.env.PORT ?? 3000),
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret',
    expiresIn: Number(process.env.JWT_EXPIRES_IN ?? 86400),
  },
  openWeather: {
    apiKey: process.env.OPENWEATHER_API_KEY ?? '',
    baseUrl:
      process.env.OPENWEATHER_BASE_URL ??
      'https://api.openweathermap.org/data/2.5/weather',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY ?? '',
    fromEmail:
      process.env.RESEND_FROM_EMAIL ??
      'SmartRiego MX <notificaciones@smartriego.mx>',
  },
});
