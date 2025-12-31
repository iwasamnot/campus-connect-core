/**
 * Cloud Function to send scheduled messages
 * Runs every minute to check for scheduled messages that need to be sent
 * 
 * Deploy: firebase deploy --only functions:sendScheduledMessages
 * Schedule: Runs every minute
 */

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

      for (const docSnapshot of scheduledMessagesQuery.docs) {
        try {
          const scheduledMsg = docSnapshot.data();
          const scheduledMsgId = docSnapshot.id;
          const scheduledTime = scheduledMsg.scheduledTime?.toDate?.() || new Date(scheduledMsg.scheduledTime);

          // Double-check the time has actually passed (safety check)
          if (scheduledTime > new Date()) {
            continue;
          }

          // Get user data for the message
          const userDoc = await db.collection('users').doc(scheduledMsg.userId).get();
          const userData = userDoc.exists ? userDoc.data() : null;
          const userName = userData?.name || userData?.studentEmail || 'Unknown User';
          const userEmail = userData?.studentEmail || userData?.personalEmail || null;

          // Prepare message data (matching the structure used in ChatArea)
          const messageData = {
            userId: scheduledMsg.userId,
            userEmail: userEmail,
            userName: userName,
            text: scheduledMsg.text,
            displayText: scheduledMsg.text,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            toxic: false, // Scheduled messages bypass toxicity check for now
            reactions: {},
            edited: false,
            readBy: {
              [scheduledMsg.userId]: admin.firestore.FieldValue.serverTimestamp()
            }
          };

          // Send to appropriate collection based on chatType
          if (scheduledMsg.chatType === 'global') {
            // Send to global messages
            await db.collection('messages').add(messageData);
            console.log(`Sent scheduled message ${scheduledMsgId} to global chat`);
          } else if (scheduledMsg.chatType === 'private' && scheduledMsg.targetUserId) {
            // For private messages, create/find chat and send message
            const chatId = [scheduledMsg.userId, scheduledMsg.targetUserId].sort().join('_');
            const chatRef = db.collection('privateChats').doc(chatId);
            
            // Ensure chat exists
            const chatDoc = await chatRef.get();
            if (!chatDoc.exists) {
              await chatRef.set({
                participants: [scheduledMsg.userId, scheduledMsg.targetUserId].sort(),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                lastMessage: scheduledMsg.text,
                lastMessageTime: admin.firestore.FieldValue.serverTimestamp()
              });
            } else {
              // Update last message
              await chatRef.update({
                lastMessage: scheduledMsg.text,
                lastMessageTime: admin.firestore.FieldValue.serverTimestamp()
              });
            }
            
            // Add message to chat
            await chatRef.collection('messages').add(messageData);
            console.log(`Sent scheduled message ${scheduledMsgId} to private chat ${chatId}`);
          } else if (scheduledMsg.chatType === 'group' && scheduledMsg.groupId) {
            // For group messages, send to group messages collection
            await db.collection('groups').doc(scheduledMsg.groupId).collection('messages').add(messageData);
            
            // Update group's last message
            await db.collection('groups').doc(scheduledMsg.groupId).update({
              lastMessage: scheduledMsg.text,
              lastMessageTime: admin.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`Sent scheduled message ${scheduledMsgId} to group ${scheduledMsg.groupId}`);
          } else {
            console.warn(`Skipping scheduled message ${scheduledMsgId} - missing required fields for ${scheduledMsg.chatType} chat`);
            errorCount++;
            continue;
          }

          // Mark as sent
          await db.collection('scheduledMessages').doc(scheduledMsgId).update({
            sent: true,
            sentAt: admin.firestore.FieldValue.serverTimestamp()
          });

          processedCount++;
        } catch (error) {
          console.error(`Error processing scheduled message ${docSnapshot.id}:`, error);
          errorCount++;
        }
      }

      console.log(`Processed ${processedCount} scheduled messages, ${errorCount} errors`);
      return { processedCount, errorCount };
    } catch (error) {
      console.error('Error in sendScheduledMessages:', error);
      return null;
    }
  });
