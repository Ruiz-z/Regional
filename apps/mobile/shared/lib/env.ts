export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "",
  isMock: false,
} as const;
