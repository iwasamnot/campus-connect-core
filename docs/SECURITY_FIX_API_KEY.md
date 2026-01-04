# Security Fix: Exposed API Key

## ⚠️ URGENT: API Key Security Issue

Google has detected that your Firebase API key was exposed in the GitHub repository. This needs to be fixed immediately.

## What Happened

The API key `AIzaSyDcsJKYKFvL-nGQtk7iLfW9mTfCZ0kc0qQ` was hardcoded in `src/firebaseConfig.js` as a fallback value. This is a security risk.

## ✅ What I've Fixed

1. **Removed hardcoded API key** from `src/firebaseConfig.js`
2. **Made environment variables required** - the app will now fail if keys are missing (instead of using insecure fallbacks)
3. **Updated code** to only use environment variables

## 🔒 What You Need to Do NOW

### Step 1: Regenerate the Compromised API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=campus-connect-sistc)
2. Find the API key: `AIzaSyDcsJKYKFvL-nGQtk7iLfW9mTfCZ0kc0qQ`
3. Click on it to edit
4. Click **Regenerate Key** button
5. Copy the new API key

### Step 2: Add API Key Restrictions (IMPORTANT!)

After regenerating, add restrictions to prevent abuse:

1. In the API key settings, scroll to **API restrictions**
2. Select **Restrict key**
3. Under **API restrictions**, select:
   - ✅ Firebase Installations API
   - ✅ Firebase Remote Config API
   - ✅ Identity Toolkit API
   - ✅ Cloud Firestore API
   - ✅ Firebase Storage API
   - ✅ Firebase Cloud Messaging API (if used)

4. Scroll to **Application restrictions**
5. Select **HTTP referrers (web sites)**
6. Add your domains:
   - `https://campus-connect-sistc.web.app/*`
   - `https://campus-connect-sistc.firebaseapp.com/*`
   - `http://localhost:*` (for local development)
   - `http://127.0.0.1:*` (for local development)

7. Click **Save**

### Step 3: Update Environment Variables

#### For Local Development:

1. Create/update `.env` file in project root:
   ```env
   VITE_FIREBASE_API_KEY=YOUR_NEW_API_KEY_HERE
   VITE_FIREBASE_AUTH_DOMAIN=campus-connect-sistc.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=campus-connect-sistc
   VITE_FIREBASE_STORAGE_BUCKET=campus-connect-sistc.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=680423970030
   VITE_FIREBASE_APP_ID=1:680423970030:web:f0b732dd11717d17a80fff
   VITE_FIREBASE_MEASUREMENT_ID=G-NRYYQRSBJD
   ```

2. Restart your dev server:
   ```bash
   npm run dev
   ```

#### For Production (GitHub Actions):

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Update the secret `VITE_FIREBASE_API_KEY` with your new API key
3. The next deployment will automatically use the new key

### Step 4: Verify It Works

1. Test locally - the app should work with the new API key
2. Check that API key restrictions are working (try accessing from an unauthorized domain - it should fail)
3. Monitor Google Cloud Console for any suspicious activity

## 🔐 Security Best Practices

### ✅ DO:
- Use environment variables for all secrets
- Add API key restrictions (HTTP referrers + API restrictions)
- Monitor API usage in Google Cloud Console
- Regenerate keys if exposed
- Use Firestore/Storage security rules (already in place)

### ❌ DON'T:
- Hardcode API keys in source code
- Commit `.env` files to git
- Share API keys in public forums
- Use unrestricted API keys

## 📊 Monitoring

After fixing, monitor your API usage:
1. Go to [Google Cloud Console → APIs & Services → Dashboard](https://console.cloud.google.com/apis/dashboard?project=campus-connect-sistc)
2. Check for unusual activity
3. Set up billing alerts (see `BILLING_PROTECTION.md`)

## ⚠️ Note About Firebase Web API Keys

Firebase web API keys are **meant to be public** (they're used in client-side code), but they should:
- Have HTTP referrer restrictions (only work from your domains)
- Have API restrictions (only work with specific APIs)
- Be monitored for abuse
- NOT be in version control unnecessarily

The security comes from:
- ✅ Firestore security rules (already configured)
- ✅ Storage security rules (already configured)
- ✅ API key restrictions (you need to add these)
- ✅ Authentication requirements (users must be logged in)

## Need Help?

If you encounter issues:
1. Check that all environment variables are set correctly
2. Verify API key restrictions allow your domains
3. Check browser console for specific error messages
4. Review Firebase Console for API usage

