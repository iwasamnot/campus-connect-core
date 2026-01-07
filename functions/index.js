/**
 * Firebase Cloud Functions Index
 * Exports all Cloud Functions
 */

const deleteOldFiles = require('./deleteOldFiles');
const sendScheduledMessages = require('./sendScheduledMessages');
const generateZegoToken = require('./generateZegoToken');
const getVideoSDKToken = require('./getVideoSDKToken');

exports.deleteOldFiles = deleteOldFiles.deleteOldFiles;
exports.sendScheduledMessages = sendScheduledMessages.sendScheduledMessages;
exports.generateZegoToken = generateZegoToken.generateZegoToken;
exports.getVideoSDKToken = getVideoSDKToken.getVideoSDKToken;

