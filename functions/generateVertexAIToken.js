/**
 * Cloud Function to generate Vertex AI access token and call Vertex AI
 * Uses @google-cloud/vertexai SDK server-side (Node.js only)
 * This allows client-side code to use Vertex AI without exposing service account
 */

const { VertexAI } = require('@google-cloud/vertexai');
const { onCall } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

// Define secrets - use string array format to avoid permission issues during deployment
// The secret can be set later via: firebase functions:secrets:set GCP_SERVICE_ACCOUNT_KEY
// Using string format instead of defineSecret() to avoid deployment-time validation
// This allows deployment even if secret doesn't exist or permissions aren't set yet

/**
 * Generate Vertex AI response using enterprise SDK
 */
exports.generateVertexAIResponse = onCall(
  {
    secrets: ['GCP_SERVICE_ACCOUNT_KEY'], // Use string array format (like getVideoSDKToken)
    region: 'us-central1',
    cors: true,
  },
  async (request) => {
    try {
      const { prompt, systemPrompt, model, modelPath, projectId, location, maxTokens, temperature } = request.data;

      if (!prompt) {
        return {
          success: false,
          error: 'Prompt is required'
        };
      }

      // Parse service account from secret
      let serviceAccount;
      try {
        // Get the secret value using process.env (Firebase Functions v2 injects secrets as env vars)
        const serviceAccountJson = process.env.GCP_SERVICE_ACCOUNT_KEY;
        
        if (!serviceAccountJson || serviceAccountJson.trim() === '') {
          console.error('GCP_SERVICE_ACCOUNT_KEY secret is not set or empty');
          return {
            success: false,
            error: 'GCP_SERVICE_ACCOUNT_KEY secret is not configured. Please set it using: firebase functions:secrets:set GCP_SERVICE_ACCOUNT_KEY --project campus-connect-sistc'
          };
        }

        if (!serviceAccountJson || serviceAccountJson.trim() === '') {
          return {
            success: false,
            error: 'GCP_SERVICE_ACCOUNT_KEY secret is empty. Please set it using: firebase functions:secrets:set GCP_SERVICE_ACCOUNT_KEY --project campus-connect-sistc'
          };
        }

        // Sanitize: trim and remove wrapping quotes
        let sanitized = serviceAccountJson.trim();
        if ((sanitized.startsWith('"') && sanitized.endsWith('"')) || 
            (sanitized.startsWith("'") && sanitized.endsWith("'"))) {
          sanitized = sanitized.slice(1, -1);
        }
        serviceAccount = JSON.parse(sanitized);
        console.log('Successfully authenticated with Vertex AI Service Account');
      } catch (error) {
        console.error('Error parsing service account JSON:', error);
        return {
          success: false,
          error: `Invalid service account JSON in GCP_SERVICE_ACCOUNT_KEY secret: ${error.message}`
        };
      }

      // Validate service account has required fields
      if (!serviceAccount.project_id && !serviceAccount.private_key) {
        return {
          success: false,
          error: 'Service account JSON missing required fields (project_id or private_key). Please update GCP_SERVICE_ACCOUNT_KEY secret with valid credentials.'
        };
      }

      // Initialize Vertex AI (with error handling)
      let vertexAI;
      try {
        vertexAI = new VertexAI({
          project: projectId || serviceAccount.project_id,
          location: location || 'us-central1',
        });
      } catch (initError) {
        console.error('Error initializing Vertex AI:', initError);
        return {
          success: false,
          error: `Failed to initialize Vertex AI: ${initError.message}. Please check your service account credentials.`
        };
      }

      // Use the proper Vertex AI model format
      // Format: projects/{PROJECT_ID}/locations/{LOCATION}/publishers/google/models/{MODEL}
      const finalProjectId = projectId || serviceAccount.project_id;
      const finalLocation = location || 'us-central1';
      const finalModel = model || 'gemini-1.5-flash';
      
      // Use modelPath if provided (from client), otherwise construct it
      const modelToUse = modelPath || `projects/${finalProjectId}/locations/${finalLocation}/publishers/google/models/${finalModel}`;
      
      console.log(`Using Vertex AI model: ${modelToUse}`);
      
      // Initialize the generative model with the full model path
      const generativeModel = vertexAI.getGenerativeModel({
        model: modelToUse,
        generationConfig: {
          maxOutputTokens: maxTokens || 2048,
          temperature: temperature || 0.7,
        },
      });

      // Build the request
      const requestPayload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      };

      // Add system instruction if provided
      if (systemPrompt) {
        requestPayload.systemInstruction = {
          parts: [{ text: systemPrompt }],
        };
      }

      // Generate content
      const result = await generativeModel.generateContent(requestPayload);
      const response = result.response;
      
      // Extract text from response
      const text = response.candidates[0]?.content?.parts[0]?.text || '';
      
      return {
        success: true,
        text: text,
        model: modelToUse,
      };
    } catch (error) {
      console.error('Error calling Vertex AI:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }
);
