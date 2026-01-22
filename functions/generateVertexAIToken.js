/**
 * Cloud Function to generate Vertex AI access token and call Vertex AI
 * Uses @google-cloud/vertexai SDK server-side (Node.js only)
 * This allows client-side code to use Vertex AI without exposing service account
 */

const { VertexAI } = require('@google-cloud/vertexai');
const { onCall } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

// Define secrets - use the same secret name as GitHub Secret
// Note: The secret must be created in Firebase Secret Manager before deployment
// Run: firebase functions:secrets:set GCP_SERVICE_ACCOUNT_KEY
const gcpServiceAccountKey = defineSecret('GCP_SERVICE_ACCOUNT_KEY', {
  description: 'GCP Service Account JSON key for Vertex AI authentication'
});

/**
 * Generate Vertex AI response using enterprise SDK
 */
exports.generateVertexAIResponse = onCall(
  {
    secrets: [gcpServiceAccountKey],
    cors: true,
  },
  async (request) => {
    try {
      const { prompt, systemPrompt, model, modelPath, projectId, location, maxTokens, temperature } = request.data;

      if (!prompt) {
        throw new Error('Prompt is required');
      }

      // Parse service account from secret
      let serviceAccount;
      try {
        const serviceAccountJson = gcpServiceAccountKey.value();
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
        throw new Error('Invalid service account JSON in GCP_SERVICE_ACCOUNT_KEY secret');
      }

      // Initialize Vertex AI
      const vertexAI = new VertexAI({
        project: projectId || serviceAccount.project_id,
        location: location || 'us-central1',
      });

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
