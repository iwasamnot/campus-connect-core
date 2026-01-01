# ZEGOCLOUD Token Setup - Quick Guide

This guide will help you set up server-side token generation for ZEGOCLOUD calling.

## Prerequisites

- ZEGOCLOUD App ID: `128222087` (already configured)
- ZEGOCLOUD Server Secret (you need to get this)

## Step 1: Get Your Server Secret

1. Go to [ZEGOCLOUD Console](https://console.zegocloud.com)
2. Select your project
3. Go to **Project Configuration** → **Basic Configurations**
4. Find **ServerSecret** field
5. Copy it (keep it secure!)

## Step 2: Configure Server Secret in Firebase

### Option A: Using Firebase CLI (Recommended)

```bash
firebase functions:config:set zegocloud.server_secret="YOUR_SERVER_SECRET_HERE"
firebase functions:config:set zegocloud.app_id="128222087"
```

### Option B: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/campus-connect-sistc)
2. Navigate to **Functions** → **Configuration** → **Environment Variables**
3. Click **Add Variable**
4. Add:
   - Name: `zegocloud.server_secret`
   - Value: `YOUR_SERVER_SECRET_HERE`
5. Add another:
   - Name: `zegocloud.app_id`
   - Value: `128222087`
6. Click **Save**

## Step 3: Deploy the Cloud Function

```bash
firebase deploy --only functions:generateZegoToken
```

## Step 4: Test It

1. Refresh your browser
2. Try making a call
3. The app will automatically:
   - Call the Cloud Function to get a token
   - Use the token to authenticate with ZEGOCLOUD
   - Start the call

## How It Works

1. **User starts a call** → App calls `generateZegoToken` Cloud Function
2. **Cloud Function** → Generates token using Server Secret (server-side, secure!)
3. **Token returned** → App uses token to authenticate with ZEGOCLOUD
4. **Call connects** → Both users can now communicate

## Troubleshooting

### "ZEGOCLOUD_SERVER_SECRET is not configured"
- Make sure you've set the Server Secret in Firebase Functions configuration
- Redeploy the function after setting the secret

### "Failed to generate token"
- Check that your Server Secret is correct
- Verify the App ID matches (128222087)
- Check Firebase Functions logs: `firebase functions:log`

### Token generation works but calls still fail
- Check ZEGOCLOUD Console for connection logs
- Verify both users have granted camera/microphone permissions
- Check browser console for specific errors

## Security Notes

✅ **DO:**
- Keep Server Secret in Firebase Functions configuration only
- Never commit Server Secret to git
- Use environment variables for secrets

❌ **DON'T:**
- Put Server Secret in `.env` files
- Expose Server Secret in client-side code
- Commit Server Secret to version control

## Next Steps

Once token generation is working:
1. Calls should connect automatically
2. Both users will be able to see/hear each other
3. Tokens expire after 24 hours (automatically regenerated on new calls)

