# CORS Fix for VideoSDK Firebase Function

## Important Note

Firebase Functions v2 `onCall` functions handle CORS automatically. The CORS configuration in the function code may not be necessary, but the **Cloud Run Invoker permissions** are **CRITICAL**.

## Steps to Fix CORS Errors

### Step 1: Grant Cloud Run Invoker Permissions (REQUIRED)

This is the **most important step** for resolving CORS/access errors with Firebase 2nd Gen functions:

1. Go to [Google Cloud Console - Cloud Run](https://console.cloud.google.com/run)
2. Select your project: **campus-connect-sistc**
3. Find the service: **`getvideosdktoken`** (or similar name)
4. Click on the service name
5. Go to the **Permissions** tab (or **Security** tab)
6. Click **Add Principal**
7. In the "New principals" field, type: **`allUsers`**
8. In the "Select a role" dropdown, choose: **Cloud Run Invoker**
9. Click **Save**

**Why this is needed:** Firebase 2nd Gen functions run on Cloud Run, which requires explicit permission for browser calls. Without this permission, requests are blocked before reaching your function code.

### Step 2: Verify Function Configuration

The function is configured with:
- **Region**: `us-central1` (matches `firebaseConfig.js`)
- **Secret**: `VIDEOSDK_SECRET` (must be set in Secret Manager)
- **CORS**: Included in config (though `onCall` functions handle CORS automatically)

### Step 3: Set the Secret (if not done)

```powershell
firebase functions:secrets:set VIDEOSDK_SECRET
```

Paste: `ab0135234ba26d4007676715194f243f0248214f6e04e35e21369cf342e1f556`

### Step 4: Deploy the Function

```powershell
firebase deploy --only functions:getVideoSDKToken
```

### Step 5: Verify Deployment

Check function logs:
```powershell
firebase functions:log --only getVideoSDKToken
```

## Troubleshooting

### Error: "Internal" or CORS errors

1. **Check Cloud Run Invoker permissions** (Step 1 above) - This is usually the issue
2. Verify the function is deployed: `firebase functions:list`
3. Check function logs for errors
4. Verify the secret is set: Check logs for "VIDEOSDK_SECRET Configuration Error"

### Error: Function not found

- Verify deployment succeeded
- Check function name matches: `getVideoSDKToken`
- Ensure region matches: `us-central1`

### Error: Permission denied

- Cloud Run Invoker permissions not set (see Step 1)
- User not authenticated (function requires authentication)

## Testing

1. Open your app in the browser
2. Open browser DevTools → Network tab
3. Try making a call
4. Look for requests to `getVideoSDKToken`
5. Check the response - should be 200 OK, not CORS error

## Additional Notes

- The `cors` option in the function config may not be necessary for `onCall` functions (they handle CORS automatically)
- However, it doesn't hurt to include it
- The main fix is the **Cloud Run Invoker permissions** (Step 1)

