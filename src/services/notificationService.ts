import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!this.instance) {
      this.instance = new NotificationService();
    }
    return this.instance;
  }

  async setup() {
    await this.requestPermissions();
    this.configurePushNotifications();
  }

  private async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      throw new Error('Permission not granted for notifications');
    }
  }

  private configurePushNotifications() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  async sendLocalNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>
  ) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
      },
      trigger: null,
    });
  }

  async sendEmergencyNotification(
    title: string,
    body: string,
    location: GeoPoint
  ) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚨 ${title}`,
        body,
        data: { location },
        sound: 'emergency.wav',
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null,
    });
  }
}

export const notificationService = NotificationService.getInstance(); 