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
 * 1. Set config: firebase functions:config:set videosdk.secret="YOUR_SECRET"
 * 2. Deploy function: firebase deploy --only functions:getVideoSDKToken
 */

const functions = require('firebase-functions');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// VideoSDK API Key (hardcoded)
const API_KEY = '0cd81014-abab-4f45-968d-b3ddae835a82';

// Firebase Functions v1
exports.getVideoSDKToken = functions.https.onCall(async (data, context) => {
    // Verify user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to generate tokens'
      );
    }

    // Get Server Secret from config or environment
    const SECRET = process.env.VIDEOSDK_SECRET || 
                   functions.config().videosdk?.secret;
    
    // Validate input
    const { userId, meetingId } = data;
    
    if (!userId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'userId is required'
      );
    }

    // Verify userId matches authenticated user (security check)
    if (userId !== context.auth.uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'User can only generate tokens for themselves'
      );
    }

    // Check if Server Secret is configured
    if (!SECRET) {
      console.error('VIDEOSDK_SECRET is not configured');
      throw new functions.https.HttpsError(
        'failed-precondition',
        'VideoSDK Secret is not configured. Run: firebase functions:config:set videosdk.secret="YOUR_SECRET"'
      );
    }

    try {
      // Generate JWT token
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        apikey: API_KEY,
        permissions: ['allow_join', 'allow_mod'],
        version: 2,
        iat: now,
        exp: now + (24 * 60 * 60), // 24 hours
        jti: uuidv4()
      };

      const token = jwt.sign(payload, SECRET, {
        algorithm: 'HS256'
      });

      console.log(`VideoSDK token generated for user ${userId}`);

      // Create VideoSDK room
      let realMeetingId;
      try {
        const roomResponse = await axios.post(
          'https://api.videosdk.live/v2/rooms',
          {},
          {
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json'
            }
          }
        );
        realMeetingId = roomResponse.data.roomId;
        console.log(`VideoSDK room created: ${realMeetingId}`);
      } catch (roomError) {
        console.error('Error creating VideoSDK room:', roomError.response?.data || roomError.message);
        throw new functions.https.HttpsError(
          'internal',
          'Failed to create VideoSDK room',
          roomError.response?.data?.message || roomError.message
        );
      }

      return {
        token,
        meetingId: realMeetingId
      };
    } catch (error) {
      console.error('Error generating VideoSDK token:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to generate token',
        error.message
      );
    }
  });
