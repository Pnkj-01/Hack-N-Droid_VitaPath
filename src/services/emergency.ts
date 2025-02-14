import * as SMS from 'expo-sms';
import * as Linking from 'expo-linking';
import { EmergencyContact, EmergencyService, GeoPoint } from '../types';
import { supabase } from './supabase';

const EMERGENCY_SERVICES: EmergencyService[] = [
  {
    id: 'police',
    name: 'Police Emergency',
    type: 'police',
    phone: '112',
    jurisdiction: 'India',
  },
  {
    id: 'women-helpline',
    name: 'Women Helpline',
    type: 'other',
    phone: '1091',
    jurisdiction: 'India',
  },
  {
    id: 'ambulance',
    name: 'Ambulance',
    type: 'ambulance',
    phone: '108',
    jurisdiction: 'India',
  },
  {
    id: 'fire',
    name: 'Fire Emergency',
    type: 'fire',
    phone: '101',
    jurisdiction: 'India',
  },
  {
    id: 'disaster',
    name: 'Disaster Management',
    type: 'other',
    phone: '108',
    jurisdiction: 'India',
  },
  {
    id: 'railway',
    name: 'Railway Protection',
    type: 'other',
    phone: '1512',
    jurisdiction: 'India',
  },
];

export async function notifyEmergencyContacts(
  contacts: EmergencyContact[],
  location: GeoPoint,
  description?: string
) {
  const message = `🚨 आपातकालीन चेतावनी / EMERGENCY ALERT 🚨

मुझे मदद की जरूरत है! / I need help!

मेरी वर्तमान स्थिति / My current location:
https://www.google.com/maps?q=${location.latitude},${location.longitude}

${description ? `विवरण / Details: ${description}` : ''}

कृपया तुरंत संपर्क करें / Please contact immediately.`;

  // Sort contacts by priority
  const sortedContacts = [...contacts].sort((a, b) => a.priority - b.priority);

  for (const contact of sortedContacts) {
    try {
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync([contact.phone], message);
      }

      // Send email as backup
      if (contact.email) {
        const emailUrl = `mailto:${contact.email}?subject=Emergency Alert&body=${encodeURIComponent(message)}`;
        await Linking.openURL(emailUrl);
      }
    } catch (error) {
      console.error(`Failed to notify contact ${contact.name}:`, error);
    }
  }
}

export async function contactAuthorities(
  location: GeoPoint,
  type: EmergencyAlert['type'] = 'danger',
  description?: string
) {
  // Get nearest emergency service based on location
  const service = EMERGENCY_SERVICES[0]; // Simplified for example

  try {
    // Log the emergency call
    await supabase.from('emergency_calls').insert([
      {
        service_id: service.id,
        location: location,
        type: type,
        description: description,
      },
    ]);

    // Open phone dialer with emergency number
    await Linking.openURL(`tel:${service.phone}`);

    return true;
  } catch (error) {
    console.error('Failed to contact authorities:', error);
    return false;
  }
}

export async function trackEmergency(alertId: string) {
  // Set up real-time tracking
  const subscription = supabase
    .channel(`emergency-${alertId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'emergency_alerts',
        filter: `id=eq.${alertId}`,
      },
      async (payload) => {
        const alert = payload.new;
        
        // Handle status changes
        if (alert.status === 'resolved') {
          // Notify contacts of resolution
          const { data: user } = await supabase
            .from('users')
            .select('emergency_contacts')
            .eq('id', alert.user_id)
            .single();

          if (user?.emergency_contacts) {
            await notifyEmergencyContacts(
              user.emergency_contacts,
              alert.location,
              'Emergency situation has been resolved.'
            );
          }
        }
      }
    )
    .subscribe();

  return subscription;
}

export async function updateEmergencyLocation(alertId: string, location: GeoPoint) {
  await supabase
    .from('emergency_alerts')
    .update({
      latitude: location.latitude,
      longitude: location.longitude,
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId);
} 