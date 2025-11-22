// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponseAsync: jest.fn(),
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        env: 'development',
        apiUrl: 'http://localhost:3000',
        eas: {
          projectId: 'test-project-id',
        },
      },
    },
  },
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  deviceName: 'Test Device',
  modelName: 'iPhone 15 Pro',
}));

// Mock @react-native-firebase/messaging
jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: () => ({
    requestPermission: jest.fn(),
    getToken: jest.fn(),
    onTokenRefresh: jest.fn(),
    hasPermission: jest.fn(),
    AuthorizationStatus: {
      AUTHORIZED: 1,
      DENIED: 0,
      PROVISIONAL: 2,
    },
  }),
}));
