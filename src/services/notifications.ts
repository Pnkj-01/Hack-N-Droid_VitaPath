import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function setupNotifications() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return true;
}

export async function sendGroupAlert(groupId: string, title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { groupId },
    },
    trigger: null,
  });
}

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationOptions {
  type: NotificationType;
  message: string;
  duration?: number;
}

class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!this.instance) {
      this.instance = new NotificationService();
    }
    return this.instance;
  }

  async show({ type, message, duration = 5000 }: NotificationOptions): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: this.getTitle(type),
          body: message,
          data: { type },
        },
        trigger: duration === 0 ? null : { seconds: 1 },
      });
    } catch (error) {
      console.error('Notification error:', error);
    }
  }

  private getTitle(type: NotificationType): string {
    switch (type) {
      case 'error': return 'Error';
      case 'warning': return 'Warning';
      case 'success': return 'Success';
      default: return 'Notification';
    }
  }
}

export const notificationService = NotificationService.getInstance(); 