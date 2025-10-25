# OAuth Authentication Setup Guide

## ✅ Implementation Complete

This app now has Google OAuth authentication powered by Clerk.

## 📋 Clerk Dashboard Setup Required

Before the OAuth flow will work, you need to configure Google OAuth in your Clerk dashboard:

### Step 1: Access Clerk Dashboard
1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Sign in or create an account
3. Select your application (matching the publishable key in `.env`)

### Step 2: Enable Google OAuth
1. Navigate to: **User & Authentication** → **Social Connections**
2. Click on **Google**
3. Click **Enable** to activate Google OAuth

### Step 3: Configure Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen if not done already
6. Create OAuth 2.0 credentials:
   - **Application type**: Web application
   - **Authorized redirect URIs**: Copy from Clerk dashboard

### Step 4: Add Credentials to Clerk
1. Copy **Client ID** and **Client Secret** from Google Cloud Console
2. Paste them into the Clerk dashboard Google OAuth settings
3. Click **Save**

### Step 5: Configure Redirect URIs for Expo

For development (Expo Go):
```
exp://YOUR-IP-ADDRESS:8081
```

For production:
```
myapp://oauth-callback
# Or your custom scheme
```

Add these to:
- Google Cloud Console → Credentials → Authorized redirect URIs
- Clerk Dashboard → Google OAuth settings

## 🧪 Testing the Authentication Flow

1. Start the development server:
   ```bash
   npm start
   # or
   expo start
   ```

2. Open the app on your device/simulator

3. Expected flow:
   - ✅ App shows loading spinner while checking auth status
   - ✅ Redirects to `/auth` screen if not signed in
   - ✅ Shows "cc.love" auth screen with Google sign-in button
   - ✅ Tap "Continue with Google" → Browser opens
   - ✅ Sign in with Google account
   - ✅ Returns to app and navigates to home screen
   - ✅ Session persists across app restarts

## 🔐 Environment Variables

Ensure `.env` contains:
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

## 📁 File Structure

```
app/
├── _layout.tsx              # ClerkProvider wrapper
├── (home)/                  # Protected routes
│   ├── _layout.tsx         # Auth guard (redirects if not signed in)
│   └── (tabs)/             # Main app tabs
│       ├── index.tsx
│       ├── explore.tsx
│       └── _layout.tsx
├── auth/                    # Auth screens
│   ├── _layout.tsx
│   └── index.tsx           # Google OAuth sign-in
└── modal.tsx

components/
└── ui/
    └── button.tsx          # Reusable button component

lib/
└── utils.ts                # Utility functions
```

## 🎨 UI Features

- ✅ Clean, minimal design
- ✅ Google branding following OAuth guidelines
- ✅ Loading states during OAuth flow
- ✅ Error handling with alerts
- ✅ Warm up browser for better performance
- ✅ Plain React Native styles (no external styling libraries)

## 🔄 How Authentication Works

1. **ClerkProvider** wraps the entire app in `app/_layout.tsx`
2. **Token caching** uses `expo-secure-store` for persistent sessions
3. **Auth guard** in `app/(home)/_layout.tsx` checks `useAuth().isSignedIn`
4. **OAuth flow** uses `useOAuth()` hook with `oauth_google` strategy
5. **Redirect handling** via `expo-web-browser` and `expo-auth-session`

## 🚀 Production Deployment

Before deploying to production:

1. ✅ Update Google Cloud Console with production redirect URIs
2. ✅ Enable Google OAuth for production in Clerk dashboard
3. ✅ Configure custom URL scheme in `app.json`
4. ✅ Test OAuth flow on physical devices
5. ✅ Add privacy policy and terms of service links

## 📝 Additional Notes

- Only Google OAuth is enabled (no email/password)
- All routes under `(home)` are protected
- Session management is handled automatically by Clerk
- Token refresh is handled automatically
- Sign out can be added using `useAuth().signOut()`

## 🆘 Troubleshooting

**OAuth not working?**
- Check Clerk publishable key in `.env`
- Verify redirect URIs in Google Cloud Console
- Ensure Google OAuth is enabled in Clerk dashboard
- Check Expo development URL matches redirect URI

**Session not persisting?**
- Verify `expo-secure-store` is installed
- Check token cache implementation in `app/_layout.tsx`

**Redirects not working?**
- Verify route structure matches this guide
- Check `initialRouteName` in `app/_layout.tsx`
- Clear app data and restart
