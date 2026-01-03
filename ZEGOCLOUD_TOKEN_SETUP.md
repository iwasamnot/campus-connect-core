# ZEGOCLOUD Token Setup - Quick Guide

This guide will help you set up server-side token generation for ZEGOCLOUD calling using Firebase Functions v2 with Secret Manager.

## Prerequisites

- ZEGOCLOUD App ID: `128222087` (already configured)
- ZEGOCLOUD Server Secret (you need to get this)
- Firebase CLI installed and authenticated

## Step 1: Get Your Server Secret

1. Go to [ZEGOCLOUD Console](https://console.zegocloud.com)
2. Select your project
3. Go to **Project Configuration** → **Basic Configurations**
4. Find **ServerSecret** field (NOT AppSecret, NOT CallbackSecret)
5. Copy it (it should be exactly 32 hex characters: 0-9, a-f, A-F)
6. Keep it secure - never commit it to git!

**Important**: 
- Server Secret should be exactly 32 characters (hex: 0-9, a-f, A-F)
- If you see 34 characters, it might have quotes - remove them before using

## Step 2: Set Secret in Firebase Secret Manager (v2)

We're using Firebase Functions v2 with Secret Manager for secure secret storage.

### Using Firebase CLI (Recommended)

```bash
firebase functions:secrets:set ZEGO_SERVER_SECRET
```

When prompted, paste your 32-character Server Secret (no quotes, just the hex string).

**Note**: 
- Do NOT include quotes when entering the secret
- Just paste the 32-character hex string directly
- The secret will be stored securely in Google Cloud Secret Manager

### Verify Secret is Set

```bash
firebase functions:secrets:access ZEGO_SERVER_SECRET
```

This will show you the secret value (for verification only).

## Step 3: Deploy the Cloud Function

```bash
firebase deploy --only functions:generateZegoToken
```

**Important**: 
- The function uses Firebase Functions v2 with Secret Manager
- The secret `ZEGO_SERVER_SECRET` is automatically injected at runtime
- No need to set it in environment variables or config files

## Step 4: Test It

1. Refresh your browser
2. Try making a call (voice or video)
3. The app will automatically:
   - Call the Cloud Function to get a token
   - Use the token to authenticate with ZEGOCLOUD
   - Start the call

## How It Works

1. **User starts a call** → App calls `generateZegoToken` Cloud Function
2. **Cloud Function** → Gets Server Secret from Secret Manager (secure, server-side only)
3. **Token Generation** → Generates token using Server Secret (never exposed to client)
4. **Token returned** → App uses token to authenticate with ZEGOCLOUD
5. **Call connects** → Both users can now communicate

## Architecture

- **Frontend**: Uses `VITE_ZEGOCLOUD_APP_ID` from `.env` file
- **Backend**: Uses `ZEGO_SERVER_SECRET` from Firebase Secret Manager
- **Security**: Server Secret never exposed to client-side code
- **Functions v2**: Uses modern Firebase Functions v2 API with `onCall` and `secrets` array

## Troubleshooting

### "ZEGO_SERVER_SECRET is not configured"

**Solution**: Set the secret using:
```bash
firebase functions:secrets:set ZEGO_SERVER_SECRET
```

Then redeploy:
```bash
firebase deploy --only functions:generateZegoToken
```

### "Invalid Secret Length - Check Zego Console"

**Symptoms**: Logs show "Secret length: 34" or length != 32

**Causes**:
- Secret has extra quotes (34 chars = 32 secret + 2 quote chars)
- Secret was copied with spaces
- Wrong secret (AppSecret or CallbackSecret instead of ServerSecret)

**Solution**:
1. Verify you're using **ServerSecret** (not AppSecret or CallbackSecret)
2. Check logs for "DEBUG: Secret first char" - if it's a quote character (char code 34), quotes were included
3. Re-set the secret without quotes:
   ```bash
   firebase functions:secrets:set ZEGO_SERVER_SECRET
   # Paste only the 32-character hex string, no quotes
   ```
4. Redeploy the function

### Error 50119 (Token Auth Error)

This means ZEGOCLOUD rejected the token signature. Check:

1. **Authentication Mode**: In ZEGOCLOUD Console → Settings → Basic Configurations
   - Must be set to **"Token"** (not "AppSign")
   - Wait 2-3 minutes after changing for propagation

2. **Server Secret**: 
   - Must be exactly 32 hex characters
   - Must match exactly what's in ZEGOCLOUD Console
   - No spaces, no quotes
   - Verify in function logs: `DEBUG: Secret length: 32`

3. **App ID**: 
   - Must match exactly: `128222087`
   - Verify in ZEGOCLOUD Console → Project Configuration → Project Information

4. **UserID Matching**: 
   - The UserID used in token generation must match the UserID used in `loginRoom()`
   - Check function logs for "UserID match check: MATCH ✓"

5. **Function Deployment**:
   - Ensure function is deployed after setting secret
   - Check function logs: `firebase functions:log --only generateZegoToken`
   - Look for "SERVER_SECRET format check: Valid (32 hex chars) ✓"

### "Failed to generate token"

- Check that your Server Secret is correct (32 hex characters)
- Verify the App ID matches (128222087)
- Check function logs for detailed error messages
- Ensure Token Authentication Mode is enabled in ZEGOCLOUD Console

### Calls not connecting

- Verify token generation is working (check function logs)
- Ensure both users have granted camera/microphone permissions
- Check browser console for specific error messages
- Verify ZEGOCLOUD Console shows connections in real-time logs

## Migration from v1 to v2

If you were using the old `functions.config()` method:

**Old (v1)**:
```bash
firebase functions:config:set zegocloud.server_secret="YOUR_SECRET"
```

**New (v2)**:
```bash
firebase functions:secrets:set ZEGO_SERVER_SECRET
# Paste secret when prompted (no quotes)
```

**Benefits of v2**:
- More secure (uses Google Cloud Secret Manager)
- Better secret management (rotation, access control)
- Cleaner code (no config parsing needed)
- Automatic secret injection at runtime

## Additional Resources

- [ZEGOCLOUD Documentation](https://docs.zegocloud.com/)
- [ZEGOCLOUD Token Generation Guide](https://docs.zegocloud.com/article/11648)
- [Firebase Functions v2 Secrets](https://firebase.google.com/docs/functions/config-env#secret-manager)
- [ZEGOCLOUD_SETUP.md](./ZEGOCLOUD_SETUP.md) - Complete ZEGOCLOUD setup guide
