import { supabase } from './supabase';
import { notificationService } from './notificationService';
import { GeoPoint } from '../types';

class RealtimeService {
  private static instance: RealtimeService;
  private channels: Map<string, any> = new Map();

  static getInstance(): RealtimeService {
    if (!this.instance) {
      this.instance = new RealtimeService();
    }
    return this.instance;
  }

  setupIncidentChannel() {
    const channel = supabase
      .channel('incidents')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'incident_reports',
        },
        async (payload) => {
          const incident = payload.new;
          await this.handleNewIncident(incident);
        }
      )
      .subscribe();

    this.channels.set('incidents', channel);
  }

  setupLocationUpdates(userId: string, onUpdate: (location: GeoPoint) => void) {
    const channel = supabase
      .channel(`location_${userId}`)
      .on(
        'presence',
        { event: 'sync' },
        () => {
          // Handle presence sync
        }
      )
      .on(
        'broadcast',
        { event: 'location' },
        ({ payload }) => {
          onUpdate(payload.location);
        }
      )
      .subscribe();

    this.channels.set(`location_${userId}`, channel);
  }

  private async handleNewIncident(incident: any) {
    // Notify nearby users
    if (incident.severity === 1) {
      await notificationService.sendEmergencyNotification(
        'Emergency Alert',
        `${incident.type} reported nearby`,
        incident.location
      );
    }
  }

  cleanup() {
    this.channels.forEach(channel => {
      channel.unsubscribe();
    });
    this.channels.clear();
  }
}

export const realtimeService = RealtimeService.getInstance(); 