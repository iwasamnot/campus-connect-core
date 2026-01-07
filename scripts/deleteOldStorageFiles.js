/**
 * Script to delete files older than 24 hours from Firebase Storage
 * Can be run manually or via GitHub Actions
 * 
 * Usage: node scripts/deleteOldStorageFiles.js
 * Or: npm run cleanup-storage
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // You'll need to add this

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'campus-connect-sistc.firebasestorage.app'
});

async function deleteOldFiles() {
  const storage = admin.storage();
  const bucket = storage.bucket();
  const now = Date.now();
  const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000); // 24 hours
  
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
    
    console.log('Starting cleanup of files older than 24 hours...');
    console.log(`Current time: ${new Date(now).toISOString()}`);
    console.log(`Deleting files created before: ${new Date(twentyFourHoursAgo).toISOString()}`);
    
    for (const folder of folders) {
      console.log(`\nChecking folder: ${folder}`);
      const [files] = await bucket.getFiles({ prefix: folder });
      console.log(`Found ${files.length} files in ${folder}`);
      
      for (const file of files) {
        try {
          const [metadata] = await file.getMetadata();
          const created = new Date(metadata.timeCreated).getTime();
          
          const fileSize = parseInt(metadata.size || 0);
          const fiveMB = 5 * 1024 * 1024; // 5MB in bytes
          
          // Delete only files that are BOTH older than 24 hours AND larger than 5MB
          if (created < twentyFourHoursAgo && fileSize > fiveMB) {
            await file.delete();
            deletedCount++;
            console.log(`  ✓ Deleted: ${file.name} (${(fileSize / 1024 / 1024).toFixed(2)}MB, created: ${new Date(created).toISOString()})`);
          } else if (created < twentyFourHoursAgo) {
            console.log(`  - Keeping: ${file.name} (${(fileSize / 1024 / 1024).toFixed(2)}MB - too small, created: ${new Date(created).toISOString()})`);
          } else {
            console.log(`  - Keeping: ${file.name} (${(fileSize / 1024 / 1024).toFixed(2)}MB - too recent, created: ${new Date(created).toISOString()})`);
          }
        } catch (error) {
          errorCount++;
          console.error(`  ✗ Error processing ${file.name}:`, error.message);
        }
      }
    }
    
    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Deleted: ${deletedCount} files`);
    console.log(`   Errors: ${errorCount}`);
    
    // Log to Firestore
    try {
      await admin.firestore().collection('auditLogs').add({
        action: 'storage_cleanup',
        deletedCount,
        errorCount,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        performedBy: 'script',
        folders: folders
      });
      console.log('   Logged to auditLogs');
    } catch (error) {
      console.error('   Error logging to auditLogs:', error.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

deleteOldFiles();

