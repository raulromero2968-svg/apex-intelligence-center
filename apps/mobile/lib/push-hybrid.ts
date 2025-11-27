
export const registerForPushNotificationsAsync = async () => { return null; };
export const getPushToken = async () => { return { token: null }; };
// These return objects with .remove()
export const setupForegroundNotificationHandler = (...args: any[]) => { return { remove: () => {} }; };
export const setupNotificationResponseHandler = (...args: any[]) => { return { remove: () => {} }; };
// This one is called directly as a function, so it must return a function
export const setupTokenRefreshListener = (...args: any[]) => { return () => {}; };
export const unregisterForPushNotificationsAsync = async () => {};
export const arePushNotificationsEnabled = async () => { return false; };

