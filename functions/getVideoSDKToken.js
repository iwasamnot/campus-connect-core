/**
 * Cloud Function to generate VideoSDK.live tokens for calling
 * 
 * This function generates JWT tokens server-side using your VideoSDK Server Secret
 * Tokens are required for VideoSDK authentication
 * 
 * Deploy: firebase deploy --only functions:getVideoSDKToken
 * 
 * Usage:
 * POST /getVideoSDKToken
 * Body: { userId: string, meetingId: string (optional) }
 * Returns: { token: string, meetingId: string }
 * 
 * Setup:
 * 1. Set secret: firebase functions:secrets:set VIDEOSDK_SECRET
 * 2. Deploy function: firebase deploy --only functions:getVideoSDKToken
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// VideoSDK API Key from environment variable (SECURITY: Never hardcode API keys!)
// Set via: firebase functions:config:set videosdk.apikey="your-api-key"
// Or use Secret Manager: firebase functions:secrets:set VIDEOSDK_API_KEY
const API_KEY = process.env.VIDEOSDK_API_KEY || process.env.FIREBASE_CONFIG?.videosdk?.apikey;

// Firebase Functions v2 with Secret Manager, CORS, and Region
exports.getVideoSDKToken = onCall(
  {
    secrets: ['VIDEOSDK_SECRET', 'VIDEOSDK_API_KEY'], // Added API key to secrets
    region: 'us-central1', // Match the region specified in firebaseConfig.js
    cors: [
      'http://localhost:5173', // Vite dev server
      'http://localhost:5174', // Alternative Vite port
      'http://localhost:3000', // Alternative dev server port
      'https://campus-connect-sistc.web.app', // Production URL
      'https://campus-connect-sistc.firebaseapp.com' // Alternative production URL
    ]
  },
  async (request) => {
    // Verify user is authenticated
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated to generate tokens'
      );
    }

    // Get Server Secret and API Key from Secret Manager (v2)
    const SECRET = process.env.VIDEOSDK_SECRET;
    const API_KEY_FROM_SECRET = process.env.VIDEOSDK_API_KEY || API_KEY;
    
    // Validate API Key is configured
    if (!API_KEY_FROM_SECRET) {
      console.error('=== VIDEOSDK_API_KEY Configuration Error ===');
      console.error('VIDEOSDK_API_KEY is not set in Secret Manager');
      console.error('===================================================');
      console.error('');
      console.error('📝 To fix this, run:');
      console.error('   firebase functions:secrets:set VIDEOSDK_API_KEY');
      console.error('   (Enter your VideoSDK API Key when prompted)');
      console.error('   firebase deploy --only functions:getVideoSDKToken');
      console.error('');
      throw new HttpsError(
        'failed-precondition',
        'VideoSDK API Key is not configured. Check function logs for setup instructions.'
      );
    }
    
    // Debug logging for secret verification
    if (SECRET) {
      console.log(`DEBUG: Secret length: ${SECRET.length} (expected: 64)`);
      console.log(`DEBUG: Secret first 10 chars: ${SECRET.substring(0, 10)}`);
      console.log(`DEBUG: Secret last 10 chars: ${SECRET.substring(SECRET.length - 10)}`);
    }
    
    // Validate input
    const { userId, meetingId } = request.data;
    
    if (!userId) {
      throw new HttpsError(
        'invalid-argument',
        'userId is required'
      );
    }

    // Verify userId matches authenticated user (security check)
    if (userId !== request.auth.uid) {
      throw new HttpsError(
        'permission-denied',
        'User can only generate tokens for themselves'
      );
    }

    // Check if Server Secret is configured
    if (!SECRET) {
      console.error('=== VIDEOSDK_SECRET Configuration Error ===');
      console.error('VIDEOSDK_SECRET is not set in Secret Manager');
      console.error('===================================================');
      console.error('');
      console.error('📝 To fix this, run:');
      console.error('   firebase functions:secrets:set VIDEOSDK_SECRET');
      console.error('   (Enter your 64-character hex Server Secret when prompted)');
      console.error('   firebase deploy --only functions:getVideoSDKToken');
      console.error('');
      throw new HttpsError(
        'failed-precondition',
        'VideoSDK Server Secret is not configured. Check function logs for setup instructions.'
      );
    }

    try {
      // Step 1: Generate JWT token first (needed to create room)
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        apikey: API_KEY_FROM_SECRET, // Use API key from Secret Manager
        permissions: ['allow_join', 'allow_mod'], // Required permissions
        version: 2, // CRITICAL: Required for modern VideoSDK clusters
        iat: now, // Issued at time (seconds since epoch)
        exp: now + (24 * 60 * 60), // Expires in 24 hours (seconds since epoch)
        jti: uuidv4() // CRITICAL: Unique ID for this token (JWT ID)
      };

      // Sign the token using HS256 algorithm
      const token = jwt.sign(payload, SECRET, {
        algorithm: 'HS256'
      });

      console.log(`✅ VideoSDK token generated for user ${userId}`);
      console.log(`Token length: ${token.length}`);

      // Step 2: Create a real meeting/room via VideoSDK API
      // VideoSDK requires rooms to be created via their API first
      let realMeetingId;
      try {
        console.log('🔄 Creating VideoSDK room...');
        const roomResponse = await axios.post(
          'https://api.videosdk.live/v2/rooms',
          {}, // Empty body
          {
            headers: {
              'Authorization': token, // Use the JWT token for authentication
              'Content-Type': 'application/json'
            }
          }
        );
        
        realMeetingId = roomResponse.data.roomId;
        console.log(`✅ VideoSDK room created: ${realMeetingId}`);
      } catch (roomError) {
        console.error('❌ Error creating VideoSDK room:', roomError.response?.data || roomError.message);
        console.error('Room creation error details:', {
          status: roomError.response?.status,
          statusText: roomError.response?.statusText,
          data: roomError.response?.data
        });
        throw new HttpsError(
          'internal',
          'Failed to create VideoSDK room',
          roomError.response?.data?.message || roomError.message
        );
      }

      return {
        token,
        meetingId: realMeetingId // Return the real meeting ID from VideoSDK
      };
    } catch (error) {
      console.error('Error generating VideoSDK token:', error);
      console.error('Error stack:', error.stack);
      throw new HttpsError(
        'internal',
        'Failed to generate token',
        error.message
      );
    }
  }
);

