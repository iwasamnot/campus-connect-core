# VideoSDK.live Setup Guide

This project has been migrated from ZEGOCLOUD to VideoSDK.live for calling functionality.

## ✅ Completed Setup

1. **Frontend Package**: `@videosdk.live/react-sdk` installed
2. **Backend Package**: `jsonwebtoken` installed in Firebase Functions
3. **Firebase Function**: `getVideoSDKToken` created
4. **CallContext**: Migrated to use VideoSDK
5. **MeetingView Component**: Created for VideoSDK integration
6. **CallModal**: Updated to use VideoSDK MeetingProvider

## 📋 Required Setup Steps

### Step 1: Set VideoSDK Secret in Firebase

Your VideoSDK Server Secret: `ab0135234ba26d4007676715194f243f0248214f6e04e35e21369cf342e1f556`

Run this command to set it:

```powershell
firebase functions:secrets:set VIDEOSDK_SECRET
```

When prompted, paste: `ab0135234ba26d4007676715194f243f0248214f6e04e35e21369cf342e1f556`
(No quotes, just the 64-character hex string)

### Step 2: Update CORS Configuration (if needed)

If you're deploying to a production URL, edit `functions/getVideoSDKToken.js` and add your production URL to the `cors` array:

```javascript
cors: [
  'http://localhost:5173',
  'https://your-project-id.web.app', // Add your production URL here
  'https://your-project-id.firebaseapp.com', // Or your custom domain
]
```

### Step 3: Grant Public Access in Google Cloud Console

Firebase 2nd Gen functions require explicit permission for browser calls:

1. Go to [Google Cloud Console - Cloud Run](https://console.cloud.google.com/run)
2. Find your service: **`getvideosdktoken`**
3. Click on it, then go to **Permissions** tab
4. Click **Add Principal**
5. Type **`allUsers`**
6. Select Role: **Cloud Run Invoker**
7. Click **Save**

### Step 4: Deploy Firebase Function

```powershell
firebase deploy --only functions:getVideoSDKToken
```

### Step 5: Test the Integration

1. Start your development server: `npm run dev`
2. Open the app in your browser
3. Navigate to Private Chat
4. Click the voice or video call button
5. Grant microphone/camera permissions when prompted

## 🔑 Credentials

- **API Key**: `0cd81014-abab-4f45-968d-b3ddae835a82` (hardcoded in function)
- **Server Secret**: Stored in Firebase Secret Manager as `VIDEOSDK_SECRET`

## 📚 How It Works

1. **Call Initiation**: When a user starts a call, the frontend requests a token from `getVideoSDKToken`
2. **Token Generation**: The Firebase function generates a JWT token using the Server Secret
3. **Meeting Creation**: The token and meeting ID are passed to VideoSDK's `MeetingProvider`
4. **Call Connection**: VideoSDK handles all WebRTC connections automatically

## 🆚 Key Differences from ZEGOCLOUD

| Feature | ZEGOCLOUD | VideoSDK.live |
|---------|-----------|---------------|
| Setup Complexity | High (token generation, environment config) | Low (standard JWT) |
| Client Configuration | Required (App ID in .env) | Not required |
| Token Format | Custom crypto helper | Standard JWT (jsonwebtoken) |
| Debugging | Complex (token verification difficult) | Easy (can verify on jwt.io) |
| Free Tier | Limited | 10,000 minutes/month |

## 🐛 Troubleshooting

### Token Generation Fails
- Verify the secret is set correctly: `firebase functions:logs --only getVideoSDKToken`
- Check that the secret is exactly 64 hex characters (no quotes, no spaces)

### Calls Don't Connect
- Check browser console for errors
- Ensure microphone/camera permissions are granted
- Verify the Firebase function is deployed: `firebase functions:list`

### Meeting Not Starting
- Check browser console for VideoSDK errors
- Verify token is being received (check Network tab for function call)
- Ensure both users have valid tokens for the same meeting ID

## 📝 Notes

- The old ZEGOCLOUD package (`zego-express-engine-webrtc`) is still in package.json but not used
- You can remove it later if desired: `npm uninstall zego-express-engine-webrtc`
- VideoSDK handles all environment/cluster configuration automatically (no env:0 vs env:1 issues)

