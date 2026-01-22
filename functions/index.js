/**
 * Firebase Cloud Functions Index
 * Exports all Cloud Functions
 */

const generateZegoToken = require('./generateZegoToken');
const getVideoSDKToken = require('./getVideoSDKToken');
const ragService = require('./ragService');
const generateVertexAIToken = require('./generateVertexAIToken');

// Video SDK functions renamed to V1 to avoid v2 upgrade conflict
exports.generateZegoTokenV1 = generateZegoToken.generateZegoTokenV1;
exports.getVideoSDKTokenV1 = getVideoSDKToken.getVideoSDKTokenV1;
exports.ragSearch = ragService.ragSearch;
exports.ragUpsert = ragService.ragUpsert;

// Vertex AI functions
exports.generateVertexAIResponse = generateVertexAIToken.generateVertexAIResponse;
exports.generateVertexAIEmbedding = generateVertexAIToken.generateVertexAIEmbedding;

