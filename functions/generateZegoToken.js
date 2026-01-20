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
 * 
 * Setup:
 * 1. Set config: firebase functions:config:set zego.server_secret="YOUR_SECRET"
 * 2. Deploy function: firebase deploy --only functions:generateZegoToken
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

// ZEGOCLOUD Token Generator (Manual Implementation)
const { generateToken04 } = require('./zegoTokenGenerator');

// ZEGOCLOUD App ID (hardcoded, must be a NUMBER, not a string)
const APP_ID = 128222087; // Number type

// Firebase Functions v1 - using config instead of secrets
exports.generateZegoToken = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to generate tokens'
    );
  }

  // Get Server Secret from config or environment
  const serverSecret = process.env.ZEGO_SERVER_SECRET || 
                       functions.config().zego?.server_secret;
  
  // Validate input
  const { userId, roomID } = data;
  if (!userId || !roomID) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'userId and roomID are required'
    );
  }

  // Log UserID information for debugging
  console.log('=== ZEGOCLOUD Token Generation ===');
  console.log(`Received userId: "${userId}"`);
  console.log(`Authenticated user UID: "${context.auth.uid}"`);

  // Verify userId matches authenticated user (security check)
  if (userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User can only generate tokens for themselves'
    );
  }

  // Check if Server Secret is configured
  if (!serverSecret) {
    console.error('ZEGO_SERVER_SECRET is not configured');
    throw new functions.https.HttpsError(
      'failed-precondition',
      'ZEGOCLOUD Server Secret is not configured. Run: firebase functions:config:set zego.server_secret="YOUR_SECRET"'
    );
  }

  // Clean the secret
  let SERVER_SECRET = serverSecret.trim();
  if ((SERVER_SECRET.startsWith('"') && SERVER_SECRET.endsWith('"')) ||
      (SERVER_SECRET.startsWith("'") && SERVER_SECRET.endsWith("'"))) {
    SERVER_SECRET = SERVER_SECRET.slice(1, -1).trim();
  }

  // Validate Server Secret format
  if (SERVER_SECRET.length !== 32) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      `Invalid Secret Length (${SERVER_SECRET.length}). Secret must be exactly 32 hex characters.`
    );
  }

  try {
    // Generate token (expires in 1 hour)
    const effectiveTimeInSeconds = 3600;
    const payload = "";

    const token = generateToken04(
      APP_ID,
      String(userId),
      String(SERVER_SECRET),
      parseInt(effectiveTimeInSeconds),
      payload
    );

    console.log(`Token generated for user ${userId} in room ${roomID}`);
    return { token };
  } catch (error) {
    console.error('Error generating token:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to generate token',
      error.message
    );
  }
});
