import * as Location from 'expo-location';
import { supabase } from './supabase';
import { 
  EmergencyAlert, 
  EmergencyZone, 
  EmergencyTemplate,
  EmergencyResponse,
  GeoPoint 
} from '../types';
import { getDistance } from '../utils/distance';
import { getStateEmergencyNumbers } from '../utils/stateEmergencyNumbers';
import { sendGroupAlert } from './notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEmergencyMessage } from '../utils/emergencyMessages';
import { prioritizeContacts } from '../utils/contactPrioritization';
import * as SMS from 'expo-sms';
import * as Linking from 'expo-linking';
import { Language } from '../types';

class EmergencyManager {
  private static instance: EmergencyManager;
  private locationSubscription?: Location.LocationSubscription;
  private activeEmergencyId?: string;

  private constructor() {}

  static getInstance(): EmergencyManager {
    if (!this.instance) {
      this.instance = new EmergencyManager();
    }
    return this.instance;
  }

  private async persistEmergencyData(data: any, key: string) {
    try {
      await AsyncStorage.setItem(
        `emergency_${key}`,
        JSON.stringify({
          data,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('Failed to persist emergency data:', error);
    }
  }

  private async getPersistedEmergencyData(key: string) {
    try {
      const stored = await AsyncStorage.getItem(`emergency_${key}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to get persisted emergency data:', error);
    }
    return null;
  }

  async startEmergencyTracking(alertId: string, userId: string) {
    this.activeEmergencyId = alertId;
    await this.persistEmergencyData({ alertId, userId }, 'active_emergency');

    // Start location tracking
    this.locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // 10 seconds
        distanceInterval: 10, // 10 meters
      },
      async (location) => {
        if (this.activeEmergencyId) {
          await this.updateEmergencyLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      }
    );

    // Set up real-time response tracking
    const subscription = supabase
      .channel(`emergency-${alertId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_responses',
          filter: `alert_id=eq.${alertId}`,
        },
        (payload) => {
          this.handleResponseUpdate(payload.new as EmergencyResponse);
        }
      )
      .subscribe();

    return () => {
      this.locationSubscription?.remove();
      subscription.unsubscribe();
    };
  }

  private async handleResponseUpdate(response: EmergencyResponse) {
    // Handle different response statuses
    switch (response.status) {
      case 'acknowledged':
        await sendGroupAlert(
          response.alert_id,
          'Emergency Update',
          'Help is on the way!'
        );
        break;
      case 'en_route':
        if (response.eta) {
          await sendGroupAlert(
            response.alert_id,
            'Emergency Update',
            `Responders will arrive in approximately ${response.eta}`
          );
        }
        break;
      case 'arrived':
        await sendGroupAlert(
          response.alert_id,
          'Emergency Update',
          'Responders have arrived at your location'
        );
        break;
    }
  }

  async updateEmergencyLocation(location: GeoPoint) {
    if (!this.activeEmergencyId) return;

    await supabase
      .from('emergency_alerts')
      .update({
        latitude: location.latitude,
        longitude: location.longitude,
        updated_at: new Date().toISOString(),
      })
      .eq('id', this.activeEmergencyId);

    // Check nearby emergency zones
    const { data: zones } = await supabase
      .from('emergency_zones')
      .select('*');

    if (zones) {
      for (const zone of zones) {
        const distance = getDistance(location, {
          latitude: zone.latitude,
          longitude: zone.longitude,
        });

        if (distance <= zone.radius) {
          await sendGroupAlert(
            this.activeEmergencyId,
            'Zone Alert',
            `You are near ${zone.name}. ${
              zone.type === 'safe' ? 'This is a safe zone.' : 'Exercise caution in this area.'
            }`
          );
        }
      }
    }
  }

  async getEmergencyTemplates(): Promise<EmergencyTemplate[]> {
    const { data } = await supabase
      .from('emergency_templates')
      .select('*')
      .order('priority', { ascending: true });

    return data || [];
  }

  async getNearbyEmergencyZones(location: GeoPoint): Promise<EmergencyZone[]> {
    const { data: zones } = await supabase
      .from('emergency_zones')
      .select('*');

    if (!zones) return [];

    return zones
      .map(zone => ({
        ...zone,
        distance: getDistance(location, {
          latitude: zone.latitude,
          longitude: zone.longitude,
        }),
      }))
      .filter(zone => zone.distance <= 5000) // Within 5km
      .sort((a, b) => a.distance - b.distance);
  }

  async stopEmergencyTracking() {
    await AsyncStorage.removeItem('emergency_active_emergency');
    this.locationSubscription?.remove();
    this.activeEmergencyId = undefined;
  }

  async sendEmergencyMessages(
    alert: EmergencyAlert,
    contacts: EmergencyContact[],
    preferredLanguage: Language = 'en'
  ) {
    const message = getEmergencyMessage(
      alert.type,
      preferredLanguage,
      {
        latitude: alert.latitude,
        longitude: alert.longitude,
      }
    );

    const prioritizedContacts = prioritizeContacts(contacts, alert.type);

    for (const contact of prioritizedContacts) {
      try {
        // Send SMS
        if (contact.phone) {
          await SMS.sendSMSAsync([contact.phone], message);
        }

        // Send WhatsApp if available
        if (contact.whatsapp) {
          await Linking.openURL(
            `whatsapp://send?phone=${contact.whatsapp}&text=${encodeURIComponent(message)}`
          );
        }
      } catch (error) {
        console.error(`Failed to send message to contact ${contact.name}:`, error);
      }
    }
  }
}

export const emergencyManager = EmergencyManager.getInstance(); 