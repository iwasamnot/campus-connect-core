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
// IMPORTANT: Firebase Functions v2 uses environment variables, not functions.config()
// Set these using: firebase functions:config:set zegocloud.server_secret="YOUR_SECRET"
// OR in Firebase Console → Functions → Configuration → Environment Variables
// 
// For debugging, log all available config at function load time
const allConfig = functions.config();
const zegocloudConfig = allConfig.zegocloud || {};
console.log('=== ZEGOCLOUD Config Debug ===');
console.log('All config keys:', Object.keys(allConfig));
console.log('ZEGOCLOUD config object:', zegocloudConfig);
console.log('ZEGOCLOUD app_id:', zegocloudConfig.app_id);
console.log('ZEGOCLOUD server_secret exists:', !!zegocloudConfig.server_secret);
console.log('ZEGOCLOUD server_secret length:', zegocloudConfig.server_secret ? zegocloudConfig.server_secret.length : 0);
console.log('Process env ZEGOCLOUD_SERVER_SECRET exists:', !!process.env.ZEGOCLOUD_SERVER_SECRET);
console.log('Process env ZEGOCLOUD_SERVER_SECRET length:', process.env.ZEGOCLOUD_SERVER_SECRET ? process.env.ZEGOCLOUD_SERVER_SECRET.length : 0);
console.log('================================');

const APP_ID = zegocloudConfig.app_id || process.env.ZEGOCLOUD_APP_ID || '128222087';
const SERVER_SECRET = zegocloudConfig.server_secret || process.env.ZEGOCLOUD_SERVER_SECRET;

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
    const currentConfig = functions.config();
    console.error('=== ZEGOCLOUD_SERVER_SECRET Configuration Error ===');
    console.error('SERVER_SECRET is:', SERVER_SECRET);
    console.error('Available config keys:', Object.keys(currentConfig));
    console.error('ZEGOCLOUD config object:', currentConfig.zegocloud);
    console.error('Process env ZEGOCLOUD_SERVER_SECRET:', process.env.ZEGOCLOUD_SERVER_SECRET ? 'EXISTS (length: ' + process.env.ZEGOCLOUD_SERVER_SECRET.length + ')' : 'NOT SET');
    console.error('===================================================');
    console.error('');
    console.error('📝 To fix this, run one of these commands:');
    console.error('');
    console.error('Option 1 (Firebase CLI):');
    console.error('  firebase functions:config:set zegocloud.server_secret="YOUR_SERVER_SECRET"');
    console.error('  firebase deploy --only functions:generateZegoToken');
    console.error('');
    console.error('Option 2 (Firebase Console):');
    console.error('  1. Go to: https://console.firebase.google.com/project/campus-connect-sistc/functions/config');
    console.error('  2. Click "Add variable"');
    console.error('  3. Key: zegocloud.server_secret');
    console.error('  4. Value: YOUR_SERVER_SECRET');
    console.error('  5. Click "Save"');
    console.error('  6. Redeploy function: firebase deploy --only functions:generateZegoToken');
    console.error('');
    throw new functions.https.HttpsError(
      'failed-precondition',
      'ZEGOCLOUD Server Secret is not configured. Check function logs for setup instructions.'
    );
  }
  
  // Verify Server Secret is not empty
  if (SERVER_SECRET.trim() === '') {
    console.error('ZEGOCLOUD_SERVER_SECRET is set but empty');
    throw new functions.https.HttpsError(
      'failed-precondition',
      'ZEGOCLOUD Server Secret is empty. Please set a valid Server Secret in Firebase Functions configuration.'
    );
  }
  
  console.log(`Using APP_ID: ${APP_ID}, SERVER_SECRET length: ${SERVER_SECRET.length} (hidden for security)`);

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
    console.log(`Payload object:`, JSON.stringify(payloadObject));

    const token = generateToken04(
      parseInt(APP_ID),
      userId,
      SERVER_SECRET,
      effectiveTimeInSeconds,
      payloadObject
    );

    console.log(`Generated token for user ${userId} in room ${roomID}`);
    console.log(`Token length: ${token.length}`);
    console.log(`Token format check: ${token.includes('.') ? 'Has dot separator ✓' : 'Missing dot separator ✗'}`);
    console.log(`Token parts: ${token.split('.').length} parts (expected 2)`);
    console.log(`Token preview: ${token.substring(0, 50)}...`);
    
    // Additional validation
    if (!token || token.length < 100) {
      console.error('⚠️ WARNING: Generated token seems too short. This might indicate an issue.');
    }
    
    if (!token.includes('.')) {
      console.error('❌ ERROR: Token is missing the dot separator. Token format is incorrect.');
    }
    
    console.log('');
    console.log('📝 If you receive error 50119 (token auth err) from ZEGOCLOUD:');
    console.log('   1. Verify Server Secret in ZEGOCLOUD Console:');
    console.log('      https://console.zegocloud.com/project/YOUR_PROJECT_ID/settings');
    console.log('   2. Copy the Server Secret exactly (no extra spaces)');
    console.log('   3. Set it in Firebase Functions:');
    console.log('      firebase functions:config:set zegocloud.server_secret="YOUR_SECRET"');
    console.log('   4. Redeploy: firebase deploy --only functions:generateZegoToken');
    console.log('   5. Wait 1-2 minutes for deployment to complete');
    console.log('');
    
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

