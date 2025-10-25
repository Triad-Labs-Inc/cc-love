# Push Notifications Setup Guide

Complete guide for implementing push notifications in your iOS app with backend server.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [iOS App Setup](#ios-app-setup)
5. [Backend Setup](#backend-setup)
6. [API Documentation](#api-documentation)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This project uses **Expo Push Notifications** to send push notifications from your backend to iOS devices. The flow is:

1. iOS app requests notification permissions
2. iOS app gets an Expo Push Token
3. iOS app sends the token to your backend
4. Backend stores the token
5. Backend can send notifications on-demand using the Expo Push API

### Why Expo Push?

- No APNs certificate management needed
- Works out of the box with Expo apps
- Simple REST API
- Free tier: 600 notifications/hour
- Handles iOS and Android with one API

---

## Architecture

```
┌──────────────┐         ┌──────────────────┐         ┌────────────────┐
│   iOS App    │         │  Your Backend    │         │  Expo Push     │
│              │         │  (Vercel)        │         │  Service       │
└──────┬───────┘         └────────┬─────────┘         └────────┬───────┘
       │                          │                            │
       │ 1. Request Token         │                            │
       ├─────────────────────────>│                            │
       │                          │                            │
       │ 2. Store Token           │                            │
       │    POST /api/push-tokens │                            │
       ├─────────────────────────>│                            │
       │                          │                            │
       │                          │ 3. Send Notification       │
       │                          │    POST /send              │
       │                          ├───────────────────────────>│
       │                          │                            │
       │ 4. Notification          │                            │
       │<─────────────────────────┴────────────────────────────┤
       │                                                        │
```

---

## Prerequisites

### Required

- Node.js 18+ installed
- Expo account (free at https://expo.dev)
- Physical iOS device (push notifications don't work in simulator)
- Expo CLI installed: `npm install -g expo-cli`

### Get Your Expo Project ID

1. Run `npx expo whoami` to see your Expo username
2. Your project slug is in `app.json`: `"slug": "cc"`
3. Your project ID format: `@your-username/cc`
4. Update `app/utils/notifications.ts` line 54 with your project ID:

```typescript
token = (await Notifications.getExpoPushTokenAsync({
  projectId: '@your-username/cc' // Update this!
})).data;
```

---

## iOS App Setup

### 1. Install Dependencies

Already done! The following packages are added to `package.json`:

```json
"expo-notifications": "~1.0.4",
"expo-device": "~7.0.4"
```

Run to install:
```bash
npm install
```

### 2. Code Structure

Three key files have been set up:

- **`app/utils/notifications.ts`** - Notification utilities
  - `registerForPushNotificationsAsync()` - Get push token
  - `sendPushTokenToBackend()` - Send token to server
  - `setupNotificationHandler()` - Configure foreground behavior

- **`app/_layout.tsx`** - Notification listeners
  - Foreground notification handler
  - Notification tap handler
  - Cleanup on unmount

- **`app/(tabs)/index.tsx`** - Registration on app start
  - Requests permissions
  - Gets push token
  - Sends to backend

### 3. Update Expo Project ID

Edit `app/utils/notifications.ts` line 54:

```typescript
token = (await Notifications.getExpoPushTokenAsync({
  projectId: 'your-project-id' // REPLACE THIS
})).data;
```

Replace with your actual Expo project ID from `app.json`.

### 4. Build and Run

```bash
# For development
npx expo start

# Scan QR code with Expo Go app
# OR build a development build:
npx expo run:ios
```

---

## Backend Setup

### 1. Deploy Backend Files

The backend API files are in `backend-api/`:

```
backend-api/
├── package.json              # Dependencies
└── api/
    ├── push-tokens.ts        # Store device tokens
    └── send-notification.ts  # Send notifications
```

### 2. Deploy to Vercel

#### Option A: Add to existing Vercel project

If you already have a Next.js project at `cc-love.vercel.app`:

1. Copy the files to your Next.js project:
   ```bash
   cp backend-api/api/*.ts /path/to/your/nextjs-project/pages/api/
   ```

2. Add dependency to your project:
   ```bash
   cd /path/to/your/nextjs-project
   npm install expo-server-sdk
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

#### Option B: Create new Vercel project

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy the backend-api folder:
   ```bash
   cd backend-api
   vercel --prod
   ```

3. Update the API endpoint in `app/utils/notifications.ts`:
   ```typescript
   apiEndpoint: string = 'https://YOUR-PROJECT.vercel.app/api/push-tokens'
   ```

### 3. Install Dependencies

Add to your backend `package.json`:

```json
{
  "dependencies": {
    "expo-server-sdk": "^3.10.0"
  }
}
```

Run:
```bash
npm install
```

---

## API Documentation

### 1. Store Push Token

**Endpoint:** `POST /api/push-tokens`

**Purpose:** Store device push tokens sent from the iOS app

**Request Body:**
```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "deviceId": "12345-67890",
  "deviceName": "Ferran's iPhone",
  "platform": "ios"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token saved successfully",
  "tokenCount": 1
}
```

**Error Responses:**
- `400` - Missing token
- `500` - Server error

**Storage:**
- Tokens are stored in `push-tokens.json` (file-based)
- For production, replace with database (PostgreSQL, MongoDB, etc.)

**Example cURL:**
```bash
curl -X POST https://cc-love.vercel.app/api/push-tokens \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "deviceId": "12345",
    "deviceName": "Test Device",
    "platform": "ios"
  }'
```

---

### 2. Send Push Notification

**Endpoint:** `POST /api/send-notification`

**Purpose:** Send push notifications to one or more devices on demand

**Request Body:**
```json
{
  "to": "all",
  "title": "Recording Started!",
  "body": "Your screen recording has begun.",
  "data": {
    "action": "start_recording",
    "timestamp": 1698765432
  }
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `to` | string \| string[] | Yes | Target token(s). Use `"all"` to send to all devices, a single token string, or an array of tokens |
| `title` | string | Yes | Notification title (shown in bold) |
| `body` | string | Yes | Notification message body |
| `data` | object | No | Custom data payload (accessible in app) |

**Response (200 OK):**
```json
{
  "success": true,
  "sent": 1,
  "total": 1,
  "tickets": [
    {
      "status": "ok",
      "id": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
    }
  ]
}
```

**Error Responses:**
- `400` - Missing required fields or invalid tokens
- `500` - Server error

**Examples:**

#### Send to All Devices
```bash
curl -X POST https://cc-love.vercel.app/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "to": "all",
    "title": "Hello!",
    "body": "This goes to all registered devices"
  }'
```

#### Send to Specific Token
```bash
curl -X POST https://cc-love.vercel.app/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "title": "Hello!",
    "body": "This goes to one specific device"
  }'
```

#### Send to Multiple Tokens
```bash
curl -X POST https://cc-love.vercel.app/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "to": [
      "ExponentPushToken[token1]",
      "ExponentPushToken[token2]"
    ],
    "title": "Hello!",
    "body": "This goes to multiple devices"
  }'
```

#### Send with Custom Data
```bash
curl -X POST https://cc-love.vercel.app/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "to": "all",
    "title": "Recording Complete",
    "body": "Your recording is ready!",
    "data": {
      "recordingId": "abc123",
      "duration": 120,
      "action": "view_recording"
    }
  }'
```

---

## Testing

### 1. Test on Physical Device

Push notifications **only work on physical devices**, not simulators.

1. Build and run on your iPhone:
   ```bash
   npx expo run:ios
   ```

2. Allow notification permissions when prompted

3. Check the console logs for your push token:
   ```
   Push token: ExponentPushToken[xxxxx...]
   Token sent to backend successfully
   ```

### 2. Send Test Notification

Use cURL to send a test notification:

```bash
curl -X POST https://cc-love.vercel.app/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "to": "all",
    "title": "Test Notification",
    "body": "If you see this, push notifications are working!"
  }'
```

### 3. Verify Notification Behavior

Test in different app states:

| App State | Expected Behavior |
|-----------|-------------------|
| **Foreground** | Notification appears as banner at top |
| **Background** | Notification appears in notification center |
| **Closed** | Notification appears in notification center |
| **Tapped** | Console logs "Notification tapped: ..." |

### 4. Debug Checklist

If notifications aren't working:

- [ ] Using a physical device (not simulator)
- [ ] Updated project ID in `notifications.ts`
- [ ] Granted notification permissions
- [ ] Check console for push token
- [ ] Verify token was sent to backend (check backend logs)
- [ ] Backend API is deployed and accessible
- [ ] Test cURL request returns success
- [ ] Check Expo Push Dashboard: https://expo.dev/notifications

---

## Deployment

### iOS App Deployment

1. **Development Build:**
   ```bash
   npx expo run:ios
   ```

2. **Production Build (TestFlight/App Store):**
   ```bash
   eas build --platform ios --profile production
   ```

   Follow Expo EAS docs: https://docs.expo.dev/build/introduction/

### Backend Deployment

1. **Vercel:**
   ```bash
   cd backend-api
   vercel --prod
   ```

2. **Other platforms:**
   - Ensure Node.js 18+ runtime
   - Install dependencies: `npm install`
   - Set up API routes at `/api/push-tokens` and `/api/send-notification`

---

## Troubleshooting

### Common Issues

#### 1. "Must use physical device for Push Notifications"

**Problem:** Testing on iOS Simulator

**Solution:** Push notifications only work on real devices. Use a physical iPhone.

---

#### 2. Push token is undefined/null

**Problem:** Permissions not granted or Expo project ID missing

**Solution:**
1. Check if permissions were granted in app
2. Verify project ID in `notifications.ts` line 54
3. Run `npx expo whoami` to get your username
4. Update: `projectId: '@your-username/cc'`

---

#### 3. "Invalid Expo push token"

**Problem:** Malformed token sent to backend

**Solution:**
- Expo push tokens start with `ExponentPushToken[`
- Check console logs to see the actual token
- Ensure token is being sent correctly to backend

---

#### 4. Notification sent but not received

**Possible causes:**

1. **App not registered with Expo Push:**
   - Verify project ID is correct
   - Rebuild the app with correct ID

2. **Token expired:**
   - Tokens can expire if app is uninstalled/reinstalled
   - Re-register the device

3. **Expo Push Service limits:**
   - Free tier: 600 notifications/hour
   - Check Expo dashboard for quota

4. **iOS device issues:**
   - Restart device
   - Check iOS notification settings
   - Ensure "Do Not Disturb" is off

---

#### 5. Backend returns 500 error

**Problem:** Server error when storing tokens or sending notifications

**Solution:**
1. Check Vercel logs: `vercel logs`
2. Verify `expo-server-sdk` is installed
3. Check file permissions for `push-tokens.json`
4. For production, use a database instead of file storage

---

#### 6. Notifications work in dev but not production

**Problem:** Different Expo project IDs or build configurations

**Solution:**
1. Ensure same project ID in both builds
2. Check EAS build configuration in `eas.json`
3. Verify production build has notification entitlements

---

### Debugging Tips

#### Enable Verbose Logging

Add to `app/utils/notifications.ts`:

```typescript
export async function registerForPushNotificationsAsync() {
  console.log('=== Starting push notification registration ===');
  console.log('Platform:', Platform.OS);
  console.log('Is device:', Device.isDevice);

  // ... rest of function
}
```

#### Check Expo Push Dashboard

View notification history and errors:
https://expo.dev/accounts/[your-account]/projects/cc/push-notifications

#### Test with Expo Push Tool

Send test notifications manually:
https://expo.dev/notifications

Enter your token and send a test message.

---

## Advanced Usage

### 1. Schedule Notifications

Expo supports local scheduled notifications:

```typescript
import * as Notifications from 'expo-notifications';

await Notifications.scheduleNotificationAsync({
  content: {
    title: "Scheduled Notification",
    body: "This was scheduled 5 seconds ago",
  },
  trigger: {
    seconds: 5,
  },
});
```

### 2. Notification Categories & Actions

Add action buttons to notifications:

```typescript
await Notifications.setNotificationCategoryAsync('recording', [
  {
    identifier: 'stop',
    buttonTitle: 'Stop',
    options: { opensAppToForeground: true },
  },
]);
```

### 3. Handle Notification Data

Access custom data when notification is tapped:

```typescript
// In app/_layout.tsx
responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
  const data = response.notification.request.content.data;

  if (data.action === 'view_recording') {
    router.push(`/recording/${data.recordingId}`);
  }
});
```

### 4. Badge Count

Update app icon badge:

```typescript
await Notifications.setBadgeCountAsync(5);
await Notifications.getBadgeCountAsync(); // Returns: 5
```

### 5. Database Storage (Production)

Replace file-based storage with a database. Example with PostgreSQL:

```typescript
// In api/push-tokens.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const tokenData = req.body;

  await prisma.pushToken.upsert({
    where: { token: tokenData.token },
    update: tokenData,
    create: tokenData,
  });

  return res.status(200).json({ success: true });
}
```

---

## Resources

- **Expo Push Notifications Docs:** https://docs.expo.dev/push-notifications/overview/
- **Expo Server SDK:** https://github.com/expo/expo-server-sdk-node
- **Expo Push Tool:** https://expo.dev/notifications
- **Next.js API Routes:** https://nextjs.org/docs/api-routes/introduction
- **Vercel Deployment:** https://vercel.com/docs

---

## Summary

You now have a complete push notification system:

1. ✅ iOS app requests permissions and gets push tokens
2. ✅ Backend stores tokens
3. ✅ Backend can send notifications on demand
4. ✅ iOS app handles incoming notifications

### Quick Start Commands

```bash
# iOS App
npm install
npx expo run:ios

# Backend (if separate project)
cd backend-api
npm install
vercel --prod

# Test Notification
curl -X POST https://cc-love.vercel.app/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{"to": "all", "title": "Test", "body": "Hello!"}'
```

---

**Questions?** Check the troubleshooting section or Expo docs!
