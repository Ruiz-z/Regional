export interface AppConfig {
  port: number;
  jwt: {
    secret: string;
    expiresIn: number;
  };
}

export const loadConfig = (): AppConfig => ({
  port: Number(process.env.PORT ?? 3000),
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret',
    expiresIn: Number(process.env.JWT_EXPIRES_IN ?? 86400),
  },
});
