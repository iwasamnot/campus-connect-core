# Enable Firebase Storage

Your project needs Firebase Storage to be enabled before deploying storage rules.

## Quick Setup

### Step 1: Enable Firebase Storage

1. Go to Firebase Console: https://console.firebase.google.com/project/campus-connect-sistc/storage
2. Click **Get Started** button
3. You'll see a setup wizard with these options:

### Step 2: Choose Storage Location

1. **Start in test mode** (recommended for initial setup)
   - This allows read/write access for authenticated users
   - You can update rules later
   - Click **Next**

2. **Choose a location** for your storage bucket:
   - Select a location close to your users (e.g., `us-central1`, `us-east1`, etc.)
   - Click **Done**

### Step 3: Verify Storage is Enabled

1. You should see the Storage dashboard
2. You'll see an empty storage bucket
3. The storage is now ready to use

## After Enabling Storage

Once Storage is enabled:
1. Your GitHub Actions workflow will be able to deploy storage rules
2. File uploads in your app will work
3. You can manage files in Firebase Console

## Storage Rules

After enabling Storage, your storage rules will be automatically deployed via GitHub Actions. The rules allow:
- Authenticated users to upload files (10MB limit for messages, 5MB for profile pictures)
- All authenticated users to read files
- Admins to delete files

## Troubleshooting

### Error: "Firebase Storage has not been set up"
**Solution**: Follow Step 1 above to enable Storage

### Error: "Permission denied"
**Solution**: Make sure you're logged in with the account that owns the project

### Error: "Storage location not available"
**Solution**: Choose a different location or contact Firebase support

## Direct Links

- **Storage Console**: https://console.firebase.google.com/project/campus-connect-sistc/storage
- **Storage Rules**: Will be deployed automatically after Storage is enabled

