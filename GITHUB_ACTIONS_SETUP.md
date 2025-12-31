# GitHub Actions Setup Guide

This guide explains how to set up GitHub Actions for automatic deployment to Firebase.

## Required Service Account Permissions

The Firebase service account used in GitHub Actions needs the following IAM roles:

### Minimum Required Roles:
1. **Firebase Admin** - For deploying Firestore rules, Storage rules, and Hosting
2. **Service Usage Admin** - For enabling Firebase APIs (if not already enabled)
3. **Storage Admin** - For deploying Storage rules

### Recommended Roles (for full functionality):
- **Firebase Admin**
- **Service Usage Admin**
- **Storage Admin**
- **Firestore Admin**

## Setting Up Service Account Permissions

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `campus-connect-sistc`
3. Navigate to **IAM & Admin** → **IAM**
4. Find your service account (or create one if needed)
5. Click **Edit** (pencil icon)
6. Add the following roles:
   - **Firebase Admin**
   - **Service Usage Admin**
   - **Storage Admin**
7. Click **Save**

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

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `campus-connect-sistc`
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate new private key**
5. Download the JSON file
6. Copy the entire JSON content
7. Add it to GitHub Secrets as `FIREBASE_SERVICE_ACCOUNT_CAMPUS_CONNECT_SISTC`

## GitHub Secrets Required

Add these secrets in your GitHub repository:
- `FIREBASE_SERVICE_ACCOUNT_CAMPUS_CONNECT_SISTC` - Service account JSON (required)
- `VITE_FIREBASE_API_KEY` - Firebase API key (for build)
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain (for build)
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID (for build)
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket (for build)
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID (for build)
- `VITE_FIREBASE_APP_ID` - Firebase app ID (for build)
- `VITE_FIREBASE_MEASUREMENT_ID` - Firebase measurement ID (optional, for build)
- `VITE_GEMINI_API_KEY` - Gemini API key (for AI features)
- `VITE_OPENAI_API_KEY` - OpenAI API key (optional)

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

