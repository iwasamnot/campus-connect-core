# GCP Service Account Setup Instructions

## GitHub Secrets Configuration

You have `GCP_SERVICE_ACCOUNT_KEY` in your GitHub Secrets. Here's how to ensure it works correctly:

### 1. Verify Your GitHub Secret

Your secret should be named: **`GCP_SERVICE_ACCOUNT_KEY`**

The value should be the **complete JSON string** of your service account key file, for example:
```json
{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

**Important**: 
- The entire JSON must be on a single line (no line breaks)
- Include all fields from your service account JSON file
- Make sure there are no extra spaces or formatting

### 2. Additional Required Secrets

You also need these secrets in GitHub:

- **`VITE_GCP_PROJECT_ID`**: Your GCP project ID (e.g., `campus-connect-sistc`)
- **`VITE_GCP_LOCATION`**: Your GCP region (e.g., `us-central1`)

### 3. How It Works

The GitHub Actions workflow will:
1. Read `GCP_SERVICE_ACCOUNT_KEY` from GitHub Secrets
2. Add it to the `.env` file as `VITE_GCP_SERVICE_ACCOUNT_KEY` (Vite requires `VITE_` prefix)
3. The code will automatically detect and use it

### 4. Local Development

For local development, create a `.env` file with:

```env
VITE_GCP_PROJECT_ID=your-project-id
VITE_GCP_LOCATION=us-central1
VITE_GCP_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

Or you can use `VITE_GCP_SERVICE_ACCOUNT_JSON` instead of `VITE_GCP_SERVICE_ACCOUNT_KEY`.

### 5. Verification

After deployment, check the browser console. You should see:
- `✅ Using Vertex AI text-embedding-004 for embeddings` (if embeddings are working)
- `🔍 RAG: Using provider: Vertex AI for query: ...` (if RAG is working)

If you see warnings about service account not found, check:
1. The secret name is exactly `GCP_SERVICE_ACCOUNT_KEY` in GitHub
2. The JSON is valid and complete
3. The project ID and location are also set

---

## Troubleshooting

### Error: "Service account not found"
- Check that `GCP_SERVICE_ACCOUNT_KEY` exists in GitHub Secrets
- Verify the JSON is valid (try parsing it with `JSON.parse()`)
- Make sure `VITE_GCP_PROJECT_ID` and `VITE_GCP_LOCATION` are also set

### Error: "Error parsing service account JSON"
- The JSON might have line breaks - it must be a single line
- Check for missing quotes or commas
- Verify all required fields are present

### Vertex AI not working
- Ensure the service account has Vertex AI User role in GCP
- Check that Vertex AI API is enabled in your GCP project
- Verify the project ID matches your GCP project

---

**Note**: The code supports both `VITE_GCP_SERVICE_ACCOUNT_KEY` and `VITE_GCP_SERVICE_ACCOUNT_JSON` for flexibility, but `VITE_GCP_SERVICE_ACCOUNT_KEY` (matching your GitHub Secret name) takes priority.
