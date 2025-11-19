# Apex Intelligence Mobile App

React Native mobile app with hybrid FCM + Expo Push notifications.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Testing

```bash
# Unit tests
npm test

# E2E tests (requires simulator/emulator)
npm run build:e2e:ios
npm run test:e2e -- --configuration ios.sim.debug
```

## Build for Production

```bash
# Preview build
eas build --profile preview --platform all

# Production build
eas build --profile production --platform all
```

## Push Notifications

See [docs/PUSH_NOTIFICATIONS.md](../../docs/PUSH_NOTIFICATIONS.md) for complete setup instructions.

**Quick Setup:**

1. Add Firebase credentials to `.env`:
   ```
   FCM_SERVICE_ACCOUNT='{"type":"service_account",...}'
   ```

2. Add Expo access token:
   ```
   EXPO_ACCESS_TOKEN="your-expo-token"
   ```

3. Update `app.json` with your EAS project ID

4. Run database migration:
   ```
   npm run db:migrate
   ```

## Environment

- **Development/Preview**: Uses Expo Push (easier debugging)
- **Production**: Uses FCM directly (3× faster, 99.99% delivery)

## Architecture

```
lib/
  push-hybrid.ts      # Hybrid token management
  push-context.tsx    # React context provider

Server (../../src/):
  lib/push-fcm.ts     # FCM sending
  lib/push-expo.ts    # Expo sending
  lib/push-unified.ts # Unified interface

API:
  /api/push/register     # Token registration
  /api/push/unregister   # Token cleanup
  /api/cron/push-receipts # Receipt checking
```

## License

MIT
