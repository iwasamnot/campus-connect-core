# Full AI Setup Guide

This guide will help you set up **full AI features** for Campus Connect, including:
- Smart replies, predictive typing, profile AI (frontend)
- Serverless vector RAG engine with Pinecone (backend)

---

## Quick Start

### 1. Local Development Setup

1. **Copy the example env file:**
   ```bash
   cp .env.example .env
   ```

2. **Add your Gemini API key** (minimum required for full AI):
   ```env
   VITE_GEMINI_API_KEY=your-gemini-api-key-here
   ```
   
   Get your key from: https://makersuite.google.com/app/apikey

3. **Start dev server:**
   ```bash
   npm run dev
   ```

✅ **You now have full AI features locally!**

---

### 2. Production Setup (GitHub Actions)

#### A. Frontend AI (Smart Replies, Predictive Typing, etc.)

1. Go to **GitHub → Settings → Secrets and variables → Actions**

2. Add these secrets (at minimum, add `VITE_GEMINI_API_KEY`):
   - `VITE_GEMINI_API_KEY` - **Required** for full AI features
   - `VITE_GROQ_API_KEY` - Optional fallback
   - `VITE_OPENAI_API_KEY` - Optional fallback
   - `VITE_HUGGINGFACE_API_KEY` - Optional fallback
   - `VITE_ANTHROPIC_API_KEY` - Optional fallback

3. **Push to `master`** → GitHub Actions will automatically:
   - Build with AI keys
   - Deploy to Firebase Hosting
   - Full AI features will be live!

#### B. Backend RAG Vector Service (Pinecone + OpenAI)

1. **Get your API keys:**
   - **Pinecone**: https://app.pinecone.io/ → Create index → Copy API key and index name
   - **OpenAI**: https://platform.openai.com/api-keys → Create API key

2. **Add to GitHub Secrets:**
   - `PINECONE_API_KEY`
   - `PINECONE_INDEX_NAME`
   - `OPENAI_API_KEY`

3. **Next deployment** → GitHub Actions will automatically:
   - Set Functions config from secrets
   - Deploy Functions with RAG service configured
   - Vector RAG engine will be fully operational!

---

## Manual Functions Setup (Alternative)

If you prefer to set Functions config manually (one-time setup):

```bash
# From project root
firebase functions:config:set \
  pinecone.api_key="YOUR_PINECONE_API_KEY" \
  pinecone.index="YOUR_PINECONE_INDEX_NAME" \
  openai.api_key="YOUR_OPENAI_API_KEY"

firebase deploy --only functions
```

Or use the setup script:

```bash
chmod +x scripts/setup-functions-config.sh
./scripts/setup-functions-config.sh
```

---

## What Each Key Does

### Frontend AI Keys (`VITE_*`)

- **`VITE_GEMINI_API_KEY`** (Recommended)
  - Powers: Smart replies, predictive typing, profile AI, AI Help Assistant
  - Free tier: 1,000,000 tokens/minute (practically unlimited)
  - Get from: https://makersuite.google.com/app/apikey

- **`VITE_GROQ_API_KEY`** (Optional fallback)
  - Fast but limited: 6,000 tokens/minute
  - Get from: https://console.groq.com/

- **`VITE_OPENAI_API_KEY`** (Optional fallback)
  - Good free tier
  - Get from: https://platform.openai.com/api-keys

### Backend RAG Keys (Functions)

- **`PINECONE_API_KEY`** + **`PINECONE_INDEX_NAME`**
  - Powers: Serverless vector search for RAG
  - Get from: https://app.pinecone.io/

- **`OPENAI_API_KEY`**
  - Powers: Text embeddings for Pinecone vectors
  - Get from: https://platform.openai.com/api-keys

---

## Verification

### Check Frontend AI is Working

1. Open the app
2. Go to **Campus Chat**
3. Type a message
4. You should see:
   - ✅ Smart reply suggestions
   - ✅ Predictive typing suggestions
   - ✅ AI Help Assistant working

### Check RAG Vector Service is Working

1. Open browser console
2. Look for:
   - ✅ `RAG: Upserted X knowledge base docs` (instead of "Vector service not configured")
   - ✅ No 400 errors from `/ragUpsert`

---

## Troubleshooting

### "No AI provider configured" errors

**Cause**: No `VITE_GEMINI_API_KEY` (or other AI key) is set.

**Fix**: 
- Local: Add to `.env` file
- Production: Add `VITE_GEMINI_API_KEY` to GitHub Secrets

### "Vector service is not configured" (400 errors)

**Cause**: Pinecone/OpenAI not configured in Functions.

**Fix**:
- Add `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, `OPENAI_API_KEY` to GitHub Secrets
- Or run manual setup: `firebase functions:config:set ...`

### Functions deployment fails

**Cause**: Missing Firebase service account or permissions.

**Fix**: Ensure `FIREBASE_SERVICE_ACCOUNT_CAMPUS_CONNECT_SISTC` secret is set in GitHub.

---

## Summary

**Minimum for full AI:**
- ✅ `VITE_GEMINI_API_KEY` (GitHub Secret + local `.env`)
- ✅ `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, `OPENAI_API_KEY` (GitHub Secrets for Functions)

**That's it!** Once these are set, everything will work automatically on the next deployment.
