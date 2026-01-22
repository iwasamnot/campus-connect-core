# Manual Setup: GCP Service Account Secret for Vertex AI

Since you cannot access the GitHub Secret, here's how to set it up manually:

## Step 1: Get Your Service Account JSON from Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts?project=campus-connect-sistc)
2. Find your service account (or create a new one if needed)
3. Click on the service account
4. Go to the **"Keys"** tab
5. Click **"Add Key"** → **"Create new key"**
6. Choose **JSON** format
7. Download the JSON file

## Step 2: Set the Secret in Firebase

### Option A: Using Firebase CLI (Recommended)

```bash
# Make sure you're authenticated
firebase login

# Set the secret (paste the JSON content when prompted)
firebase functions:secrets:set GCP_SERVICE_ACCOUNT_KEY --project campus-connect-sistc

# When prompted, paste the entire JSON content from the downloaded file
```

### Option B: Using Firebase Console

1. Go to [Firebase Console → Functions → Secrets](https://console.firebase.google.com/project/campus-connect-sistc/functions)
2. Click **"Add Secret"** (or edit existing `GCP_SERVICE_ACCOUNT_KEY`)
3. **Name**: `GCP_SERVICE_ACCOUNT_KEY`
4. **Value**: Paste the entire JSON content from the service account file
5. Click **"Save"**

### Option C: Using gcloud CLI

```bash
# If you have gcloud installed
gcloud secrets create GCP_SERVICE_ACCOUNT_KEY \
  --project=campus-connect-sistc \
  --data-file=path/to/your/service-account.json \
  --replication-policy="automatic"
```

## Step 3: Verify the Secret

```bash
# Check if secret exists (won't show the value)
firebase functions:secrets:access GCP_SERVICE_ACCOUNT_KEY --project campus-connect-sistc
```

## Step 4: Deploy the Function

Once the secret is set, deploy the function:

```bash
firebase deploy --only functions:generateVertexAIResponse --project campus-connect-sistc
```

## Important Notes

- The JSON should be the **entire** service account JSON file content
- Make sure the service account has **Vertex AI User** role in GCP
- The secret name must be exactly: `GCP_SERVICE_ACCOUNT_KEY`
- After setting the secret, the function will automatically use it on the next deployment

## Troubleshooting

### "Permission denied" error
- Make sure you're logged in: `firebase login`
- Check you have the correct project: `firebase use campus-connect-sistc`

### "Invalid JSON" error
- Make sure you're pasting the entire JSON (starts with `{` and ends with `}`)
- Don't add extra quotes or formatting
- Copy the entire file content, not just parts of it

### Function still not working
- Verify the secret is set: `firebase functions:secrets:access GCP_SERVICE_ACCOUNT_KEY`
- Check function logs: `firebase functions:log --only generateVertexAIResponse`
- Make sure the service account has Vertex AI permissions in GCP Console
