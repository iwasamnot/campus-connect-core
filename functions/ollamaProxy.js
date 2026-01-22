/**
 * Ollama Proxy Cloud Function
 * Proxies requests from HTTPS frontend to HTTP Ollama server
 * Solves mixed content security issue (HTTPS page can't call HTTP API)
 */

const functions = require('firebase-functions');
const axios = require('axios');

/**
 * HTTP Cloud Function to proxy Ollama requests
 * Handles CORS and forwards requests to self-hosted Ollama instance
 */
exports.ollamaProxy = functions
  .region('us-central1')
  .https
  .onRequest(async (req, res) => {
    // CORS headers
    const allowedOrigins = [
      'https://sistc.app',
      'https://campus-connect-sistc.web.app',
      'https://campus-connect-sistc.firebaseapp.com',
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
    }
    
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Max-Age', '3600');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      // Get Ollama URL from environment or use default
      const ollamaUrl = process.env.OLLAMA_URL || 'http://138.197.142.141:11434';
      const ollamaModel = process.env.OLLAMA_MODEL || 'deepseek-r1:32b';
      
      const { messages, model, options } = req.body;
      
      // Validate request
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: 'Invalid request: messages array required' });
        return;
      }

      // Forward request to Ollama
      const ollamaResponse = await axios.post(
        `${ollamaUrl}/api/chat`,
        {
          model: model || ollamaModel,
          messages: messages,
          stream: false,
          options: options || {
            temperature: 0.7,
            num_predict: 4096
          }
        },
        {
          timeout: 60000, // 60 second timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Return Ollama response
      res.status(200).json(ollamaResponse.data);
    } catch (error) {
      console.error('Ollama proxy error:', error);
      
      if (error.code === 'ECONNREFUSED') {
        res.status(503).json({ 
          error: 'Ollama server is unreachable',
          message: 'The Ollama server at the configured URL is not responding. Please check if the server is running.'
        });
      } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        res.status(504).json({ 
          error: 'Ollama request timed out',
          message: 'The request to Ollama took too long. The model may be processing a large request.'
        });
      } else {
        res.status(500).json({ 
          error: 'Proxy error',
          message: error.message || 'Failed to proxy request to Ollama'
        });
      }
    }
  });
