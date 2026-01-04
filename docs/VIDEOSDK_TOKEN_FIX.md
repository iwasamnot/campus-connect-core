# VideoSDK Token 401 Error Fix

## Problem
Getting `401 (Unauthorized)` error from VideoSDK's `init-config` endpoint, indicating the token is being rejected.

## Solution Applied
Updated token generation to include all required fields for VideoSDK Version 2 tokens:

1. ✅ Added `uuid` package for generating unique JWT IDs
2. ✅ Added explicit `iat` (issued at) timestamp
3. ✅ Added explicit `exp` (expires) timestamp
4. ✅ Added `jti` (JWT ID) using uuid
5. ✅ Ensured `version: 2` is in payload
6. ✅ Removed `roles` field (not in VideoSDK v2 spec)
7. ✅ Removed `expiresIn` option (using explicit `iat`/`exp` instead)

## Updated Token Payload Structure

```javascript
{
  apikey: "0cd81014-abab-4f45-968d-b3ddae835a82",
  permissions: ["allow_join", "allow_mod"],
  version: 2,
  iat: 1234567890, // Current time in seconds
  exp: 1234654290, // Current time + 24 hours in seconds
  jti: "unique-uuid-here" // Generated UUID
}
```

## Deployment Steps

1. **Install uuid package** (already done):
   ```bash
   cd functions
   npm install uuid
   ```

2. **Deploy the updated function**:
   ```powershell
   firebase deploy --only functions:getVideoSDKToken
   ```

3. **Verify the token**:
   - Make a call in your app
   - Check function logs: `firebase functions:log --only getVideoSDKToken`
   - Look for "Token payload" in logs
   - Copy the token and verify on [jwt.io](https://jwt.io)

## Manual Token Verification

1. Get a token from function logs
2. Go to [jwt.io](https://jwt.io)
3. Paste token in "Encoded" box
4. Verify payload contains:
   - `apikey`: `0cd81014-abab-4f45-968d-b3ddae835a82`
   - `version`: `2`
   - `iat`: current timestamp
   - `exp`: future timestamp
   - `jti`: UUID string
5. In "Verify Signature" section:
   - Enter your Server Secret: `ab0135234ba26d4007676715194f243f0248214f6e04e35e21369cf342e1f556`
   - Should show "Signature Verified"

## Common Issues

### Still getting 401?
- **Check Secret**: Ensure `VIDEOSDK_SECRET` is set correctly (no quotes, no spaces)
- **Verify API Key**: Must match exactly `0cd81014-abab-4f45-968d-b3ddae835a82`
- **Check Permissions**: Must be exactly `["allow_join", "allow_mod"]`
- **Verify Version**: Must be `2` (number, not string)

### Token signature invalid?
- Re-set the secret: `firebase functions:secrets:set VIDEOSDK_SECRET`
- Paste secret WITHOUT quotes: `ab0135234ba26d4007676715194f243f0248214f6e04e35e21369cf342e1f556`
- Redeploy function after setting secret

### Meeting ID issues?
- Ensure meetingId is a valid string (not null/undefined)
- VideoSDK requires valid meeting IDs for token validation

