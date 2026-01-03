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
// ⚠️ IMPORTANT: Use SERVER SECRET, NOT Callback Secret!
// - Server Secret: Used for token generation (32 hex characters)
// - Callback Secret: Used for webhook verification (different secret)
// Get Server Secret from: ZEGOCLOUD Console → Project Settings → Basic Configurations → ServerSecret
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
// Get Server Secret and handle common configuration issues
let SERVER_SECRET = (zegocloudConfig.server_secret || process.env.ZEGOCLOUD_SERVER_SECRET);
if (SERVER_SECRET) {
  // Debug: Check for quote issues (common mistake when setting via CLI)
  const originalLength = SERVER_SECRET.length;
  const firstChar = SERVER_SECRET.charAt(0);
  const lastChar = SERVER_SECRET.charAt(SERVER_SECRET.length - 1);
  
  // Log debug info (only at module load time, not on every function call)
  console.log('=== Server Secret Debug (Module Load) ===');
  console.log(`DEBUG: Secret first char: "${firstChar}" (char code: ${firstChar.charCodeAt(0)})`);
  console.log(`DEBUG: Secret last char: "${lastChar}" (char code: ${lastChar.charCodeAt(0)})`);
  console.log(`DEBUG: Secret length: ${originalLength}`);
  console.log(`DEBUG: Expected length: 32 (valid ZEGOCLOUD secret)`);
  if (originalLength === 34) {
    console.warn('⚠️ WARNING: Secret length is 34 characters (expected 32)');
    console.warn('   This usually means the secret has extra quotes around it!');
    console.warn('   Example: "abc123..." instead of abc123...');
  }
  console.log('=========================================');
  
  // Trim whitespace first
  SERVER_SECRET = SERVER_SECRET.trim();
  
  // Check if first/last characters are quotes and remove them
  if ((SERVER_SECRET.startsWith('"') && SERVER_SECRET.endsWith('"')) ||
      (SERVER_SECRET.startsWith("'") && SERVER_SECRET.endsWith("'"))) {
    console.warn('⚠️ WARNING: Server Secret has quote characters at start/end - removing them');
    SERVER_SECRET = SERVER_SECRET.slice(1, -1).trim();
    console.log(`DEBUG: After removing quotes, length: ${SERVER_SECRET.length}`);
  }
}

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

  // CRITICAL: Log UserID information for debugging
  console.log('=== ZEGOCLOUD Token Generation - UserID Verification ===');
  console.log(`📥 Received userId from frontend: "${userId}"`);
  console.log(`🔐 Authenticated user UID (context.auth.uid): "${context.auth.uid}"`);
  console.log(`✓ UserID match check: ${userId === context.auth.uid ? 'MATCH ✓' : 'MISMATCH ✗'}`);
  console.log('========================================================');

  // Verify userId matches authenticated user (security check)
  if (userId !== context.auth.uid) {
    console.error(`❌ ERROR: UserID mismatch! Frontend sent "${userId}" but authenticated user is "${context.auth.uid}"`);
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
  if (!SERVER_SECRET || SERVER_SECRET.trim() === '') {
    console.error('ZEGOCLOUD_SERVER_SECRET is set but empty');
    throw new functions.https.HttpsError(
      'failed-precondition',
      'ZEGOCLOUD Server Secret is empty. Please set a valid Server Secret in Firebase Functions configuration.'
    );
  }
  
  // Validate Server Secret format (should be 32 hex characters)
  // ZEGOCLOUD Server Secrets are typically 32-character hex strings
  const secretPattern = /^[0-9a-fA-F]{32}$/;
  
  // Enhanced debugging for Server Secret
  console.log('=== Server Secret Validation ===');
  console.log(`DEBUG: Secret first char: "${SERVER_SECRET.charAt(0)}" (char code: ${SERVER_SECRET.charCodeAt(0)})`);
  console.log(`DEBUG: Secret last char: "${SERVER_SECRET.charAt(SERVER_SECRET.length - 1)}" (char code: ${SERVER_SECRET.charCodeAt(SERVER_SECRET.length - 1)})`);
  console.log(`DEBUG: Secret length: ${SERVER_SECRET.length} (expected: 32)`);
  // A valid ZEGOCLOUD secret is exactly 32 characters. If length is 34, it definitely has extra quotes.
  if (SERVER_SECRET.length === 34) {
    console.error('❌ ERROR: Secret length is 34 characters! This means it has extra quotes.');
    console.error('   The secret should be exactly 32 hex characters, not 34.');
    console.error('   If you set it via CLI with quotes, Firebase may have included the quotes in the value.');
    console.error('   Solution: Remove quotes when setting: firebase functions:config:set zegocloud.server_secret=YOUR_SECRET (no quotes)');
  } else if (SERVER_SECRET.length !== 32) {
    console.warn(`⚠️ WARNING: Server Secret length is ${SERVER_SECRET.length}, expected 32 hex characters.`);
    console.warn(`   First 10 chars: ${SERVER_SECRET.substring(0, 10)}...`);
    console.warn(`   This might cause error 50119 (token auth err) if the secret is incorrect.`);
  }
  console.log(`SERVER_SECRET format check: ${secretPattern.test(SERVER_SECRET) ? 'Valid (32 hex chars) ✓' : 'Invalid format ⚠️'}`);
  console.log('=================================');
  
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

    console.log('=== Token Generation Parameters ===');
    console.log(`📝 APP_ID: ${APP_ID} (type: ${typeof APP_ID})`);
    console.log(`👤 USERID: "${userId}" (type: ${typeof userId}, length: ${userId.length})`);
    console.log(`🏠 roomID: "${roomID}"`);
    console.log(`🔑 SERVER_SECRET length: ${SERVER_SECRET ? SERVER_SECRET.length : 0}`);
    console.log(`⏱️  Token expires in: ${effectiveTimeInSeconds} seconds`);
    console.log(`📦 Payload object:`, JSON.stringify(payloadObject));
    console.log('====================================');

    console.log(`🔨 Calling generateToken04 with userId="${userId}"`);
    const token = generateToken04(
      parseInt(APP_ID),
      userId, // CRITICAL: This UserID MUST match the userID used in loginRoom() on frontend
      SERVER_SECRET,
      effectiveTimeInSeconds,
      payloadObject
    );
    console.log(`✅ Token generated successfully for userId="${userId}"`);

    console.log(`Generated token for user ${userId} in room ${roomID}`);
    console.log(`Token length: ${token.length}`);
    console.log(`Token format check: ${token.includes('.') ? 'Has dot separator ✓' : 'Missing dot separator ✗'}`);
    console.log(`Token parts: ${token.split('.').length} parts (expected 2)`);
    console.log(`Token preview: ${token.substring(0, 50)}...`);
    
    // Decode token to verify contents
    try {
      const [tokenPart, signaturePart] = token.split('.');
      const decodedToken = JSON.parse(Buffer.from(tokenPart, 'base64').toString('utf8'));
      
      console.log('=== Token Verification ===');
      console.log(`📱 Decoded token app_id: ${decodedToken.app_id} (expected: ${APP_ID}) ${parseInt(decodedToken.app_id) === parseInt(APP_ID) ? '✓' : '✗'}`);
      console.log(`👤 Decoded token user_id: "${decodedToken.user_id}" (expected: "${userId}") ${decodedToken.user_id === userId ? '✓ MATCH' : '✗ MISMATCH!'}`);
      console.log(`🏠 Decoded token room_id: ${decodedToken.payload ? JSON.parse(decodedToken.payload).room_id : 'N/A'}`);
      console.log(`⏰ Token expires at: ${new Date(decodedToken.expire * 1000).toISOString()}`);
      console.log(`📋 Token structure: version=${decodedToken.version}, app_id=${decodedToken.app_id}, user_id="${decodedToken.user_id}"`);
      console.log('==========================');
      
      // CRITICAL: Verify UserID matches
      if (decodedToken.user_id !== userId) {
        console.error(`❌ CRITICAL ERROR: Token user_id ("${decodedToken.user_id}") does not match requested userId ("${userId}")!`);
        console.error(`   This token will FAIL authentication with error 50119!`);
        console.error(`   Frontend MUST use userID="${decodedToken.user_id}" in loginRoom() call!`);
      } else {
        console.log(`✅ UserID verification: Token user_id matches requested userId`);
        console.log(`✅ IMPORTANT: Frontend must use userID="${decodedToken.user_id}" in loginRoom() for this token to work`);
      }
      
      // Verify App ID matches
      if (parseInt(decodedToken.app_id) !== parseInt(APP_ID)) {
        console.error(`❌ ERROR: Token app_id (${decodedToken.app_id}) does not match configured APP_ID (${APP_ID})!`);
      }
      
      // Verify token structure
      console.log(`Token has required fields: ${decodedToken.version && decodedToken.app_id && decodedToken.user_id ? 'Yes ✓' : 'No ✗'}`);
    } catch (decodeError) {
      console.error('⚠️ Could not decode token for verification:', decodeError);
    }
    
    // Additional validation
    if (!token || token.length < 100) {
      console.error('⚠️ WARNING: Generated token seems too short. This might indicate an issue.');
    }
    
    if (!token.includes('.')) {
      console.error('❌ ERROR: Token is missing the dot separator. Token format is incorrect.');
    }
    
    console.log('');
    console.log('📝 If you receive error 50119 (token auth err) from ZEGOCLOUD:');
    console.log('   This means ZEGOCLOUD rejected the token signature. Troubleshooting steps:');
    console.log('');
    console.log('   STEP 1: Verify Token Authentication is Enabled in ZEGOCLOUD Console');
    console.log('      - Go to: https://console.zegocloud.com');
    console.log('      - Navigate to: Your Project → Settings → Basic Configurations');
    console.log('      - Check "Authentication Mode" - it should be set to "Token" (not "AppSign")');
    console.log('      - If it\'s set to "AppSign", change it to "Token" and save');
    console.log('      - Wait 2-3 minutes for changes to propagate');
    console.log('');
    console.log('   STEP 2: Verify Server Secret Format');
    console.log('      - In ZEGOCLOUD Console → Settings → Basic Configurations');
    console.log('      - Find "ServerSecret" (NOT "AppSecret", NOT "CallbackSecret")');
    console.log('      - It should be exactly 32 hex characters (0-9, a-f, A-F)');
    console.log(`      - Current Server Secret length: ${SERVER_SECRET.length}`);
    console.log(`      - Current Server Secret format: ${secretPattern.test(SERVER_SECRET) ? 'Valid (32 hex) ✓' : 'Invalid format ⚠️'}`);
    console.log('      - Copy it EXACTLY (no spaces, no quotes)');
    console.log('      - First 10 characters of your secret: ' + SERVER_SECRET.substring(0, 10) + '...');
    console.log('');
    console.log('   STEP 3: Verify App ID');
    console.log(`      - Current App ID: ${APP_ID}`);
    console.log('      - In ZEGOCLOUD Console, verify App ID matches exactly: 128222087');
    console.log('');
    console.log('   STEP 4: Set Server Secret in Firebase Functions');
    console.log('      firebase functions:config:set zegocloud.server_secret="YOUR_SERVER_SECRET"');
    console.log('      (Replace YOUR_SERVER_SECRET with the exact 32-char hex string from ZEGOCLOUD Console)');
    console.log('      (Use quotes, but NO spaces inside the quotes)');
    console.log('      firebase deploy --only functions:generateZegoToken');
    console.log('');
    console.log('   STEP 5: Verify Configuration After Deployment');
    console.log('      - Wait 2-3 minutes for deployment');
    console.log('      - Check function logs: firebase functions:log --only generateZegoToken');
    console.log('      - Look for "SERVER_SECRET format check: Valid" message');
    console.log('      - If it says "Invalid", the secret format is wrong');
    console.log('');
    console.log('   STEP 6: Test Again');
    console.log('      - Clear browser cache (Ctrl+Shift+Delete)');
    console.log('      - Hard refresh (Ctrl+Shift+R)');
    console.log('      - Try calling again');
    console.log('');
    console.log('   If still failing after all steps:');
    console.log('      - Contact ZEGOCLOUD Support with your App ID and error code 50119');
    console.log('      - They can verify if your Server Secret matches their records');
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

