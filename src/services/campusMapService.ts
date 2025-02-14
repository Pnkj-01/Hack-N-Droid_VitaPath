import { GeoPoint } from '../types';
import { CAMPUS_CONFIG } from '../config/campusConfig';
import { mapService } from './mapService';

class CampusMapService {
  private static instance: CampusMapService;

  static getInstance(): CampusMapService {
    if (!this.instance) {
      this.instance = new CampusMapService();
    }
    return this.instance;
  }

  isWithinCampus(location: GeoPoint): boolean {
    const { boundaries } = CAMPUS_CONFIG;
    return (
      location.latitude <= boundaries.north &&
      location.latitude >= boundaries.south &&
      location.longitude <= boundaries.east &&
      location.longitude >= boundaries.west
    );
  }

  async getNearestEmergencyPoint(location: GeoPoint): Promise<{
    point: typeof CAMPUS_CONFIG.zones.emergencyPoints[0];
    distance: number;
    walkingTime: number;
  }> {
    const emergencyPoints = CAMPUS_CONFIG.zones.emergencyPoints;
    let nearest = null;
    let minDistance = Infinity;

    for (const point of emergencyPoints) {
      const route = await mapService.getDirections(
        location,
        point.location,
        'walking'
      );

      if (route && route.distance < minDistance) {
        nearest = {
          point,
          distance: route.distance,
          walkingTime: route.duration
        };
        minDistance = route.distance;
      }
    }

    return nearest;
  }

  async getSafePathToHostel(
    location: GeoPoint,
    hostelType: 'mens' | 'womens'
  ) {
    const hostel = CAMPUS_CONFIG.zones.hostels.find(h => 
      hostelType === 'mens' ? h.id === 'mh' : h.id === 'lh'
    );

    const routes = await mapService.getDirections(location, hostel.location, 'walking');
    
    // Add safety features along route
    const enhancedRoute = await this.enhanceRouteWithSafety(routes);
    
    return enhancedRoute;
  }

  private async enhanceRouteWithSafety(route: any) {
    const safetyFeatures = await this.getSafetyFeaturesAlongRoute(route);
    return {
      ...route,
      safetyFeatures,
      emergencyPoints: this.getEmergencyPointsNearRoute(route),
      lightingStatus: await this.getLightingStatus(route),
      securityPatrols: await this.getSecurityPatrolsNearRoute(route)
    };
  }

  async getLocationContext(location: GeoPoint): Promise<{
    zone: string;
    building: string;
    floor?: number;
    nearestLandmarks: string[];
    safetyInfo: any;
  }> {
    // Implement location context logic
    return {
      zone: 'academic',
      building: 'Academic Block 1',
      floor: 1,
      nearestLandmarks: ['Library', 'Food Court'],
      safetyInfo: {
        nearestEmergencyPoint: 'Security Office (50m)',
        lightingStatus: 'Well lit',
        crowdDensity: 'Medium',
        securityPresence: true
      }
    };
  }

  async reportCrowdDensity(location: GeoPoint, density: 'low' | 'medium' | 'high') {
    await supabase.from('crowd_reports').insert([{
      location,
      density,
      timestamp: new Date().toISOString()
    }]);
  }

  // Add more campus-specific mapping features...
}

export const campusMapService = CampusMapService.getInstance(); 