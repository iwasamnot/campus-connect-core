/**
 * Cloud Function to delete files older than 24 hours from Firebase Storage
 * This helps stay within the free tier limits
 * 
 * Deploy: firebase deploy --only functions:deleteOldFiles
 * Schedule: Runs daily at midnight UTC
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');

if (!admin.apps.length) {
  admin.initializeApp();
}

// Delete files older than 24 hours
exports.deleteOldFiles = functions.pubsub
  .schedule('0 0 * * *') // Run daily at midnight UTC
  .timeZone('UTC')
  .onRun(async (context) => {
    const storage = getStorage();
    const bucket = storage.bucket();
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000); // 24 hours in milliseconds
    
    let deletedCount = 0;
    let errorCount = 0;
    
    try {
      // Folders to clean
      const folders = [
        'messages/',
        'profile-pictures/',
        'group-files/',
        'private-chat-files/'
      ];
      
      for (const folder of folders) {
        const [files] = await bucket.getFiles({ prefix: folder });
        
        for (const file of files) {
          const metadata = await file.getMetadata();
          const created = new Date(metadata[0].timeCreated).getTime();
          const fileSize = parseInt(metadata[0].size || 0);
          const fiveMB = 5 * 1024 * 1024; // 5MB in bytes
          
          // Delete only files that are BOTH older than 24 hours AND larger than 5MB
          if (created < twentyFourHoursAgo && fileSize > fiveMB) {
            try {
              await file.delete();
              deletedCount++;
              console.log(`Deleted: ${file.name} (${(fileSize / 1024 / 1024).toFixed(2)}MB, created: ${new Date(created).toISOString()})`);
            } catch (error) {
              errorCount++;
              console.error(`Error deleting ${file.name}:`, error);
            }
          }
        }
      }
      
      console.log(`Cleanup complete. Deleted: ${deletedCount}, Errors: ${errorCount}`);
      
      // Log to Firestore for admin tracking
      await admin.firestore().collection('auditLogs').add({
        action: 'storage_cleanup',
        deletedCount,
        errorCount,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        performedBy: 'system'
      });
      
      return { deletedCount, errorCount };
    } catch (error) {
      console.error('Error in deleteOldFiles:', error);
      throw error;
    }
  });

