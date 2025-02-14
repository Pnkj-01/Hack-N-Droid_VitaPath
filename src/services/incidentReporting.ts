import { GeoPoint, User } from '../types';
import { supabase } from './supabase';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { campusSafety } from './campusSafety';

interface IncidentReport {
  id: string;
  type: 'accident' | 'harassment' | 'infrastructure' | 'suspicious' | 'medical' | 'other';
  location: GeoPoint;
  timestamp: string;
  description: string;
  images: {
    url: string;
    metadata: {
      timestamp: string;
      location?: GeoPoint;
      device_info?: string;
    };
  }[];
  reporter: {
    id: string;
    anonymous: boolean;
  };
  severity: 1 | 2 | 3; // 1 being most severe
  status: 'pending' | 'investigating' | 'resolved';
  emergency_contacts_notified: boolean;
  authority_response?: {
    department: string;
    eta?: number;
    instructions?: string;
  };
}

class IncidentReportingService {
  private static instance: IncidentReportingService;

  static getInstance(): IncidentReportingService {
    if (!this.instance) {
      this.instance = new IncidentReportingService();
    }
    return this.instance;
  }

  async reportIncidentWithPhoto(
    incident: Partial<IncidentReport>,
    photos: string[],
    user: User
  ): Promise<void> {
    try {
      // Get current location
      const location = await this.getCurrentPreciseLocation();
      
      // Process and upload photos with metadata
      const processedPhotos = await Promise.all(
        photos.map(photo => this.processAndUploadPhoto(photo, location))
      );

      // Create incident report
      const { data: report } = await supabase
        .from('incident_reports')
        .insert([{
          ...incident,
          location,
          images: processedPhotos,
          reporter: {
            id: user.id,
            anonymous: incident.reporter?.anonymous || false
          },
          timestamp: new Date().toISOString(),
          status: 'pending',
          emergency_contacts_notified: false
        }])
        .select()
        .single();

      // Notify relevant authorities based on incident type and severity
      await this.notifyAuthorities(report);

      // If severe, trigger emergency protocols
      if (incident.severity === 1) {
        await this.triggerEmergencyProtocol(report);
      }

      // Update campus safety status
      await campusSafety.updateZoneStatus(location);
    } catch (error) {
      console.error('Error reporting incident:', error);
      throw error;
    }
  }

  private async getCurrentPreciseLocation(): Promise<GeoPoint> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    };
  }

  private async processAndUploadPhoto(
    photoUri: string,
    location: GeoPoint
  ): Promise<IncidentReport['images'][0]> {
    // Compress image while maintaining quality
    const processed = await ImageManipulator.manipulateAsync(
      photoUri,
      [{ resize: { width: 1080 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Extract EXIF data if available
    const metadata = {
      timestamp: new Date().toISOString(),
      location,
      device_info: await this.getDeviceInfo()
    };

    // Upload to storage
    const fileName = `incidents/${new Date().getTime()}-${Math.random().toString(36).substring(7)}.jpg`;
    const { data: uploadedPhoto, error } = await supabase.storage
      .from('incident-photos')
      .upload(fileName, {
        uri: processed.uri,
        type: 'image/jpeg',
        name: fileName
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('incident-photos')
      .getPublicUrl(fileName);

    return {
      url: publicUrl,
      metadata
    };
  }

  private async notifyAuthorities(report: IncidentReport): Promise<void> {
    const authorities = await this.getRelevantAuthorities(report);

    // Send immediate notifications
    await Promise.all([
      this.sendEmergencyAlert(authorities.emergency, report),
      this.notifyCampusSecurity(report),
      this.notifyNearbyPatrols(report.location)
    ]);

    // Update report with authority response
    await supabase
      .from('incident_reports')
      .update({
        authority_response: {
          department: authorities.primary,
          eta: await this.estimateResponseTime(authorities.primary, report.location)
        }
      })
      .eq('id', report.id);
  }

  private async triggerEmergencyProtocol(report: IncidentReport): Promise<void> {
    // Implement emergency response protocols
    await Promise.all([
      this.dispatchEmergencyServices(report),
      this.alertNearbyUsers(report.location),
      this.activateEmergencyBeacons(report.location),
      this.notifyEmergencyContacts(report)
    ]);
  }

  private async getRelevantAuthorities(report: IncidentReport) {
    // Determine which authorities to notify based on incident type
    const typeToAuthority = {
      accident: ['medical', 'security'],
      harassment: ['security', 'police'],
      infrastructure: ['maintenance', 'security'],
      suspicious: ['security', 'police'],
      medical: ['medical', 'ambulance'],
      other: ['security']
    };

    return {
      emergency: typeToAuthority[report.type][0],
      primary: typeToAuthority[report.type][0],
      secondary: typeToAuthority[report.type][1]
    };
  }

  private async alertNearbyUsers(location: GeoPoint): Promise<void> {
    const radius = 500; // meters
    const { data: nearbyUsers } = await supabase
      .from('user_locations')
      .select('user_id')
      .near('location', [location.latitude, location.longitude], radius);

    if (nearbyUsers) {
      await Promise.all(
        nearbyUsers.map(user => this.sendUserAlert(user.user_id, location))
      );
    }
  }

  private async getDeviceInfo(): Promise<string> {
    // You'll need to install expo-device
    try {
      const device = await import('expo-device');
      return `${device.brand} ${device.modelName}`;
    } catch (error) {
      return 'Unknown Device';
    }
  }

  private async sendEmergencyAlert(department: string, report: IncidentReport): Promise<void> {
    // Implement your emergency alert system
    // This could be SMS, push notification, or direct line
    console.log(`Emergency alert sent to ${department}`);
  }

  private async notifyCampusSecurity(report: IncidentReport): Promise<void> {
    // Implement campus security notification
    console.log('Campus security notified');
  }

  private async notifyNearbyPatrols(location: GeoPoint): Promise<void> {
    // Implement patrol notification
    console.log('Nearby patrols notified');
  }

  private async estimateResponseTime(department: string, location: GeoPoint): Promise<number> {
    // Implement response time estimation
    return 300; // 5 minutes default
  }

  private async dispatchEmergencyServices(report: IncidentReport): Promise<void> {
    // Implement emergency dispatch
    console.log('Emergency services dispatched');
  }

  private async activateEmergencyBeacons(location: GeoPoint): Promise<void> {
    // Implement beacon activation if available
    console.log('Emergency beacons activated');
  }

  private async notifyEmergencyContacts(report: IncidentReport): Promise<void> {
    // Implement emergency contact notification
    console.log('Emergency contacts notified');
  }

  private async sendUserAlert(userId: string, location: GeoPoint): Promise<void> {
    // Implement user alert system
    console.log(`Alert sent to user ${userId}`);
  }
}

export const incidentReporting = IncidentReportingService.getInstance(); 