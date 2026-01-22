# Fix: Secret Manager Permission Error During Deployment

## Problem
Deployment fails with:
```
Error: Permission 'secretmanager.secrets.get' denied for resource 'projects/***/secrets/GCP_SERVICE_ACCOUNT_KEY'
```

## Root Cause
The Firebase service account used by GitHub Actions doesn't have Secret Manager permissions to read the secret during deployment validation.

## Solution: Grant Secret Manager Permissions

### Option 1: Grant Permission via Google Cloud Console (Recommended)

1. Go to [Google Cloud Console IAM](https://console.cloud.google.com/iam-admin/iam?project=campus-connect-sistc)
2. Find the service account: `campus-connect-sistc@appspot.gserviceaccount.com` (or the one used by GitHub Actions)
3. Click the **Edit** (pencil) icon
4. Click **"Add Another Role"**
5. Add role: **"Secret Manager Secret Accessor"** (`roles/secretmanager.secretAccessor`)
6. Click **"Save"**

### Option 2: Grant Permission via gcloud CLI

```bash
# Grant Secret Manager Secret Accessor role to the default compute service account
gcloud projects add-iam-policy-binding campus-connect-sistc \
  --member="serviceAccount:campus-connect-sistc@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Option 3: Use a Different Service Account

If you're using a custom service account for GitHub Actions:

1. Go to [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=campus-connect-sistc)
2. Find your GitHub Actions service account
3. Grant it the **"Secret Manager Secret Accessor"** role

## Verify the Secret Exists

Before deploying, make sure the secret exists:

```bash
# Check if secret exists (won't show value)
firebase functions:secrets:access GCP_SERVICE_ACCOUNT_KEY --project campus-connect-sistc
```

If it doesn't exist, create it:

```bash
# Set the secret (paste JSON when prompted)
firebase functions:secrets:set GCP_SERVICE_ACCOUNT_KEY --project campus-connect-sistc
```

## After Fixing Permissions

Once permissions are granted, the deployment should succeed:

```bash
firebase deploy --only functions:generateVertexAIResponse --project campus-connect-sistc
```

## Alternative: Deploy Without Secret Validation

If you can't grant permissions immediately, you can temporarily comment out the secret requirement in the function code, deploy, then uncomment and set the secret manually. However, this is not recommended for production.
