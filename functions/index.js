/**
 * Firebase Cloud Functions Index
 * Exports all Cloud Functions
 */

const deleteOldFiles = require('./deleteOldFiles');
const sendScheduledMessages = require('./sendScheduledMessages');

exports.deleteOldFiles = deleteOldFiles.deleteOldFiles;
exports.sendScheduledMessages = sendScheduledMessages.sendScheduledMessages;

