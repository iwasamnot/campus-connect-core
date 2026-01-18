# Server-Side Token Setup - Quick Start

This guide shows you how to use server-side token generation for ZEGOCLOUD calls.

## ✅ What's Already Done

- ✅ Cloud Function created: `functions/generateZegoToken.js`
- ✅ Token generator implemented: `functions/zegoTokenGenerator.js`
- ✅ Frontend code updated: `src/context/CallContext.jsx` now calls the Cloud Function
- ✅ Function exported: Available as `generateZegoToken` in Firebase Functions

## 🚀 Setup Steps

### Step 1: Get Your ZEGOCLOUD Server Secret

1. Go to [ZEGOCLOUD Console](https://console.zegocloud.com)
2. Select your project (App ID: `128222087`)
3. Navigate to **Project Configuration** → **Basic Configurations**
4. Find **ServerSecret** field
5. **Copy it** (keep it secure - never commit to git!)

### Step 2: Configure in Firebase Functions

**Option A: Using Firebase CLI (Recommended)**

```bash
# Set the Server Secret
firebase functions:config:set zegocloud.server_secret="YOUR_SERVER_SECRET_HERE"

# Set the App ID (optional, already defaults to 128222087)
firebase functions:config:set zegocloud.app_id="128222087"
```

**Option B: Using Firebase Console**

1. Go to [Firebase Console](https://console.firebase.google.com/project/campus-connect-sistc)
2. Navigate to **Functions** → **Configuration** → **Environment Variables**
3. Click **Add Variable**
4. Add:
   - **Name:** `zegocloud.server_secret`
   - **Value:** `YOUR_SERVER_SECRET_HERE`
5. Add another:
   - **Name:** `zegocloud.app_id`
   - **Value:** `128222087`
6. Click **Save**

### Step 3: Deploy the Cloud Function

```bash
firebase deploy --only functions:generateZegoToken
```

Or deploy all functions:
```bash
firebase deploy --only functions
```

### Step 4: Test It!

1. **Refresh your browser** (clear cache if needed)
2. **Try making a call** - it should now:
   - Automatically call the Cloud Function to get a token
   - Use the token to authenticate with ZEGOCLOUD
   - Connect the call successfully

## 🔍 How It Works

```
User clicks "Call" 
  ↓
Frontend calls generateZegoToken Cloud Function
  ↓
Cloud Function generates token using Server Secret (server-side, secure!)
  ↓
Token returned to frontend
  ↓
Frontend uses token to authenticate with ZEGOCLOUD
  ↓
Call connects! ✅
```

## 🐛 Troubleshooting

### "ZEGOCLOUD_SERVER_SECRET is not configured"

**Solution:**
- Make sure you've set `zegocloud.server_secret` in Firebase Functions configuration
- Redeploy the function after setting the secret:
  ```bash
  firebase deploy --only functions:generateZegoToken
  ```

### "Failed to generate token"

**Check:**
1. Server Secret is correct (no typos)
2. App ID matches (128222087)
3. Cloud Function is deployed
4. Check Firebase Functions logs:
   ```bash
   firebase functions:log --only generateZegoToken
   ```

### Token generation works but calls still fail

**Check:**
1. Browser console for specific errors
2. ZEGOCLOUD Console for connection logs
3. Both users have granted camera/microphone permissions
4. Network connectivity

### Function not found / 404 error

**Solution:**
- Make sure the function is deployed:
  ```bash
  firebase deploy --only functions:generateZegoToken
  ```
- Check function name matches: `generateZegoToken`
- Verify function is exported in `functions/index.js`

## 📝 Code Flow

**Frontend (`src/context/CallContext.jsx`):**
```javascript
// 1. Call Cloud Function to get token
const generateToken = httpsCallable(functions, 'generateZegoToken');
const tokenResult = await generateToken({
  userId: user.uid,
  roomID: roomID
});

// 2. Use token to join room
const token = tokenResult.data.token;
await zg.loginRoom(roomID, token, { userID, userName });
```

**Backend (`functions/generateZegoToken.js`):**
```javascript
// 1. Verify user is authenticated
// 2. Generate token using Server Secret
// 3. Return token to frontend
```

## 🔒 Security

✅ **DO:**
- Keep Server Secret in Firebase Functions configuration only
- Never commit Server Secret to git
- Use environment variables for secrets
- Verify user authentication before generating tokens

❌ **DON'T:**
- Put Server Secret in `.env` files (client-side)
- Expose Server Secret in frontend code
- Commit Server Secret to version control
- Generate tokens client-side

## ✨ Benefits

1. **Secure** - Server Secret never exposed to client
2. **Production-ready** - Proper authentication flow
3. **Automatic** - No manual token management
4. **Reliable** - Tokens expire after 24 hours, auto-regenerated

## 🎯 Next Steps

Once setup is complete:
1. ✅ Calls will automatically use server-side tokens
2. ✅ No more token errors
3. ✅ Secure authentication
4. ✅ Production-ready calling feature

## 📚 Related Docs

- `ZEGOCLOUD_SETUP.md` - General ZEGOCLOUD setup
- `ZEGOCLOUD_TOKEN_SETUP.md` - Detailed token setup guide
- `functions/generateZegoToken.js` - Cloud Function code
- `functions/zegoTokenGenerator.js` - Token generation logic


