/**
 * Firebase Cloud Functions Index
 * Exports all Cloud Functions
 */

const generateZegoToken = require('./generateZegoToken');
const getVideoSDKToken = require('./getVideoSDKToken');
const ragService = require('./ragService');
const ollamaProxy = require('./ollamaProxy');

// Video SDK functions renamed to V1 to avoid v2 upgrade conflict
exports.generateZegoTokenV1 = generateZegoToken.generateZegoTokenV1;
exports.getVideoSDKTokenV1 = getVideoSDKToken.getVideoSDKTokenV1;
exports.ragSearch = ragService.ragSearch;
exports.ragUpsert = ragService.ragUpsert;

// Ollama proxy for HTTPS -> HTTP requests (solves mixed content issue)
exports.ollamaProxy = ollamaProxy.ollamaProxy;

// Note: Vertex AI functions removed - using Ollama (self-hosted) and Groq (fallback) instead

