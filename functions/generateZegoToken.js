/**
 * Cloud Function to generate ZEGOCLOUD tokens for calling
 * 
 * This function generates tokens server-side using your ZEGOCLOUD Server Secret
 * Tokens are required for ZEGOCLOUD authentication (unless token-less mode is enabled)
 * 
 * Deploy: firebase deploy --only functions:generateZegoToken
 * 
 * Usage:
 * POST /generateZegoToken
 * Body: { userId: string, roomID: string }
 * Returns: { token: string }
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

// ZEGOCLOUD Token Generator (Manual Implementation)
const { generateToken04 } = require('./zegoTokenGenerator');

// Get ZEGOCLOUD configuration from environment variables
// Set these in Firebase Console → Functions → Configuration → Environment Variables
const APP_ID = functions.config().zegocloud?.app_id || process.env.ZEGOCLOUD_APP_ID || '128222087';
const SERVER_SECRET = functions.config().zegocloud?.server_secret || process.env.ZEGOCLOUD_SERVER_SECRET;

exports.generateZegoToken = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to generate tokens'
    );
  }

  // Validate input
  const { userId, roomID } = data;
  if (!userId || !roomID) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'userId and roomID are required'
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
  if (!SERVER_SECRET) {
    console.error('ZEGOCLOUD_SERVER_SECRET is not configured');
    throw new functions.https.HttpsError(
      'failed-precondition',
      'ZEGOCLOUD Server Secret is not configured. Please set it in Firebase Functions configuration.'
    );
  }

  try {
    // Generate token
    // Token expires in 24 hours (86400 seconds)
    const effectiveTimeInSeconds = 86400;
    const payloadObject = {
      room_id: roomID,
      privilege: {
        1: 1, // Login room (1 = allow)
        2: 1  // Publish stream (1 = allow)
      },
      stream_id_list: null
    };

    console.log(`Generating token with APP_ID: ${APP_ID}, userId: ${userId}, roomID: ${roomID}`);
    console.log(`SERVER_SECRET length: ${SERVER_SECRET ? SERVER_SECRET.length : 0}`);

    const token = generateToken04(
      parseInt(APP_ID),
      userId,
      SERVER_SECRET,
      effectiveTimeInSeconds,
      payloadObject
    );

    console.log(`Generated token for user ${userId} in room ${roomID}`);
    console.log(`Token length: ${token.length}, Token preview: ${token.substring(0, 50)}...`);
    
    return { token };
  } catch (error) {
    console.error('Error generating ZEGOCLOUD token:', error);
    console.error('Error stack:', error.stack);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to generate token',
      error.message
    );
  }
});

