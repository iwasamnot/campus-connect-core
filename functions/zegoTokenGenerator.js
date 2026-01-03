/**
 * ZEGOCLOUD Token Generator (Manual Implementation)
 * Based on ZEGOCLOUD's token generation algorithm
 * 
 * Reference: https://github.com/ZEGOCLOUD/zego_server_assistant
 * Token04 Format: Base64(JSON(token) + '.' + HMAC-SHA256(JSON(token), secret))
 */

const crypto = require('crypto');

/**
 * Generate ZEGOCLOUD Token04
 * @param {number} appID - ZEGOCLOUD App ID
 * @param {string} userID - User ID
 * @param {string} secret - Server Secret
 * @param {number} effectiveTimeInSeconds - Token expiration time in seconds
 * @param {Object} payload - Payload object with room_id, privilege, etc.
 * @returns {string} Generated token
 */
function generateToken04(appID, userID, secret, effectiveTimeInSeconds, payload) {
  if (!appID || !userID || !secret) {
    throw new Error('appID, userID, and secret are required');
  }

  // Create payload JSON string (must be compact, no spaces)
  const payloadJson = JSON.stringify(payload);
  
  // Create token structure
  // IMPORTANT: Key order matters for ZEGOCLOUD token signature verification
  // Order must be: version, app_id, user_id, nonce, ctime, expire, payload
  const token = {
    version: '04',
    app_id: parseInt(appID), // Ensure it's a number
    user_id: String(userID), // Ensure it's a string
    nonce: Math.floor(Math.random() * 2147483647),
    ctime: Math.floor(Date.now() / 1000),
    expire: Math.floor(Date.now() / 1000) + effectiveTimeInSeconds,
    payload: payloadJson
  };

  // Create compact JSON string (no spaces)
  // JavaScript JSON.stringify maintains key insertion order, which is what we need
  const tokenString = JSON.stringify(token);
  
  // Generate signature using HMAC-SHA256
  // Important: Use the secret as-is (it should be a string)
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(tokenString);
  // Get signature as Buffer (binary) for proper Base64 encoding
  const signature = hmac.digest(); // Returns Buffer, not hex string
  
  // ZEGOCLOUD Token04 format: Base64(JSON(token)) + '.' + Base64(HMAC-SHA256(...))
  // NOT: Base64(JSON(token) + '.' + HMAC-SHA256(...))
  const encodedTokenString = Buffer.from(tokenString, 'utf8').toString('base64');
  const encodedSignature = signature.toString('base64'); // Buffer to Base64 directly
  
  // Combine: Base64(token) + '.' + Base64(signature)
  const finalToken = encodedTokenString + '.' + encodedSignature;
  
  return finalToken;
}

module.exports = { generateToken04 };

