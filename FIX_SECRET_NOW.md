# Fix VideoSDK Secret - Immediate Action Required

## Problem Confirmed
The secret is duplicated (128 characters instead of 64). This causes VideoSDK to reject tokens with 401 errors.

## Solution: Re-set the Secret

### Step 1: Set the Secret Correctly

Run this command in PowerShell:

```powershell
firebase functions:secrets:set VIDEOSDK_SECRET
```

When prompted, paste **ONLY** this (64 characters):
```
ab0135234ba26d4007676715194f243f0248214f6e04e35e21369cf342e1f556
```

**CRITICAL**: 
- Copy ONLY the 64-character string above
- Do NOT paste it twice
- Do NOT include quotes
- Just the single line: `ab0135234ba26d4007676715194f243f0248214f6e04e35e21369cf342e1f556`

### Step 2: Verify It's Fixed

After setting it, verify:

```powershell
firebase functions:secrets:access VIDEOSDK_SECRET
```

You should see exactly 64 characters:
```
ab0135234ba26d4007676715194f243f0248214f6e04e35e21369cf342e1f556
```

If it's still 128 characters (duplicated), the paste didn't work correctly - try Step 1 again.

### Step 3: Redeploy Function

After the secret is correct:

```powershell
firebase deploy --only functions:getVideoSDKToken
```

### Step 4: Test

Try making a call - the 401 error should be resolved!

---

## Quick Copy-Paste Secret Value

Here's the secret value (64 characters) - copy this entire line:

```
ab0135234ba26d4007676715194f243f0248214f6e04e35e21369cf342e1f556
```

