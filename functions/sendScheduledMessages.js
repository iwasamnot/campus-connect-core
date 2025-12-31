const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

// Process scheduled messages every minute
exports.sendScheduledMessages = functions.pubsub
  .schedule('* * * * *') // Run every minute
  .timeZone('UTC')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    
    try {
      // Find all unsent scheduled messages where scheduledTime has passed
      const scheduledMessagesQuery = await db.collection('scheduledMessages')
        .where('sent', '==', false)
        .where('scheduledTime', '<=', now)
        .limit(50) // Process up to 50 messages per run
        .get();

      if (scheduledMessagesQuery.empty) {
        console.log('No scheduled messages to process');
        return null;
      }

      let processedCount = 0;
      let errorCount = 0;

      const batch = db.batch();

      for (const docSnapshot of scheduledMessagesQuery.docs) {
        try {
          const scheduledMsg = docSnapshot.data();
          const scheduledMsgId = docSnapshot.id;
          const scheduledTime = scheduledMsg.scheduledTime?.toDate?.() || new Date(scheduledMsg.scheduledTime);

          // Double-check the time has actually passed (safety check)
          if (scheduledTime > new Date()) {
            continue;
          }

          // Prepare message data
          const messageData = {
            userId: scheduledMsg.userId,
            text: scheduledMsg.text,
            displayText: scheduledMsg.text,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            toxic: false, // Scheduled messages bypass toxicity check for now
            readBy: {
              [scheduledMsg.userId]: admin.firestore.FieldValue.serverTimestamp()
            }
          };

          // Send to appropriate collection based on chatType
          if (scheduledMsg.chatType === 'global') {
            // Send to global messages
            await db.collection('messages').add(messageData);
            console.log(`Sent scheduled message ${scheduledMsgId} to global chat`);
          } else if (scheduledMsg.chatType === 'private') {
            // For private messages, we need a target user ID
            // Since we don't have this in the scheduled message, skip for now
            // TODO: Add targetUserId to scheduled messages for private chats
            console.warn(`Skipping private scheduled message ${scheduledMsgId} - targetUserId required`);
            errorCount++;
            continue;
          } else if (scheduledMsg.chatType === 'group') {
            // For group messages, we need a group ID
            // Since we don't have this in the scheduled message, skip for now
            // TODO: Add groupId to scheduled messages for group chats
            console.warn(`Skipping group scheduled message ${scheduledMsgId} - groupId required`);
            errorCount++;
            continue;
          }

          // Mark as sent
          batch.update(db.collection('scheduledMessages').doc(scheduledMsgId), {
            sent: true,
            sentAt: admin.firestore.FieldValue.serverTimestamp()
          });

          processedCount++;
        } catch (error) {
          console.error(`Error processing scheduled message ${docSnapshot.id}:`, error);
          errorCount++;
        }
      }

      // Commit all updates
      if (processedCount > 0) {
        await batch.commit();
        console.log(`Processed ${processedCount} scheduled messages, ${errorCount} errors`);
      }

      return { processedCount, errorCount };
    } catch (error) {
      console.error('Error in sendScheduledMessages:', error);
      return null;
    }
  });

