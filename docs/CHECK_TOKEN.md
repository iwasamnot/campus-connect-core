# Check VideoSDK Token - Debugging 401 Error

Since you're still getting 401 errors, let's verify the token is correct.

## Step 1: Check Function Logs

The function logs the token payload. Run:

```powershell
firebase functions:log
```

Look for lines with "Token payload:" - this will show you the exact payload structure.

## Step 2: Verify Token on jwt.io

1. Copy a token from the function logs (or from browser Network tab)
2. Go to https://jwt.io
3. Paste token in "Encoded" box
4. Verify:
   - **Payload** contains:
     - `apikey`: `"0cd81014-abab-4f45-968d-b3ddae835a82"` (must match exactly)
     - `version`: `2` (number, not string)
     - `iat`: current timestamp (number)
     - `exp`: future timestamp (number)
     - `jti`: UUID string
     - `permissions`: `["allow_join","allow_mod"]`
   - **Verify Signature** section:
     - Paste your secret: `ab0135234ba26d4007676715194f243f0248214f6e04e35e21369cf342e1f556`
     - Should say "Signature Verified" (green)
     - If it says "Invalid Signature" (red), the secret in Firebase is wrong

## Step 3: Re-verify Secret is Set Correctly

The secret MUST be exactly 64 hex characters, no quotes, no spaces:

```powershell
firebase functions:secrets:set VIDEOSDK_SECRET
# When prompted, paste exactly this (NO quotes):
ab0135234ba26d4007676715194f243f0248214f6e04e35e21369cf342e1f556
```

Then redeploy:
```powershell
firebase deploy --only functions:getVideoSDKToken
```

## Step 4: Check VideoSDK Dashboard

1. Go to your VideoSDK dashboard
2. Verify:
   - API Key matches: `0cd81014-abab-4f45-968d-b3ddae835a82`
   - Server Secret matches (first 10 chars should be: `ab0135234b`)
   - Account is active/not expired

## Common Issues

### Secret has quotes/spaces
- If secret length in logs shows 66+ characters, it has extra quotes
- Re-set the secret WITHOUT quotes

### API Key mismatch
- Verify API key in VideoSDK dashboard matches exactly
- Case-sensitive, hyphens must match

### Token expires too quickly
- Check `exp` value in token - should be 24 hours from `iat`
- Current code sets: `exp: now + (24 * 60 * 60)`

### Version is string instead of number
- In payload, `version` should be `2` (number), not `"2"` (string)
- Current code uses: `version: 2` ✓

