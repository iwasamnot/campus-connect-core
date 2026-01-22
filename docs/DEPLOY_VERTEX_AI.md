# Deploying Vertex AI Cloud Function

## Prerequisites
- GCP Service Account JSON key (already in GitHub Secrets as `GCP_SERVICE_ACCOUNT_KEY`)
- Firebase CLI installed and authenticated
- Firebase project: `campus-connect-sistc`

## Step 1: Set Firebase Secret (One-time setup)

The Cloud Function requires the service account key to be set in Firebase Secret Manager.

### Option A: Using Firebase CLI (Recommended for local setup)

```bash
# Set the secret from GitHub Secret (you'll need to copy the value)
firebase functions:secrets:set GCP_SERVICE_ACCOUNT_KEY --project campus-connect-sistc
# When prompted, paste your service account JSON
```

### Option B: Using Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/project/campus-connect-sistc/functions)
2. Navigate to Functions → Secrets
3. Click "Add Secret"
4. Name: `GCP_SERVICE_ACCOUNT_KEY`
5. Value: Paste your service account JSON (from GitHub Secrets)

## Step 2: Deploy the Cloud Function

```bash
cd functions
npm install  # Ensure @google-cloud/vertexai is installed
cd ..
firebase deploy --only functions:generateVertexAIResponse --project campus-connect-sistc
```

## Step 3: Get Function URL

After deployment, the function URL will be:
```
https://us-central1-campus-connect-sistc.cloudfunctions.net/generateVertexAIResponse
```

This URL is automatically added to `.env` in the GitHub Actions workflow.

## Verification

1. Check Firebase Console → Functions to see `generateVertexAIResponse` deployed
2. Test the function using the Firebase Console or via your app
3. Check logs: `firebase functions:log --only generateVertexAIResponse`

## Troubleshooting

### Error: "In non-interactive mode but have no value for the secret"
- Solution: Set the secret first using Step 1 above

### Error: "Invalid service account JSON"
- Solution: Ensure the JSON is valid and doesn't have extra quotes or whitespace
- The function automatically sanitizes the input (removes wrapping quotes)

### Function not accessible
- Check that CORS is enabled (already configured in the function)
- Verify the function is deployed to the correct region (us-central1)
