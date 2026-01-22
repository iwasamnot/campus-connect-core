# Simple Setup Guide - Use Gemini API Key (Recommended)

## ✅ Easiest Option: Just Use Gemini API Key

You don't need the service account key! Just use a simple Gemini API key from your existing account.

### Step 1: Get Gemini API Key

1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with your **existing Google account** (the one you want to use)
3. Click "Create API Key"
4. Copy the API key (starts with `AIzaSy...`)

### Step 2: Add to GitHub Secrets

Add this secret to GitHub:
- **Secret Name**: `VITE_GEMINI_API_KEY`
- **Value**: Your API key (e.g., `AIzaSy...`)

### Step 3: That's It! 🎉

The code will automatically:
- Use your Gemini API key (simplest option)
- Work with your existing account
- No service account needed
- No new GCP project needed

---

## 🔄 If You Want to Use Service Account (Advanced)

**Important**: Service account keys are **project-specific**. You can't use a key from one project with another project.

### Option A: Use Service Account from Your Existing Project

1. Go to your **existing GCP project** (the one you want to use)
2. Create a service account in that project
3. Download the key JSON
4. Add it to GitHub Secrets as `GCP_SERVICE_ACCOUNT_KEY`

### Option B: Use the New Project's Service Account

If you created a new GCP project just for the service account:
1. Use the service account key from that **new project**
2. Make sure `VITE_GCP_PROJECT_ID` matches the **new project ID**
3. The service account must have Vertex AI permissions in that project

---

## 📊 Priority Order

The code checks providers in this order:

1. **Gemini API Key** (✅ Recommended - simplest)
   - Just need `VITE_GEMINI_API_KEY`
   - Works with any Google account
   - No service account needed

2. **Vertex AI** (Advanced)
   - Requires `VITE_GCP_PROJECT_ID`, `VITE_GCP_LOCATION`, and service account
   - Service account must be from the SAME project as `VITE_GCP_PROJECT_ID`

3. **Groq** (Fallback)
4. **Hugging Face** (Fallback)
5. **OpenAI** (Fallback)
6. **Anthropic** (Fallback)

---

## 🎯 Recommendation

**Just use the Gemini API key!** It's:
- ✅ Simpler (no service account needed)
- ✅ Works with your existing account
- ✅ Same functionality
- ✅ Easier to set up

The service account is only needed if you specifically want:
- Vertex AI enterprise features
- Higher rate limits (300 RPM)
- More advanced configuration

For most users, the Gemini API key is perfect! 🚀
