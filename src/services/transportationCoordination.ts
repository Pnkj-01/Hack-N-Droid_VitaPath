import { GeoPoint } from '../types';
import { safeRouting } from './safeRouting';

interface TransportOption {
  type: 'walk' | 'bike' | 'scooter' | 'car';
  route: GeoPoint[];
  estimatedTime: number;
  safetyScore: number;
}

class TransportationService {
  private static instance: TransportationService;

  static getInstance(): TransportationService {
    if (!this.instance) {
      this.instance = new TransportationService();
    }
    return this.instance;
  }

  async getTransportOptions(start: GeoPoint, end: GeoPoint): Promise<TransportOption[]> {
    const safeRoute = await safeRouting.findSafeRoute(start, end);
    const distance = this.calculateDistance(safeRoute);

    return [
      {
        type: 'walk',
        route: safeRoute,
        estimatedTime: distance / 5, // 5 km/h walking speed
        safetyScore: 0.8,
      },
      {
        type: 'bike',
        route: safeRoute,
        estimatedTime: distance / 15, // 15 km/h biking speed
        safetyScore: 0.7,
      },
    ];
  }

  private calculateDistance(route: GeoPoint[]): number {
    let distance = 0;
    for (let i = 1; i < route.length; i++) {
      distance += this.haversineDistance(route[i-1], route[i]);
    }
    return distance;
  }

  private haversineDistance(point1: GeoPoint, point2: GeoPoint): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(point2.latitude - point1.latitude);
    const dLon = this.toRad(point2.longitude - point1.longitude);
    const lat1 = this.toRad(point1.latitude);
    const lat2 = this.toRad(point2.latitude);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * Math.PI / 180;
  }
}

export const transportationService = TransportationService.getInstance(); 