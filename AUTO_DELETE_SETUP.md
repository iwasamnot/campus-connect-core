# Automatic File Deletion After 24 Hours

This guide shows you how to automatically delete files older than 24 hours from Firebase Storage to stay within the free tier.

## Why Delete After 24 Hours?

- **Conserves storage** - Prevents accumulation of old files
- **Stays within free tier** - 5GB storage limit
- **Reduces costs** - Prevents exceeding free tier
- **Keeps storage clean** - Only recent files are kept

## Option 1: GitHub Actions (Recommended - FREE)

This runs automatically daily via GitHub Actions (completely free).

### Setup:

1. **The workflow is already created**: `.github/workflows/cleanup-storage.yml`
2. **It runs automatically** every day at midnight UTC
3. **No additional setup needed** - it uses your existing service account

### How It Works:

- Runs daily at midnight UTC
- Checks all storage folders: `messages/`, `profile-pictures/`, `group-files/`, `private-chat-files/`
- Deletes files older than 24 hours
- Logs results to console

### Manual Trigger:

You can also trigger it manually:
1. Go to GitHub → Actions tab
2. Select "Cleanup Old Storage Files"
3. Click "Run workflow"

## Option 2: Cloud Function (Automatic)

Requires Firebase Functions (needs Blaze plan, which you already have).

### Setup:

1. **Install dependencies**:
   ```bash
   cd functions
   npm install
   ```

2. **Deploy the function**:
   ```bash
   firebase deploy --only functions:deleteOldFiles
   ```

3. **The function runs automatically** daily at midnight UTC

### How It Works:

- Cloud Function with scheduled trigger
- Runs daily at midnight UTC
- Deletes files older than 24 hours
- Logs to Firestore `auditLogs` collection

## Option 3: Manual Script (Run When Needed)

Run the script manually when you want to clean up.

### Setup:

1. **Create service account key**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Save as `serviceAccountKey.json` in project root
   - **Add to .gitignore** (don't commit this file!)

2. **Install dependencies**:
   ```bash
   npm install firebase-admin
   ```

3. **Run the script**:
   ```bash
   node scripts/deleteOldStorageFiles.js
   ```

### Add to package.json:

```json
{
  "scripts": {
    "cleanup-storage": "node scripts/deleteOldStorageFiles.js"
  }
}
```

Then run: `npm run cleanup-storage`

## Which Option to Choose?

### Recommended: GitHub Actions (Option 1)
- ✅ Completely free
- ✅ Automatic (runs daily)
- ✅ No additional setup needed
- ✅ Already configured

### Alternative: Cloud Function (Option 2)
- ✅ Automatic (runs daily)
- ✅ More reliable (runs on Firebase infrastructure)
- ⚠️ Requires deploying functions
- ⚠️ Uses some Firebase Functions quota (but free tier includes 2 million invocations/month)

### Manual: Script (Option 3)
- ✅ Full control
- ✅ Run when you want
- ⚠️ Requires manual execution
- ⚠️ Need to remember to run it

## What Gets Deleted?

Files older than 24 hours in these folders:
- `messages/` - Campus chat files
- `profile-pictures/` - User profile pictures
- `group-files/` - Group chat files
- `private-chat-files/` - Private chat files

## What Stays?

- Files uploaded within the last 24 hours
- Files that are actively being used
- Recent uploads

## Monitoring

### Check Deletion Logs:

1. **GitHub Actions**:
   - Go to Actions tab
   - Check "Cleanup Old Storage Files" workflow
   - See logs for deleted files

2. **Cloud Function**:
   - Go to Firebase Console → Functions
   - Check logs for `deleteOldFiles`
   - Or check Firestore `auditLogs` collection

3. **Manual Script**:
   - Check console output
   - Or check Firestore `auditLogs` collection

## Adjusting the Time Period

To change from 24 hours to a different period:

### GitHub Actions:
Edit `.github/workflows/cleanup-storage.yml`:
```javascript
const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000); // Change 24 to your desired hours
```

### Cloud Function:
Edit `functions/deleteOldFiles.js`:
```javascript
const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000); // Change 24 to your desired hours
```

### Manual Script:
Edit `scripts/deleteOldStorageFiles.js`:
```javascript
const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000); // Change 24 to your desired hours
```

## Excluding Profile Pictures

If you want to keep profile pictures longer (e.g., 30 days), you can modify the scripts to exclude that folder or use a different time period for it.

## Testing

### Test GitHub Actions:
1. Go to Actions tab
2. Click "Run workflow" manually
3. Check the logs

### Test Cloud Function:
```bash
firebase functions:shell
deleteOldFiles()
```

### Test Manual Script:
```bash
node scripts/deleteOldStorageFiles.js
```

## Troubleshooting

### Error: "Permission denied"
- Make sure service account has Storage Admin role
- See `ROLES_SETUP_GUIDE.md`

### Error: "Function not found"
- Deploy the function: `firebase deploy --only functions:deleteOldFiles`

### Files not deleting
- Check file creation dates
- Verify the time calculation (24 hours = 86,400,000 milliseconds)
- Check logs for errors

## Direct Links

- **GitHub Actions**: https://github.com/YOUR_USERNAME/campus-connect-core/actions
- **Firebase Functions**: https://console.firebase.google.com/project/campus-connect-sistc/functions
- **Storage Console**: https://console.firebase.google.com/project/campus-connect-sistc/storage

## Summary

**Recommended Setup**: Use GitHub Actions (Option 1) - it's already configured and runs automatically daily. No additional setup needed!

The workflow will:
- Run daily at midnight UTC
- Delete files older than 24 hours
- Keep your storage within free tier limits
- Log all deletions

