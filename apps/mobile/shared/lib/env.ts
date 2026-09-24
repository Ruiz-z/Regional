export const env = {
  // URL base del backend NestJS (apps/api). Se lee de apps/mobile/.env
  // vía EXPO_PUBLIC_API_URL. Si no está definida la app corre en modo mock
  // (ver features/*/actions — cada feature documenta su endpoint).
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
  isMock: !process.env.EXPO_PUBLIC_API_URL,
} as const;