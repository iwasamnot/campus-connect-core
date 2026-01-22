# Setting Up Vertex AI Secret in Firebase

## Problem
The Cloud Function `generateVertexAIResponse` requires the `GCP_SERVICE_ACCOUNT_KEY` secret to be set in Firebase Secret Manager before deployment.

## Solution: Manual Setup (Required First Time)

Since the GitHub Actions workflow may not have permission to create secrets, you need to set it manually first:

### Option 1: Using Firebase CLI (Recommended)

```bash
# 1. Make sure you're authenticated
firebase login

# 2. Set the secret (paste your JSON when prompted)
firebase functions:secrets:set GCP_SERVICE_ACCOUNT_KEY --project campus-connect-sistc

# When prompted, paste your service account JSON (from GitHub Secret: GCP_SERVICE_ACCOUNT_KEY)
```

### Option 2: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/campus-connect-sistc/functions)
2. Navigate to **Functions** → **Secrets** tab
3. Click **"Add Secret"**
4. **Name**: `GCP_SERVICE_ACCOUNT_KEY`
5. **Value**: Paste your service account JSON (from GitHub Secrets)
6. Click **"Save"**

### Option 3: Using gcloud CLI

```bash
# Set the secret using gcloud
echo 'YOUR_SERVICE_ACCOUNT_JSON' | gcloud secrets create GCP_SERVICE_ACCOUNT_KEY \
  --data-file=- \
  --project=campus-connect-sistc \
  --replication-policy="automatic"
```

## Verify Secret is Set

```bash
# Check if secret exists (won't show value)
firebase functions:secrets:access GCP_SERVICE_ACCOUNT_KEY --project campus-connect-sistc
```

## Grant Service Account Permissions (If Needed)

If you get permission errors, the Firebase service account needs Secret Manager access:

1. Go to [Google Cloud Console](https://console.cloud.google.com/iam-admin/iam?project=campus-connect-sistc)
2. Find the service account: `campus-connect-sistc@appspot.gserviceaccount.com`
3. Click **Edit** (pencil icon)
4. Click **"Add Another Role"**
5. Add role: **"Secret Manager Secret Accessor"**
6. Click **"Save"**

## After Setting the Secret

Once the secret is set, you can deploy:

```bash
firebase deploy --only functions:generateVertexAIResponse --project campus-connect-sistc
```

Or push to master - the GitHub Actions workflow will handle the rest.

## Troubleshooting

### Error: "Permission 'secretmanager.secrets.get' denied"
- **Solution**: The secret doesn't exist yet. Create it using Option 1 or 2 above.

### Error: "Secret does not exist"
- **Solution**: Create the secret first using the steps above.

### Error: "Invalid service account JSON"
- **Solution**: Make sure the JSON is valid and doesn't have extra quotes. The function automatically sanitizes it.
