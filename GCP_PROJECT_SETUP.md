# GCP Project Setup - campus-connect-sistc

## Your Project Information
- **Project ID**: `campus-connect-sistc`
- **Project Number**: `680423970030`
- **Location**: `us-central1` (default)

## ✅ What's Already Configured

1. **GitHub Actions Workflow**: Updated to use your project ID automatically
2. **Code**: Configured to use `campus-connect-sistc` as the project ID
3. **Service Account Key**: You have `GCP_SERVICE_ACCOUNT_KEY` in GitHub Secrets

## 🔍 Important: Verify Your Service Account Key

**CRITICAL**: Your service account key must be from the **same project** (`campus-connect-sistc`).

### How to Verify:

1. **Check the service account key JSON**:
   - Open the JSON file (or the value in GitHub Secrets)
   - Look for `"project_id": "campus-connect-sistc"`
   - If it says a different project ID, the key won't work!

2. **If the key is from a different project**:
   - You have two options:
     - **Option A**: Create a new service account in `campus-connect-sistc` project
     - **Option B**: Just use Gemini API key instead (simpler - see below)

## 🎯 Recommended: Use Gemini API Key (Simpler)

Since you have your existing project, the **easiest** option is to just use a Gemini API key:

1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account (the one that owns `campus-connect-sistc`)
3. Create an API key
4. Add to GitHub Secrets as: `VITE_GEMINI_API_KEY`

The code will automatically use this and you don't need the service account key at all!

## 🔧 If You Want to Use Vertex AI (Service Account)

### Step 1: Verify Service Account Key

Make sure your `GCP_SERVICE_ACCOUNT_KEY` in GitHub Secrets:
- Has `"project_id": "campus-connect-sistc"` in the JSON
- Has the correct permissions (Vertex AI User role)

### Step 2: Enable Vertex AI API

1. Go to: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=campus-connect-sistc
2. Click "Enable" if not already enabled

### Step 3: Grant Permissions

1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=campus-connect-sistc
2. Find your service account
3. Make sure it has:
   - **Vertex AI User** role (minimum)
   - Or **Vertex AI Admin** role (for full access)

### Step 4: That's It!

The GitHub Actions workflow is already configured with:
- `VITE_GCP_PROJECT_ID=campus-connect-sistc`
- `VITE_GCP_LOCATION=us-central1`
- `VITE_GCP_SERVICE_ACCOUNT_KEY` from your GitHub Secret

## 📋 Current Configuration

The code will check in this order:
1. **Gemini API Key** (`VITE_GEMINI_API_KEY`) - ✅ Recommended (simplest)
2. **Vertex AI** (if service account is configured) - Requires matching project ID
3. Other providers as fallback

## 🚨 Troubleshooting

### Error: "Service account not found"
- Check that `GCP_SERVICE_ACCOUNT_KEY` exists in GitHub Secrets
- Verify the JSON is valid

### Error: "Project ID mismatch"
- Your service account key must have `"project_id": "campus-connect-sistc"`
- If it's from a different project, create a new service account in `campus-connect-sistc`

### Vertex AI not working
- Enable Vertex AI API in your project
- Grant Vertex AI User role to service account
- Verify the service account key is from the correct project

## 💡 Recommendation

**Just use the Gemini API key!** It's:
- ✅ Simpler (no service account needed)
- ✅ Works with your existing account
- ✅ Same functionality
- ✅ Already configured in your workflow

The service account is only needed for Vertex AI enterprise features (300 RPM quota).
