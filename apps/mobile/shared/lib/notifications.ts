import Constants from "expo-constants";

// Desde el SDK 53 de Expo, Expo Go quitó el soporte de push remoto en
// Android; importar "expo-notifications" ahí tumba toda la app al cargar
// el módulo (no solo al usarlo). Detectamos Expo Go y usamos stubs en vez
// del módulo real, que solo se carga (require perezoso, no import estático)
// cuando corre en un development build de verdad.
const isExpoGo = Constants.appOwnership === "expo";

type NotificationsModule = typeof import("expo-notifications");

function createStub(): NotificationsModule {
  return {
    useLastNotificationResponse: () => null,
    scheduleNotificationAsync: async () => "expo-go-stub",
    setNotificationChannelAsync: async () => {},
    requestPermissionsAsync: async () => ({
      status: "denied",
      granted: false,
      canAskAgain: false,
      expires: "never",
    }),
    AndroidImportance: { HIGH: 4, DEFAULT: 3, LOW: 2, MIN: 1, NONE: 0 },
  } as unknown as NotificationsModule;
}

const Notifications: NotificationsModule = isExpoGo
  ? createStub()
  : // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require("expo-notifications") as NotificationsModule);

export default Notifications;
export { isExpoGo };
