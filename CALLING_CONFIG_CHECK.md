# Calling Configuration Check

## Quick Check

If you see "Calling unavailable - Check configuration" or the call buttons are disabled/greyed out, follow these steps:

## Step 1: Check Environment Variable

1. Open your `.env` file in the project root
2. Look for this line:
   ```
   VITE_ZEGOCLOUD_APP_ID=your-app-id-here
   ```

## Step 2: Get Your ZEGOCLOUD App ID

1. Go to https://console.zegocloud.com
2. Sign in to your account
3. Navigate to your project (or create a new one)
4. Go to **Project Configuration** → **Basic Information**
5. Copy the **AppID** (it's a number like `128222087`)

## Step 3: Add to .env File

1. Open `.env` file
2. Add or update this line:
   ```
   VITE_ZEGOCLOUD_APP_ID=128222087
   ```
   (Replace `128222087` with your actual App ID)

## Step 4: Restart Development Server

**IMPORTANT**: After adding/updating environment variables, you MUST restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 5: Verify

1. Refresh your browser
2. Go to Private Chat
3. Select a user
4. The call buttons should now be enabled (not greyed out)

## Troubleshooting

### Buttons still disabled after adding App ID
- ✅ Make sure you restarted the dev server
- ✅ Check that the variable name is exactly `VITE_ZEGOCLOUD_APP_ID` (case-sensitive)
- ✅ Check that there are no spaces around the `=` sign
- ✅ Check browser console for any error messages

### "Calling service unavailable" error
- Check browser console for detailed error messages
- Verify your App ID is correct
- Make sure you're using a valid ZEGOCLOUD App ID

### Still having issues?
See `ZEGOCLOUD_SETUP.md` for detailed setup instructions.








