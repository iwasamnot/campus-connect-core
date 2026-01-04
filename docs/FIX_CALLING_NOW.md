# 🚨 FIX CALLING FEATURE NOW - Step by Step

## The Problem
Your console shows:
```
⚠️ ZEGOCLOUD App ID not found
Current value: undefined
All env vars starting with VITE_ZEGOCLOUD: Array(0)
```

This means the GitHub Secret is **NOT set** or the deployment didn't include it.

## ✅ SOLUTION (Do This Now)

### Step 1: Add GitHub Secret (2 minutes)

1. **Open this link**: https://github.com/iwasamnot/campus-connect-core/settings/secrets/actions

2. **Check if `VITE_ZEGOCLOUD_APP_ID` exists** in the list

3. **If it's MISSING:**
   - Click **"New repository secret"** button (top right)
   - **Name**: `VITE_ZEGOCLOUD_APP_ID` (copy exactly, case-sensitive)
   - **Value**: `128222087` (just the number, no quotes)
   - Click **"Add secret"**

4. **If it EXISTS:**
   - Click on it to edit
   - Verify the value is exactly `128222087`
   - If wrong, update it and save

### Step 2: Trigger New Deployment (3 minutes)

**IMPORTANT**: After adding/updating the secret, you MUST trigger a new deployment!

1. **Open this link**: https://github.com/iwasamnot/campus-connect-core/actions

2. Click **"Deploy to Firebase Hosting on merge"** workflow

3. Click **"Run workflow"** button (top right, next to "Filter" button)

4. Click **"Run workflow"** again in the dropdown

5. **Wait for deployment** (usually 2-5 minutes)

### Step 3: Verify Secret Was Used (Check Logs)

While deployment is running:

1. Click on the **running workflow** (orange/yellow dot)

2. Click on **"build_and_deploy"** job

3. Scroll down to find **"Verify ZEGOCLOUD App ID"** step

4. **You should see:**
   ```
   ✅ VITE_ZEGOCLOUD_APP_ID secret is set (value hidden for security)
   ```

5. **If you see:**
   ```
   ⚠️ WARNING: VITE_ZEGOCLOUD_APP_ID secret is not set!
   ```
   → The secret wasn't added correctly. Go back to Step 1.

### Step 4: Clear Cache & Test (1 minute)

After deployment completes (green checkmark):

1. **Go to your Firebase site**

2. **Hard refresh**: 
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

3. **Or clear service worker**:
   - Press `F12` → Application tab → Service Workers
   - Click **"Unregister"**
   - Refresh page

4. **Check console** (F12 → Console tab):
   - Should see: `✅ ZEGOCLOUD App ID found: 128222087`
   - Buttons should be **enabled** (not greyed out)

## 🎯 Quick Links

- **Add Secret**: https://github.com/iwasamnot/campus-connect-core/settings/secrets/actions
- **Trigger Deployment**: https://github.com/iwasamnot/campus-connect-core/actions
- **Check Workflow**: https://github.com/iwasamnot/campus-connect-core/actions/workflows/firebase-hosting-merge.yml

## ⏱️ Total Time: ~5-7 minutes

1. Add secret: 2 min
2. Trigger deployment: 1 min
3. Wait for deployment: 2-5 min
4. Clear cache & test: 1 min

## ✅ Success Indicators

After completing all steps:

- ✅ Console shows: `✅ ZEGOCLOUD App ID found: 128222087`
- ✅ Call buttons are **enabled** (not greyed out)
- ✅ No more "ZEGOCLOUD App ID not found" warnings
- ✅ Clicking buttons prompts for camera/microphone

## ❌ If Still Not Working

1. **Check deployment logs** - Did verification step pass?
2. **Verify secret name** - Must be exactly `VITE_ZEGOCLOUD_APP_ID` (case-sensitive)
3. **Check deployment time** - Was it deployed AFTER you added the secret?
4. **Try incognito mode** - Rules out cache issues
5. **Check browser console** - What exact error do you see?

## 📝 Notes

- The secret must be added **BEFORE** triggering deployment
- Each deployment takes 2-5 minutes
- Old deployments don't have the variable - you need a NEW one
- The verification step in logs will confirm if secret is set

