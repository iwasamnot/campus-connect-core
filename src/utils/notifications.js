// Browser notifications utility
class NotificationService {
  constructor() {
    this.permission = null;
    this.checkPermission();
  }

  async checkPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    this.permission = Notification.permission;
    
    if (this.permission === 'default') {
      this.permission = await Notification.requestPermission();
    }

    return this.permission === 'granted';
  }

  async show(title, options = {}) {
    const hasPermission = await this.checkPermission();
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return null;
    }

    const defaultOptions = {
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'campus-connect',
      requireInteraction: false,
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);
      
      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options.onClick) {
          options.onClick();
        }
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  async showMessage(message, userName) {
    return this.show(`New message from ${userName}`, {
      body: message.text || message.displayText || 'New message',
      icon: message.userProfilePicture || '/logo.png',
      onClick: () => {
        // Focus on the app window
        window.focus();
      }
    });
  }

  async showMention(message, userName) {
    return this.show(`You were mentioned by ${userName}`, {
      body: message.text || message.displayText || 'You were mentioned',
      icon: message.userProfilePicture || '/logo.png',
      requireInteraction: true
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;

