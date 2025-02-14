import MapView, { Region, Marker } from '@react-native-maps/maps';
import { GeoPoint } from '../types';
import { ENV } from '../config/env';
import { supabase } from './supabase';
import { predictionService } from './predictionService';

interface MapMarker {
  id: string;
  location: GeoPoint;
  title: string;
  description?: string;
  type: 'incident' | 'emergency' | 'security' | 'safe_point';
}

class MapService {
  private static instance: MapService;
  private defaultRegion: Region = {
    latitude: 28.6139,  // Default to Delhi
    longitude: 77.2090,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };
  private readonly apiKey = ENV.GOOGLE_MAPS_API_KEY;

  static getInstance(): MapService {
    if (!this.instance) {
      this.instance = new MapService();
    }
    return this.instance;
  }

  getDefaultRegion(): Region {
    return this.defaultRegion;
  }

  calculateRegionForPoints(points: GeoPoint[]): Region {
    if (!points.length) return this.defaultRegion;

    const lats = points.map(p => p.latitude);
    const lngs = points.map(p => p.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) * 1.5,
      longitudeDelta: (maxLng - minLng) * 1.5,
    };
  }

  async getAddressFromCoordinates(location: GeoPoint): Promise<string> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=${this.apiKey}`
      );
      const data = await response.json();
      return data.results[0]?.formatted_address || 'Unknown location';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Unknown location';
    }
  }

  async getPlaceDetails(placeId: string) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${this.apiKey}`
      );
      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }
  }

  async searchNearbyPlaces(
    location: GeoPoint,
    type: string,
    radius: number = 1000
  ): Promise<any[]> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
        `location=${location.latitude},${location.longitude}&` +
        `radius=${radius}&` +
        `type=${type}&` +
        `key=${this.apiKey}`
      );
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error searching nearby places:', error);
      return [];
    }
  }

  async getDirections(
    origin: GeoPoint,
    destination: GeoPoint,
    mode: 'walking' | 'driving' = 'walking'
  ) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${origin.latitude},${origin.longitude}&` +
        `destination=${destination.latitude},${destination.longitude}&` +
        `mode=${mode}&` +
        `key=${this.apiKey}`
      );
      const data = await response.json();
      return data.routes[0] || null;
    } catch (error) {
      console.error('Error getting directions:', error);
      return null;
    }
  }

  async getSafeRoute(start: GeoPoint, end: GeoPoint): Promise<GeoPoint[]> {
    try {
      // Get potential routes
      const routes = await this.getRouteOptions(start, end);
      
      // Calculate safety scores for each route
      const routesWithScores = await Promise.all(
        routes.map(async (route) => {
          const safetyScore = await this.calculateRouteSafety(route);
          return { route, safetyScore };
        })
      );

      // Return the safest route
      const safestRoute = routesWithScores.reduce((safest, current) => 
        current.safetyScore > safest.safetyScore ? current : safest
      );

      return safestRoute.route;
    } catch (error) {
      console.error('Error getting safe route:', error);
      return [];
    }
  }

  private async getRouteOptions(start: GeoPoint, end: GeoPoint): Promise<GeoPoint[][]> {
    // Implement route finding algorithm
    return [[start, end]]; // Placeholder
  }

  private async calculateRouteSafety(route: GeoPoint[]): Promise<number> {
    try {
      const safetyScores = await Promise.all(
        route.map(point => predictionService.predictRisk(point, new Date()))
      );

      return safetyScores.reduce((avg, score) => avg + score, 0) / safetyScores.length;
    } catch (error) {
      console.error('Error calculating route safety:', error);
      return 0;
    }
  }
}

export const mapService = MapService.getInstance(); 