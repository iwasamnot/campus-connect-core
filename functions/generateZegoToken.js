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
 * 1. Set secret: firebase functions:secrets:set ZEGO_SERVER_SECRET
 * 2. Deploy function: firebase deploy --only functions:generateZegoToken
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

// ZEGOCLOUD Token Generator (Manual Implementation)
const { generateToken04 } = require('./zegoTokenGenerator');

// ZEGOCLOUD App ID (hardcoded, must be a NUMBER, not a string)
const APP_ID = 128222087; // Number type

// Firebase Functions v2 with Secret Manager
// The secret ZEGO_SERVER_SECRET must be set using: firebase functions:secrets:set ZEGO_SERVER_SECRET
exports.generateZegoToken = onCall(
  {
    secrets: ['ZEGO_SERVER_SECRET']
  },
  async (request) => {
    // Verify user is authenticated
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated to generate tokens'
      );
    }

    // Get Server Secret from Secret Manager (v2)
    const serverSecret = process.env.ZEGO_SERVER_SECRET;
    
    // Validate input
    const { userId, roomID } = request.data;
    if (!userId || !roomID) {
      throw new HttpsError(
        'invalid-argument',
        'userId and roomID are required'
      );
    }

    // CRITICAL: Log UserID information for debugging
    console.log('=== ZEGOCLOUD Token Generation - UserID Verification ===');
    console.log(`📥 Received userId from frontend: "${userId}"`);
    console.log(`🔐 Authenticated user UID (request.auth.uid): "${request.auth.uid}"`);
    console.log(`✓ UserID match check: ${userId === request.auth.uid ? 'MATCH ✓' : 'MISMATCH ✗'}`);
    console.log('========================================================');

    // Verify userId matches authenticated user (security check)
    if (userId !== request.auth.uid) {
      console.error(`❌ ERROR: UserID mismatch! Frontend sent "${userId}" but authenticated user is "${request.auth.uid}"`);
      throw new HttpsError(
        'permission-denied',
        'User can only generate tokens for themselves'
      );
    }

    // Check if Server Secret is configured
    if (!serverSecret) {
      console.error('=== ZEGO_SERVER_SECRET Configuration Error ===');
      console.error('ZEGO_SERVER_SECRET is not set in Secret Manager');
      console.error('===================================================');
      console.error('');
      console.error('📝 To fix this, run:');
      console.error('   firebase functions:secrets:set ZEGO_SERVER_SECRET');
      console.error('   (Enter your 32-character hex Server Secret when prompted)');
      console.error('   firebase deploy --only functions:generateZegoToken');
      console.error('');
      throw new HttpsError(
        'failed-precondition',
        'ZEGOCLOUD Server Secret is not configured. Check function logs for setup instructions.'
      );
    }

    // Trim whitespace and handle quote issues
    let SERVER_SECRET = serverSecret.trim();
    
    // Check if first/last characters are quotes and remove them
    if ((SERVER_SECRET.startsWith('"') && SERVER_SECRET.endsWith('"')) ||
        (SERVER_SECRET.startsWith("'") && SERVER_SECRET.endsWith("'"))) {
      console.warn('⚠️ WARNING: Server Secret has quote characters at start/end - removing them');
      SERVER_SECRET = SERVER_SECRET.slice(1, -1).trim();
    }

    // Verify Server Secret is not empty
    if (!SERVER_SECRET || SERVER_SECRET.trim() === '') {
      console.error('ZEGO_SERVER_SECRET is set but empty');
      throw new HttpsError(
        'failed-precondition',
        'ZEGOCLOUD Server Secret is empty. Please set a valid Server Secret in Secret Manager.'
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
      console.error('   Solution: Update the secret in Secret Manager without quotes');
    } else if (SERVER_SECRET.length !== 32) {
      console.warn(`⚠️ WARNING: Server Secret length is ${SERVER_SECRET.length}, expected 32 hex characters.`);
      console.warn(`   First 10 chars: ${SERVER_SECRET.substring(0, 10)}...`);
      console.warn(`   This might cause error 50119 (token auth err) if the secret is incorrect.`);
    }
    console.log(`SERVER_SECRET format check: ${secretPattern.test(SERVER_SECRET) ? 'Valid (32 hex chars) ✓' : 'Invalid format ⚠️'}`);
    console.log('=================================');

    // Verification Log (as requested)
    console.log(`Generating token for User: ${userId}, Secret Length: ${SERVER_SECRET.length}`);

    if (SERVER_SECRET.length !== 32) {
      throw new HttpsError(
        'failed-precondition',
        'Invalid Secret Length - Check Zego Console. Secret must be exactly 32 hex characters.'
      );
    }

    console.log(`Using APP_ID: ${APP_ID}, SERVER_SECRET length: ${SERVER_SECRET.length} (hidden for security)`);

    try {
      // Generate token
      // Token expires in 1 hour (3600 seconds) - standard for testing
      const effectiveTimeInSeconds = 3600;
      
      // Use empty string payload for basic tokens (as recommended for testing)
      // For room-restricted tokens, use payload object with room_id
      const payload = "";

      console.log('=== Token Generation Parameters ===');
      console.log(`📝 APP_ID: ${APP_ID} (type: ${typeof APP_ID}) - MUST be number`);
      console.log(`👤 USERID: "${userId}" (type: ${typeof userId}, length: ${userId.length}) - MUST be string`);
      console.log(`🏠 roomID: "${roomID}" (for reference only)`);
      console.log(`🔑 SERVER_SECRET length: ${SERVER_SECRET ? SERVER_SECRET.length : 0} - MUST be exactly 32`);
      console.log(`⏱️  Token expires in: ${effectiveTimeInSeconds} seconds`);
      console.log(`📦 Payload: "${payload}" (empty string for basic token)`);
      console.log('====================================');

      // CRITICAL: Ensure types match ZEGOCLOUD requirements exactly
      // generateToken04 expects: (appID: number, userID: string, secret: string, effectiveTimeInSeconds: number, payload: string)
      // APP_ID is already a number constant (128222087)
      const appIDNum = APP_ID; // Already a number, no conversion needed
      const userIDStr = String(userId); // Ensure it's a string
      const secretStr = String(SERVER_SECRET); // Ensure it's a string
      const effectiveTimeInt = parseInt(effectiveTimeInSeconds); // Ensure it's an integer
      
      console.log(`🔨 Calling generateToken04 with:`);
      console.log(`   appID: ${appIDNum} (type: ${typeof appIDNum})`);
      console.log(`   userID: "${userIDStr}" (type: ${typeof userIDStr})`);
      console.log(`   secret: length ${secretStr.length} (type: ${typeof secretStr})`);
      console.log(`   effectiveTime: ${effectiveTimeInt} (type: ${typeof effectiveTimeInt})`);
      console.log(`   payload: "${payload}" (type: ${typeof payload})`);
      
      const token = generateToken04(
        appIDNum,        // Number (128222087) - MUST be number, not string
        userIDStr,       // String (must match frontend user.uid exactly)
        secretStr,       // String (32 hex characters)
        effectiveTimeInt, // Number (integer)
        payload          // String (empty string "" for basic tokens)
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
      console.log('   STEP 4: Update Secret in Firebase Secret Manager');
      console.log('      firebase functions:secrets:set ZEGO_SERVER_SECRET');
      console.log('      (Enter the exact 32-char hex string from ZEGOCLOUD Console, no quotes)');
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
      throw new HttpsError(
        'internal',
        'Failed to generate token',
        error.message
      );
    }
  }
);
