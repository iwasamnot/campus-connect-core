# AI Setup Guide

This guide will help you set up the intelligent AI with web access for the CampusConnect AI Help Assistant.

## Features

- **Intelligent AI**: Uses OpenAI's GPT models for natural language understanding
- **Web Search**: Real-time web search using Tavily API for up-to-date information
- **Fallback System**: Automatically falls back to local knowledge base if APIs are unavailable

## Setup Instructions

### 1. Get API Keys

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key (you won't be able to see it again!)

#### Tavily API Key (Optional but Recommended)
1. Go to [Tavily](https://tavily.com/)
2. Sign up for a free account
3. Navigate to your dashboard
4. Copy your API key

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your API keys:
   ```
   VITE_OPENAI_API_KEY=sk-your-openai-key-here
   VITE_TAVILY_API_KEY=tvly-your-tavily-key-here
   ```

3. Save the file

### 3. Restart Development Server

After adding your API keys, restart the development server:
```bash
npm run dev
```

## Configuration Options

You can customize the AI behavior in `src/config/aiConfig.js`:

```javascript
export const AI_CONFIG = {
  openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  tavilyApiKey: import.meta.env.VITE_TAVILY_API_KEY || '',
  enableWebSearch: true,        // Enable/disable web search
  useFallback: true,            // Use local knowledge base as fallback
  model: 'gpt-4o-mini',         // AI model to use
  temperature: 0.7,             // Creativity level (0-1)
  maxTokens: 1000               // Maximum response length
};
```

## Model Options

- `gpt-4o-mini`: Fast and cost-effective (recommended)
- `gpt-3.5-turbo`: Faster and cheaper, but less capable
- `gpt-4`: Most capable but slower and more expensive

## How It Works

1. **User asks a question**
2. **Web Search** (if enabled): Searches the web for current information
3. **AI Processing**: OpenAI processes the question with web context
4. **Response**: Returns intelligent, context-aware answer
5. **Fallback**: If APIs fail, uses local knowledge base

## Cost Considerations

- **OpenAI**: Pay-per-use pricing. GPT-4o-mini is very affordable (~$0.15 per 1M input tokens)
- **Tavily**: Free tier available, then pay-per-search
- **Without API Keys**: System works with local knowledge base only

## Troubleshooting

### AI not responding
- Check that API keys are correctly set in `.env`
- Verify API keys are valid and have credits
- Check browser console for errors

### Web search not working
- Ensure Tavily API key is set
- Check internet connection
- Verify API key has remaining credits

### Fallback to local knowledge base
- This is normal if APIs are unavailable
- System will automatically use local knowledge base
- Check API keys and credits if this happens frequently

## Security Notes

- **Never commit `.env` file to Git** (already in .gitignore)
- **Keep API keys secret** - don't share them publicly
- **Use environment variables** for production deployments
- **Monitor API usage** to avoid unexpected costs

## Support

For issues or questions:
- Check the [OpenAI Documentation](https://platform.openai.com/docs)
- Check the [Tavily Documentation](https://docs.tavily.com/)
- Review error messages in browser console

