# Calling Feature Troubleshooting Guide

## Call Buttons Are Greyed Out

If the call and video call buttons are greyed out, follow these steps:

### Step 1: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Look for messages about ZEGOCLOUD App ID

**What to look for:**

✅ **If you see:**
```
✅ ZEGOCLOUD App ID found: 128222087
✅ Calling feature is available
```
→ The App ID is loaded correctly. If buttons are still greyed out, there's a different issue.

❌ **If you see:**
```
⚠️ ZEGOCLOUD App ID not found
Current value: undefined
```
→ The App ID is not being loaded. Continue to Step 2.

### Step 2: Verify GitHub Secret (For Firebase Deployment)

If you're using the **Firebase-hosted version**, the App ID must be set as a GitHub Secret:

1. Go to your GitHub repository: https://github.com/iwasamnot/campus-connect-core
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Look for `VITE_ZEGOCLOUD_APP_ID` in the list
4. If it's **missing**:
   - Click **New repository secret**
   - Name: `VITE_ZEGOCLOUD_APP_ID`
   - Value: `128222087`
   - Click **Add secret**
5. If it exists, verify the value is `128222087`

### Step 3: Trigger New Deployment

After adding/updating the GitHub Secret:

1. Go to **Actions** tab in GitHub
2. Click on **Deploy to Firebase Hosting on merge** workflow
3. Click **Run workflow** → **Run workflow** (to manually trigger)
4. Wait for the deployment to complete (usually 2-5 minutes)
5. Refresh your Firebase-hosted site

### Step 4: Clear Browser Cache

After deployment completes:

1. **Hard Refresh**: Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Or **Clear Cache**:
   - Open DevTools (F12)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

### Step 5: Verify Environment Variable in Build

To verify the variable is being used during build:

1. Go to GitHub → **Actions** tab
2. Click on the latest workflow run
3. Click on **build_and_deploy** job
4. Click on **Build project** step
5. Look for any errors or warnings
6. The build should complete successfully

### Step 6: Check Service Worker

The service worker might be caching the old version:

1. Open DevTools (F12)
2. Go to **Application** → **Service Workers**
3. Click **Unregister** for the current service worker
4. Refresh the page

### For Local Development

If testing locally:

1. Create/update `.env` file in project root:
   ```
   VITE_ZEGOCLOUD_APP_ID=128222087
   ```
2. **Restart** your dev server:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```
3. **Hard refresh** browser: `Ctrl+Shift+R`

## Quick Diagnostic Checklist

- [ ] Browser console shows "✅ ZEGOCLOUD App ID found"
- [ ] GitHub Secret `VITE_ZEGOCLOUD_APP_ID` is set to `128222087`
- [ ] New deployment has been triggered after adding secret
- [ ] Browser cache has been cleared
- [ ] Service worker has been unregistered
- [ ] Page has been hard refreshed

## Still Not Working?

If buttons are still greyed out after all steps:

1. **Check the console** for the exact error message
2. **Verify the secret** is spelled correctly: `VITE_ZEGOCLOUD_APP_ID` (case-sensitive)
3. **Check deployment logs** in GitHub Actions for any build errors
4. **Try in incognito/private mode** to rule out cache issues
5. **Check network tab** to see if the built files are loading correctly

## Expected Behavior

Once working:
- ✅ Call buttons should be **enabled** (not greyed out)
- ✅ Console should show: "✅ ZEGOCLOUD App ID found: 128222087"
- ✅ Clicking call buttons should prompt for camera/microphone permissions
- ✅ Call modal should appear when starting a call

## Common Issues

### Issue: Secret added but buttons still greyed out
**Solution**: You need to trigger a new deployment after adding the secret. The old build doesn't have the variable.

### Issue: Works locally but not on Firebase
**Solution**: Local `.env` file doesn't affect Firebase. You must add it as a GitHub Secret.

### Issue: Console shows "undefined"
**Solution**: The environment variable isn't being passed to the build. Check GitHub Secrets and workflow file.

