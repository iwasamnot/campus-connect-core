# GitHub Actions Setup Guide

This guide explains how to set up GitHub Actions for automatic deployment to Firebase.

## Required Service Account Permissions

The Firebase service account used in GitHub Actions needs the following IAM roles:

### Minimum Required Roles:
1. **Firebase Admin** (`roles/firebase.admin`) - For deploying Firestore rules, Storage rules, and Hosting
2. **Service Usage Admin** (`roles/serviceusage.serviceUsageAdmin`) - For enabling Firebase APIs (if not already enabled)
3. **Storage Admin** (`roles/storage.admin`) - For deploying Storage rules

### Recommended Roles (for full functionality):
- **Firebase Admin**
- **Service Usage Admin**
- **Storage Admin**
- **Firestore Admin** (optional, included in Firebase Admin)

## Setting Up Service Account Permissions

### Method 1: Using Firebase Console (Easiest)

1. Go to [Firebase Console Service Accounts](https://console.firebase.google.com/project/campus-connect-sistc/settings/serviceaccounts/adminsdk)
2. You'll see your service account email listed
3. Copy the email address
4. Click on the email or go to: https://console.cloud.google.com/iam-admin/iam?project=campus-connect-sistc
5. Find your service account in the list
6. Click **Edit** (pencil icon)
7. Click **Add Another Role**
8. Add these roles one by one:
   - `Firebase Admin` (or search for `roles/firebase.admin`)
   - `Service Usage Admin` (or search for `roles/serviceusage.serviceUsageAdmin`)
   - `Storage Admin` (or search for `roles/storage.admin`)
9. Click **Save**

### Method 2: Direct IAM Link

1. Go directly to: https://console.cloud.google.com/iam-admin/iam?project=campus-connect-sistc
2. Find your service account (usually ends with `@appspot.gserviceaccount.com`)
3. Click **Edit** (pencil icon)
4. Add the three roles mentioned above
5. Click **Save**

### Method 3: Using gcloud CLI

See `ROLES_SETUP_GUIDE.md` for gcloud CLI commands.

**Note**: See `ROLES_SETUP_GUIDE.md` for detailed step-by-step instructions with screenshots guidance.

## Alternative: Use Firebase CLI to Grant Permissions

If you have Firebase CLI installed locally:

```bash
# Grant Firebase Admin role
gcloud projects add-iam-policy-binding campus-connect-sistc \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT_EMAIL" \
  --role="roles/firebase.admin"

# Grant Service Usage Admin role
gcloud projects add-iam-policy-binding campus-connect-sistc \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT_EMAIL" \
  --role="roles/serviceusage.serviceUsageAdmin"

# Grant Storage Admin role
gcloud projects add-iam-policy-binding campus-connect-sistc \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT_EMAIL" \
  --role="roles/storage.admin"
```

## Getting Service Account JSON

**You don't need Cloud Console access for this!** Use Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/project/campus-connect-sistc)
   - Direct link: https://console.firebase.google.com/project/campus-connect-sistc/settings/serviceaccounts/adminsdk
2. You should see **Service Accounts** section
3. Click **Generate new private key**
4. A JSON file will download automatically
5. Open the JSON file and copy the entire content
6. Add it to GitHub Secrets as `FIREBASE_SERVICE_ACCOUNT_CAMPUS_CONNECT_SISTC`

**Note**: If you can't see Service Accounts, make sure you're logged in with the account that owns the project or has admin access.

## GitHub Secrets Required

Add these secrets in your GitHub repository:

### Firebase Secrets (Required)
- `FIREBASE_SERVICE_ACCOUNT_CAMPUS_CONNECT_SISTC` - Service account JSON (required)
- `VITE_FIREBASE_API_KEY` - Firebase API key (for build)
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain (for build)
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID (for build)
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket (for build)
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID (for build)
- `VITE_FIREBASE_APP_ID` - Firebase app ID (for build)
- `VITE_FIREBASE_MEASUREMENT_ID` - Firebase measurement ID (optional, for build)

### Cloudinary Secrets (For Storage Fallback)
- `VITE_CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name (e.g., `dngk8azjq`)
- `VITE_CLOUDINARY_UPLOAD_PRESET` - Cloudinary upload preset name (e.g., `CAMPUSCONNECT`)
- `VITE_STORAGE_PROVIDER` - Storage provider preference: `auto`, `firebase`, or `cloudinary` (default: `auto`)

### Other API Keys
- `VITE_GEMINI_API_KEY` - Gemini API key (for AI features)
- `VITE_OPENAI_API_KEY` - OpenAI API key (optional)
- `VITE_ZEGOCLOUD_APP_ID` - ZEGOCLOUD App ID (for voice/video calling features)

## Troubleshooting

### Error: Permission denied to get service [firestore.googleapis.com]

**Solution**: Grant the **Service Usage Admin** role to your service account.

### Error: Failed to authenticate

**Solution**: 
1. Verify the service account JSON is correctly added to GitHub Secrets
2. Ensure the JSON is valid (no extra characters, proper formatting)
3. Check that the service account has the required permissions

### Error: ChannelID is currently required

**Solution**: This is fixed in the PR workflow - each PR gets a unique channel ID.

## Workflow Behavior

- **On push to master**: Deploys Firestore rules, Storage rules, and Hosting
- **On pull request**: Creates a preview channel for the PR
- **On workflow_dispatch**: Allows manual triggering

## Notes

- If Firestore/Storage APIs are already enabled, the deployment will proceed even if the service account doesn't have Service Usage Admin role
- The workflow uses `continue-on-error: true` for rules deployment to prevent blocking hosting deployment
- All deployments are logged in the GitHub Actions tab

