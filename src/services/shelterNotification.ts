import { SafeHaven, EmergencyAlert } from '../types';
import { supabase } from './supabase';
import * as SMS from 'expo-sms';
import * as Linking from 'expo-linking';
import { getPreferredLanguage } from '../utils/emergencyMessages';

interface NotificationResponse {
  success: boolean;
  responseTime?: number;
  acceptanceStatus: 'accepted' | 'pending' | 'rejected';
  alternativeShelter?: SafeHaven;
  transportationOffer?: boolean;
}

class ShelterNotificationService {
  private static instance: ShelterNotificationService;

  static getInstance(): ShelterNotificationService {
    if (!this.instance) {
      this.instance = new ShelterNotificationService();
    }
    return this.instance;
  }

  async notifyShelter(
    shelter: SafeHaven,
    emergency: EmergencyAlert,
    userLanguage: string
  ): Promise<NotificationResponse> {
    try {
      // Create shelter request
      const { data: request } = await supabase
        .from('shelter_requests')
        .insert([{
          shelter_id: shelter.id,
          emergency_id: emergency.id,
          status: 'pending',
          created_at: new Date().toISOString(),
          required_services: this.determineRequiredServices(emergency)
        }])
        .select()
        .single();

      // Send notifications in parallel
      const [smsResponse, whatsappResponse, emergencyLineResponse] = await Promise.all([
        this.sendSMSNotification(shelter, emergency, userLanguage),
        this.sendWhatsAppNotification(shelter, emergency, userLanguage),
        this.callEmergencyLine(shelter, emergency)
      ]);

      // Monitor for response
      const response = await this.waitForShelterResponse(request.id);

      if (response.acceptanceStatus === 'accepted') {
        await this.arrangeTransportation(shelter, emergency);
      }

      return response;
    } catch (error) {
      console.error('Error notifying shelter:', error);
      throw error;
    }
  }

  private async sendSMSNotification(
    shelter: SafeHaven,
    emergency: EmergencyAlert,
    language: string
  ): Promise<boolean> {
    const message = this.getEmergencyMessage(emergency, language);
    
    try {
      await SMS.sendSMSAsync(
        [shelter.contact.phone],
        message
      );
      return true;
    } catch (error) {
      console.error('SMS notification failed:', error);
      return false;
    }
  }

  private async sendWhatsAppNotification(
    shelter: SafeHaven,
    emergency: EmergencyAlert,
    language: string
  ): Promise<boolean> {
    if (!shelter.contact.whatsapp) return false;

    const message = this.getEmergencyMessage(emergency, language);
    
    try {
      await Linking.openURL(
        `whatsapp://send?phone=${shelter.contact.whatsapp}&text=${encodeURIComponent(message)}`
      );
      return true;
    } catch (error) {
      console.error('WhatsApp notification failed:', error);
      return false;
    }
  }

  private async callEmergencyLine(shelter: SafeHaven, emergency: EmergencyAlert): Promise<boolean> {
    try {
      await Linking.openURL(`tel:${shelter.contact.emergency_line}`);
      return true;
    } catch (error) {
      console.error('Emergency call failed:', error);
      return false;
    }
  }

  private async waitForShelterResponse(requestId: string): Promise<NotificationResponse> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        subscription.unsubscribe();
        resolve({
          success: false,
          acceptanceStatus: 'pending',
          responseTime: 300 // 5 minutes timeout
        });
      }, 300000); // 5 minutes

      const subscription = supabase
        .channel(`shelter_request_${requestId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'shelter_requests',
            filter: `id=eq.${requestId}`,
          },
          async (payload) => {
            const response = payload.new;
            if (response.status !== 'pending') {
              clearTimeout(timeout);
              subscription.unsubscribe();
              
              resolve({
                success: response.status === 'accepted',
                acceptanceStatus: response.status,
                responseTime: (new Date(response.updated_at).getTime() - 
                             new Date(response.created_at).getTime()) / 1000,
                alternativeShelter: response.alternative_shelter_id ? 
                  await this.getShelterDetails(response.alternative_shelter_id) : 
                  undefined,
                transportationOffer: response.transportation_offered
              });
            }
          }
        )
        .subscribe();
    });
  }

  private async arrangeTransportation(shelter: SafeHaven, emergency: EmergencyAlert) {
    // Implement transportation arrangement logic
    // This could include:
    // 1. Checking for shelter's own transportation service
    // 2. Booking trusted cab services
    // 3. Arranging police escort if needed
    // 4. Coordinating with emergency contacts for pickup
  }

  private determineRequiredServices(emergency: EmergencyAlert): string[] {
    const services: string[] = ['emergency_stay'];
    
    switch (emergency.type) {
      case 'medical':
        services.push('medical_aid');
        break;
      case 'assault':
        services.push('medical_aid', 'counseling', 'legal_aid');
        break;
      case 'harassment':
        services.push('counseling', 'legal_aid');
        break;
    }

    return services;
  }

  private getEmergencyMessage(emergency: EmergencyAlert, language: string): string {
    const template = this.getMessageTemplate(emergency.type, language);
    return template
      .replace('{{location}}', 
        `https://maps.google.com/?q=${emergency.location.latitude},${emergency.location.longitude}`)
      .replace('{{type}}', emergency.type)
      .replace('{{description}}', emergency.description || '');
  }

  private async getShelterDetails(shelterId: string): Promise<SafeHaven | undefined> {
    const { data } = await supabase
      .from('safe_havens')
      .select('*')
      .eq('id', shelterId)
      .single();
    
    return data;
  }
}

export const shelterNotification = ShelterNotificationService.getInstance(); 