# AI Setup Guide

This guide will help you set up the intelligent AI for the CampusConnect AI Help Assistant using Google Gemini 2.5 Flash.

## Features

- **Intelligent AI**: Uses Google Gemini 2.5 Flash for natural language understanding and responses
- **Local Knowledge Base**: Built-in SISTC knowledge base for accurate information
- **Fallback System**: Automatically falls back to local knowledge base if API is unavailable

## Setup Instructions

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key" or "Get API Key"
4. Copy the key (starts with `AIzaSy...`)

**Note**: Google Gemini API has a generous free tier, making it cost-effective for development and production use.

### 2. Configure Environment Variables

1. Create a `.env` file in the root directory (if it doesn't exist):
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your-gemini-api-key-here
   ```

3. Save the file

### 3. Restart Development Server

After adding your API key, restart the development server:
```bash
npm run dev
```

## How It Works

1. **User asks a question** in the AI Help Assistant
2. **Gemini Processing**: Google Gemini 2.5 Flash processes the question with local knowledge base context
3. **Response**: Returns intelligent, context-aware answer
4. **Fallback**: If API fails or key is not provided, uses local knowledge base only

## Model Configuration

The app uses **Google Gemini 2.5 Flash** model, which provides:
- Fast response times
- High-quality responses
- Cost-effective (generous free tier)
- Good balance of capability and speed

The model is configured in the components with safety settings disabled for content moderation purposes and appropriate system instructions for context-aware responses.

## Cost Considerations

- **Google Gemini**: Generous free tier available
- **Gemini 2.5 Flash**: Fast and cost-effective model
- **Without API Key**: System works with local knowledge base only (no AI features)
- **With API Key**: Full AI capabilities with Gemini integration

## Troubleshooting

### AI not responding
- Check that `VITE_GEMINI_API_KEY` is correctly set in `.env`
- Verify API key is valid and has remaining quota
- Check browser console for errors
- Ensure the key starts with `AIzaSy...`

### Fallback to local knowledge base
- This is normal if API key is not provided
- System will automatically use local knowledge base
- Check API key configuration if this happens frequently when key is set

### API key errors
- Ensure the key is not wrapped in quotes in `.env`
- Verify the key doesn't have extra spaces (will be auto-trimmed)
- Check that you've restarted the dev server after adding the key

## Use Cases

The Gemini API is used for:

1. **AI Help Assistant**: Provides intelligent responses about SISTC with local knowledge base context
2. **Virtual Senior**: AI-powered responses in Campus Chat
3. **Toxicity Detection**: Content moderation using Gemini's safety features (in toxicity checker utility)

## Security Notes

- **Never commit `.env` file to Git** (already in .gitignore)
- **Keep API keys secret** - don't share them publicly
- **Use environment variables** for production deployments
- **Monitor API usage** in Google AI Studio dashboard to track usage
- **Set up quota limits** in Google Cloud Console if needed

## Support

For issues or questions:
- Check the [Google Gemini API Documentation](https://ai.google.dev/docs)
- Review error messages in browser console
- Verify API key status in [Google AI Studio](https://makersuite.google.com/app/apikey)

## Additional Resources

- [Google AI Studio](https://makersuite.google.com/) - Get API keys and manage your project
- [Gemini API Documentation](https://ai.google.dev/docs) - Complete API reference
- [Gemini Models Overview](https://ai.google.dev/models/gemini) - Learn about available models
