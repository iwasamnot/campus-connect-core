# AI Provider Setup Guide

## 🎓 Student-Friendly AI Providers

Since Gemini limits are full, here are better alternatives with generous free tiers:

## 🥇 Recommended: Groq (Best for Students)

### Why Groq?
- ✅ **Very generous free tier**: 14,400 requests/day
- ✅ **No credit card required**
- ✅ **Extremely fast** (uses specialized hardware)
- ✅ **Multiple models available**
- ✅ **Perfect for students**

### Setup Steps:
1. Go to https://console.groq.com
2. Sign up (free, no credit card needed)
3. Create an API key
4. Add to your `.env` file:
   ```
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```

### Models Available:
- `llama-3.1-70b-versatile` (Recommended - fast and capable)
- `llama-3.1-8b-instruct` (Lightweight)
- `mixtral-8x7b-32768` (Long context)

---

## 🥈 Alternative: Hugging Face (Free Tier)

### Why Hugging Face?
- ✅ **Free inference API**
- ✅ **No credit card required**
- ✅ **Open source models**
- ✅ **Community-driven**

### Setup Steps:
1. Go to https://huggingface.co
2. Sign up (free)
3. Go to Settings → Access Tokens
4. Create a new token
5. Add to your `.env` file:
   ```
   VITE_HUGGINGFACE_API_KEY=your_hf_token_here
   ```

### Models Available:
- `meta-llama/Llama-3.1-8B-Instruct` (Free)
- `mistralai/Mistral-7B-Instruct-v0.2` (Free)
- Many more open source models

---

## 🥉 Alternative: OpenAI (Good Free Tier)

### Why OpenAI?
- ✅ **$5 free credit** for new users
- ✅ **Reliable and fast**
- ✅ **Well-documented**

### Setup Steps:
1. Go to https://platform.openai.com
2. Sign up
3. Get $5 free credit
4. Create an API key
5. Add to your `.env` file:
   ```
   VITE_OPENAI_API_KEY=your_openai_key_here
   ```

### Models Available:
- `gpt-3.5-turbo` (Cost-effective, recommended)
- `gpt-4` (More capable, costs more)

---

## 🔄 Automatic Fallback System

The app now supports **automatic fallback** between providers:

1. **Groq** (tried first - best for students)
2. **Hugging Face** (if Groq fails)
3. **OpenAI** (if Hugging Face fails)
4. **Anthropic Claude** (if OpenAI fails)
5. **Gemini** (last resort - your existing)

The system automatically uses the first available provider!

---

## 📝 Environment Variables

Add to your `.env` file (in order of priority):

```env
# Best for students - very generous limits
VITE_GROQ_API_KEY=your_groq_key_here

# Free tier available
VITE_HUGGINGFACE_API_KEY=your_hf_token_here

# $5 free credit
VITE_OPENAI_API_KEY=your_openai_key_here

# Pay-as-you-go
VITE_ANTHROPIC_API_KEY=your_anthropic_key_here

# Fallback (your existing)
VITE_GEMINI_API_KEY=your_gemini_key_here
```

---

## 🚀 Quick Start (Groq - Recommended)

1. **Sign up**: https://console.groq.com/signup
2. **Get API key**: Dashboard → API Keys → Create
3. **Add to `.env`**:
   ```
   VITE_GROQ_API_KEY=gsk_your_key_here
   ```
4. **Restart dev server**: `npm run dev`
5. **Done!** The app will automatically use Groq

---

## 🔧 For GitHub Actions

Add the API key to GitHub Secrets:
- Repository → Settings → Secrets and variables → Actions
- Add secret: `VITE_GROQ_API_KEY`
- Value: Your Groq API key

The workflow files are already configured to use it!

---

## 📊 Provider Comparison

| Provider | Free Tier | Speed | Best For |
|----------|-----------|-------|----------|
| **Groq** | 14,400 req/day | ⚡⚡⚡ Very Fast | Students |
| Hugging Face | Free inference | ⚡⚡ Fast | Open source |
| OpenAI | $5 credit | ⚡⚡⚡ Fast | Reliability |
| Anthropic | Pay-as-you-go | ⚡⚡ Fast | Quality |
| Gemini | Limited | ⚡⚡ Fast | Fallback |

---

## ✅ Verification

After adding an API key, check the console:
- Look for: "Using AI provider: groq" (or your chosen provider)
- If you see errors, check your API key format

---

## 🆘 Troubleshooting

### "No AI provider configured"
- Make sure at least one API key is set in `.env`
- Restart your dev server after adding keys

### "API error"
- Check your API key is correct
- Verify the key has proper permissions
- Check provider status page

### "Rate limit exceeded"
- The system will automatically try fallback providers
- Consider adding multiple API keys for redundancy

---

## 🎯 Recommendation

**For students**: Use **Groq** - it's the most generous and fastest!

1. Sign up: https://console.groq.com/signup
2. Get free API key
3. Add to `.env`: `VITE_GROQ_API_KEY=your_key`
4. Enjoy unlimited AI features! 🚀
