/**
 * En web el bundle no debe cargar módulos nativos de notifee.
 * Webpack resuelve @notifee/react-native → este shim.
 */
export const AndroidImportance = {DEFAULT: 3, HIGH: 4, LOW: 2};

export const TriggerType = {TIMESTAMP: 1, INTERVAL: 2};

export const AuthorizationStatus = {
  NOT_DETERMINED: -1,
  DENIED: 0,
  AUTHORIZED: 1,
  PROVISIONAL: 2,
};

const noopAsync = async () => {};

export default {
  requestPermission: async () => 1,
  createChannel: noopAsync,
  createTriggerNotification: noopAsync,
  cancelTriggerNotification: noopAsync,
  cancelAllNotifications: noopAsync,
  getTriggerNotificationIds: async () => [],
};
