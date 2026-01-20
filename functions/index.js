/**
 * Firebase Cloud Functions Index
 * Exports all Cloud Functions
 */

const deleteOldFiles = require('./deleteOldFiles');
const sendScheduledMessages = require('./sendScheduledMessages');
const generateZegoToken = require('./generateZegoToken');
const getVideoSDKToken = require('./getVideoSDKToken');
const ragService = require('./ragService');

exports.deleteOldFiles = deleteOldFiles.deleteOldFiles;
exports.sendScheduledMessages = sendScheduledMessages.sendScheduledMessages;
// Video SDK functions renamed to V1 to avoid v2 upgrade conflict
exports.generateZegoTokenV1 = generateZegoToken.generateZegoTokenV1;
exports.getVideoSDKTokenV1 = getVideoSDKToken.getVideoSDKTokenV1;
exports.ragSearch = ragService.ragSearch;
exports.ragUpsert = ragService.ragUpsert;

