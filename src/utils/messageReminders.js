/**
 * Message Reminders Utility
 * Check and trigger reminders for messages
 */

/**
 * Check for due reminders and show notifications
 */
export const checkReminders = async (messages, user, notificationService) => {
  if (!user?.uid || !messages || messages.length === 0) return;

  const now = new Date();
  const dueReminders = messages.filter(message => {
    if (!message.reminder || message.reminder.userId !== user.uid) return false;
    
    const reminderTime = message.reminder.reminderAt?.seconds 
      ? new Date(message.reminder.reminderAt.seconds * 1000)
      : new Date(message.reminder.reminderAt);
    
    // Check if reminder is due (within last 5 minutes to avoid duplicates)
    const timeDiff = now - reminderTime;
    return timeDiff >= 0 && timeDiff < 300000; // 5 minutes window
  });

  for (const message of dueReminders) {
    try {
      // Show notification
      if (notificationService && notificationService.show) {
        await notificationService.show({
          title: 'Message Reminder',
          body: message.displayText || message.text || 'You have a reminder',
          icon: '/logo.png',
          tag: `reminder-${message.id}`,
          data: {
            messageId: message.id,
            type: 'reminder'
          }
        });
      }

      // Optionally mark reminder as notified
      // This would require updating the message document
    } catch (error) {
      console.error('Error showing reminder notification:', error);
    }
  }
};

/**
 * Format reminder time for display
 */
export const formatReminderTime = (reminder) => {
  if (!reminder || !reminder.reminderAt) return null;
  
  const reminderTime = reminder.reminderAt?.seconds 
    ? new Date(reminder.reminderAt.seconds * 1000)
    : new Date(reminder.reminderAt);
  
  const now = new Date();
  const diff = reminderTime - now;

  if (diff < 0) return 'Overdue';
  if (diff < 3600000) return `In ${Math.floor(diff / 60000)} minutes`;
  if (diff < 86400000) return `In ${Math.floor(diff / 3600000)} hours`;
  return reminderTime.toLocaleDateString();
};
