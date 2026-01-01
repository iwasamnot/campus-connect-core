# Quick Fix: Calling Buttons Greyed Out

## ⚡ Quick Checklist (Do These First!)

### Step 1: Check GitHub Secret (MOST IMPORTANT)

1. Go to: **https://github.com/iwasamnot/campus-connect-core/settings/secrets/actions**
2. Look for `VITE_ZEGOCLOUD_APP_ID` in the list
3. **If it's MISSING:**
   - Click **"New repository secret"**
   - Name: `VITE_ZEGOCLOUD_APP_ID` (exactly this, case-sensitive)
   - Value: `128222087`
   - Click **"Add secret"**

### Step 2: Trigger New Deployment

**After adding the secret**, you MUST trigger a new deployment:

1. Go to: **https://github.com/iwasamnot/campus-connect-core/actions**
2. Click **"Deploy to Firebase Hosting on merge"**
3. Click **"Run workflow"** button (top right)
4. Click **"Run workflow"** again in the dropdown
5. Wait 2-5 minutes for deployment to complete

### Step 3: Check Deployment Logs

While deployment is running:

1. Click on the running workflow
2. Click on **"build_and_deploy"** job
3. Look for **"Verify ZEGOCLOUD App ID"** step
4. You should see: **"✅ VITE_ZEGOCLOUD_APP_ID secret is set"**

If you see **"⚠️ WARNING: VITE_ZEGOCLOUD_APP_ID secret is not set!"**, the secret wasn't added correctly.

### Step 4: Clear Browser Cache

After deployment completes:

1. **Hard Refresh**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Or **Clear Service Worker**:
   - Open DevTools (F12)
   - Application → Service Workers → Click "Unregister"
   - Refresh page

### Step 5: Check Browser Console

1. Open your Firebase-hosted site
2. Press **F12** → Go to **Console** tab
3. Look for these messages:

**✅ SUCCESS:**
```
✅ ZEGOCLOUD App ID found: 128222087
✅ Calling feature is available
```

**❌ FAILURE:**
```
⚠️ ZEGOCLOUD App ID not found
Current value: undefined
```

## Common Issues

### Issue: Secret added but buttons still greyed out
**Cause**: Old deployment is still active  
**Fix**: Trigger new deployment (Step 2 above)

### Issue: Console shows "undefined"
**Cause**: Secret not set or deployment didn't pick it up  
**Fix**: 
1. Verify secret exists in GitHub
2. Check deployment logs for verification step
3. Trigger new deployment

### Issue: Works locally but not on Firebase
**Cause**: Local `.env` doesn't affect Firebase  
**Fix**: Must add as GitHub Secret (Step 1)

## Verification Commands

### Check if Secret is Set (GitHub CLI)
```bash
gh secret list
```
Should show `VITE_ZEGOCLOUD_APP_ID` in the list.

### Check Deployment Status
1. Go to Actions tab
2. Latest workflow should show ✅ green checkmark
3. Click on it → Check "Verify ZEGOCLOUD App ID" step

## Still Not Working?

1. **Check the browser console** - What exact message do you see?
2. **Check GitHub Actions logs** - What does the verification step say?
3. **Verify secret spelling** - Must be exactly `VITE_ZEGOCLOUD_APP_ID`
4. **Check deployment time** - Was it deployed AFTER you added the secret?

## Expected Result

Once fixed:
- ✅ Buttons are **enabled** (not greyed out)
- ✅ Console shows: "✅ ZEGOCLOUD App ID found: 128222087"
- ✅ Clicking buttons prompts for camera/microphone permissions
- ✅ Call modal appears when starting a call

