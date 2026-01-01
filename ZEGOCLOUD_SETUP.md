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

## For Production Deployment

### Important Security Note

**Never expose your Server Secret in client-side code!**

For production use, you need to:

1. **Set up server-side token generation**
   - Create a Firebase Cloud Function or backend endpoint
   - Generate tokens server-side using your Server Secret
   - Return tokens to the client on-demand

2. **Get Server Secret** (keep it secure!)
   - In ZEGOCLOUD Console → Project Configuration → Basic Configurations
   - Find **ServerSecret** field
   - **DO NOT** add this to `.env` or client-side code
   - Use it only in your server-side token generation code

3. **Update CallContext.jsx**
   - Replace the placeholder token with a call to your backend API
   - Example:
     ```javascript
     const response = await fetch('/api/zegocloud/token', {
       method: 'POST',
       body: JSON.stringify({ userId: user.uid, roomID })
     });
     const { token } = await response.json();
     ```

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

## Additional Resources

- [ZEGOCLOUD Documentation](https://docs.zegocloud.com/)
- [ZEGOCLOUD Token Generation Guide](https://docs.zegocloud.com/article/11648)
- [Web SDK Quick Start](https://docs.zegocloud.com/article/14696)

