# ZEGOCLOUD Setup Guide for Voice & Video Calling

This guide will help you set up ZEGOCLOUD for voice and video calling features in CampusConnect.

## Required Secrets/Environment Variables

You need to add these to your `.env` file:

```env
VITE_ZEGOCLOUD_APP_ID=your-app-id-here
```

**Note**: For production, you'll also need to implement server-side token generation. The `VITE_ZEGOCLOUD_SERVER_SECRET` should NOT be exposed in client-side code for security reasons.

## How to Get Your ZEGOCLOUD App ID

1. **Sign up/Login to ZEGOCLOUD**
   - Go to https://console.zegocloud.com
   - Sign in with your account (or create one)

2. **Find Your Project**
   - In the ZEGOCLOUD Console, navigate to your project (or create a new one)
   - Project name: CampusConnect (if you've already created it)

3. **Get App ID**
   - Go to **Project Configuration** → **Project Information** tab
   - Find **AppID** field (it's a number like `128222087`)
   - Copy this number

4. **Add to Environment Variables**
   - Open your `.env` file in the project root
   - Add: `VITE_ZEGOCLOUD_APP_ID=128222087` (replace with your actual App ID)
   - Save the file

5. **Restart Development Server**
   ```bash
   npm run dev
   ```

## For Production Deployment (Server-Side Token Generation)

### Important Security Note

**Never expose your Server Secret in client-side code!**

The app now includes a Firebase Cloud Function for server-side token generation. Here's how to set it up:

### Step 1: Get Your ZEGOCLOUD Server Secret

1. Go to [ZEGOCLOUD Console](https://console.zegocloud.com)
2. Select your project
3. Go to **Project Configuration** → **Basic Configurations**
4. Find **ServerSecret** field
5. Copy the Server Secret (keep it secure - never commit to git!)

### Step 2: Token Generator Already Included ✅

The token generator is already implemented in `functions/zegoTokenGenerator.js`. No additional packages needed!

### Step 3: Configure Server Secret in Firebase Functions

You have two options:

#### Option A: Using Firebase CLI (Recommended)

```bash
firebase functions:config:set zegocloud.server_secret="YOUR_SERVER_SECRET_HERE"
firebase functions:config:set zegocloud.app_id="128222087"
```

#### Option B: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/campus-connect-sistc)
2. Navigate to **Functions** → **Configuration** → **Environment Variables**
3. Click **Add Variable**
4. Add:
   - Name: `zegocloud.server_secret`, Value: `YOUR_SERVER_SECRET_HERE`
   - Name: `zegocloud.app_id`, Value: `128222087`

### Step 4: Deploy the Cloud Function

```bash
cd functions
npm install
cd ..
firebase deploy --only functions:generateZegoToken
```

### Step 5: Verify It Works

The app will automatically try to get tokens from the Cloud Function. If token generation fails, it will fall back to token-less mode (if enabled).

### How It Works

1. When a user starts a call, the app calls the `generateZegoToken` Cloud Function
2. The function generates a token using your Server Secret
3. The token is returned to the client
4. The client uses the token to authenticate with ZEGOCLOUD

**Security**: The Server Secret never leaves the server, keeping it secure.

## Current Implementation Status

⚠️ **Token Authentication Required**: ZEGOCLOUD requires token authentication. You have two options:

### Option 1: Enable Token-less Mode (Development Only)
1. Go to [ZEGOCLOUD Console](https://console.zegocloud.com)
2. Select your project
3. Go to **Project Settings** → **Basic Configurations**
4. Look for **Token-less Mode** or **Development Mode**
5. Enable it for your App ID
6. Save the settings

**Note**: Token-less mode is only available for development/testing. For production, you must use Option 2.

### Option 2: Server-side Token Generation (Recommended for Production)
You need to implement server-side token generation using your Server Secret. See the "For Production Deployment" section above.

## Testing the Feature

Once you've added your App ID:

1. Start your development server: `npm run dev`
2. Log in to CampusConnect
3. Go to Private Chat
4. Select a user to chat with
5. Click the Phone (voice) or Video (video call) button in the chat header
6. Grant camera/microphone permissions when prompted

## Troubleshooting

### "Calling service unavailable"
- Check that `VITE_ZEGOCLOUD_APP_ID` is set correctly in `.env`
- Restart your dev server after adding the variable
- Check browser console for specific error messages

### "Camera/microphone access is required"
- Grant browser permissions for camera and microphone
- Check browser settings if permissions are blocked
- Make sure you're using HTTPS (required for media access in most browsers)

### Calls not connecting
- Verify your ZEGOCLOUD app allows token-less mode (for development)
- For production, implement server-side token generation
- Check ZEGOCLOUD Console for connection logs
- Ensure both users have granted camera/microphone permissions
- Check browser console for specific error messages

## Server Information

### WebSocket Server URL

For App ID `128222087`, the ZEGOCLOUD WebSocket server URL is:
```
wss://webliveroom128222087-api.coolzcloud.com/ws
```

**Note**: The ZEGOCLOUD SDK automatically resolves and connects to the correct server URL based on your App ID. You don't need to manually configure this URL in the code - it's provided here for reference and troubleshooting purposes.

If you're experiencing connection issues, you can verify that this server is accessible from your network.

## Additional Resources

- [ZEGOCLOUD Documentation](https://docs.zegocloud.com/)
- [ZEGOCLOUD Token Generation Guide](https://docs.zegocloud.com/article/11648)
- [Web SDK Quick Start](https://docs.zegocloud.com/article/14696)

