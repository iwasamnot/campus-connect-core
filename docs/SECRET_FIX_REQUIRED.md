# ⚠️ CRITICAL: Secret is Duplicated - Fix Required

## Problem Found

When checking the stored secret, it's **DUPLICATED** (128 characters instead of 64):

**Current (WRONG)**: `ab0135234ba26d4007676715194f243f0248214f6e04e35e21369cf342e1f556ab0135234ba26d4007676715194f243f0248214f6e04e35e21369cf342e1f556`

**Should be (CORRECT)**: `ab0135234ba26d4007676715194f243f0248214f6e04e35e21369cf342e1f556`

This is why VideoSDK is rejecting the tokens with 401 errors - the signature is being calculated with the wrong secret!

## Fix Steps

### Step 1: Re-set the Secret

Run this command and paste ONLY the 64-character secret:

```powershell
firebase functions:secrets:set VIDEOSDK_SECRET
```

When prompted, paste **ONLY THIS** (64 characters, no quotes, no spaces):
```
ab0135234ba26d4007676715194f243f0248214f6e04e35e21369cf342e1f556
```

**IMPORTANT**: 
- Do NOT paste it twice
- Do NOT include quotes
- Do NOT include the "ab013523..." part twice
- Just the single 64-character string

### Step 2: Verify the Secret

After setting it, verify it's correct:

```powershell
firebase functions:secrets:access VIDEOSDK_SECRET
```

It should output exactly 64 characters:
```
ab0135234ba26d4007676715194f243f0248214f6e04e35e21369cf342e1f556
```

If it shows 128 characters (duplicated), repeat Step 1.

### Step 3: Redeploy the Function

After the secret is fixed:

```powershell
firebase deploy --only functions:getVideoSDKToken
```

### Step 4: Test Again

Try making a call - the 401 error should be resolved!

## Why This Happened

The secret was likely pasted twice when first setting it, or the clipboard had the value duplicated. This is a common mistake when copying/pasting secrets.

