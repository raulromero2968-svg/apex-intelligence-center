
export const registerForPushNotificationsAsync = async () => { return null; };
export const getPushToken = async () => { return { token: null }; };
// Explicitly define the callback signature
export const setupForegroundNotificationHandler = (callback: (notification: any) => void) => { return { remove: () => {} }; };
export const setupNotificationResponseHandler = (callback: (response: any) => void) => { return { remove: () => {} }; };
export const setupTokenRefreshListener = (callback: (token: string) => void) => { return { remove: () => {} }; };
export const unregisterForPushNotificationsAsync = async () => {};
export const arePushNotificationsEnabled = async () => { return false; };

