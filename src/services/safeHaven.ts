import { 
  GeoPoint, 
  SafeHaven, 
  SafeHavenType,
  CrimeRiskFactors 
} from '../types';
import { supabase } from './supabase';
import { crimePrediction } from './crimePrediction';
import { getDistance } from '../utils/distance';

class SafeHavenService {
  private static instance: SafeHavenService;
  private havenCache: Map<string, SafeHaven[]> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): SafeHavenService {
    if (!this.instance) {
      this.instance = new SafeHavenService();
    }
    return this.instance;
  }

  async findNearestSafeHavens(
    location: GeoPoint,
    options: {
      radius?: number;
      type?: SafeHavenType[];
      requiredServices?: string[];
      maxResults?: number;
    } = {}
  ): Promise<SafeHaven[]> {
    const {
      radius = 2000, // 2km default radius
      type = ['women_shelter', 'police_station', 'hospital'],
      requiredServices = [],
      maxResults = 5
    } = options;

    const cacheKey = this.getCacheKey(location, radius, type);
    const cached = this.havenCache.get(cacheKey);
    if (cached) return cached;

    const { data: havens } = await supabase
      .from('safe_havens')
      .select('*')
      .in('type', type)
      .eq('status', 'active')
      .near('location', [location.latitude, location.longitude], radius);

    if (!havens) return [];

    const enhancedHavens = await Promise.all(
      havens
        .filter(haven => 
          requiredServices.every(service => haven.services.includes(service))
        )
        .map(async haven => ({
          ...haven,
          distance: getDistance(location, haven.location),
          riskFactors: await this.assessLocationSafety(haven.location),
          verificationStatus: await this.getVerificationStatus(haven.id)
        }))
    );

    const sortedHavens = this.rankSafeHavens(enhancedHavens)
      .slice(0, maxResults);

    this.havenCache.set(cacheKey, sortedHavens);
    setTimeout(() => this.havenCache.delete(cacheKey), this.CACHE_DURATION);

    return sortedHavens;
  }

  async getEmergencyShelter(
    location: GeoPoint,
    emergencyType: string
  ): Promise<SafeHaven | null> {
    // Find immediate shelter based on emergency type
    const shelters = await this.findNearestSafeHavens(location, {
      radius: 3000,
      type: this.getShelterTypesByEmergency(emergencyType),
      requiredServices: ['emergency_stay'],
      maxResults: 3
    });

    // Contact shelters in order of ranking
    for (const shelter of shelters) {
      const availability = await this.checkShelterAvailability(shelter.id);
      if (availability.hasSpace) {
        await this.notifyShelter(shelter, emergencyType);
        return shelter;
      }
    }

    return null;
  }

  private getShelterTypesByEmergency(emergencyType: string): SafeHavenType[] {
    switch (emergencyType) {
      case 'harassment':
      case 'eve_teasing':
        return ['women_shelter', 'police_station', 'ngo_center'];
      case 'medical':
        return ['hospital', 'women_shelter'];
      case 'assault':
        return ['police_station', 'hospital', 'women_shelter'];
      default:
        return ['women_shelter', 'police_station', 'hospital'];
    }
  }

  private async assessLocationSafety(location: GeoPoint): Promise<CrimeRiskFactors> {
    return await crimePrediction.analyzeRiskFactors(location, new Date());
  }

  private async getVerificationStatus(havenId: string) {
    const { data: verifications } = await supabase
      .from('haven_verifications')
      .select('*')
      .eq('haven_id', havenId)
      .order('verified_at', { ascending: false })
      .limit(1)
      .single();

    return {
      isVerified: !!verifications,
      lastVerified: verifications?.verified_at,
      verifiedBy: verifications?.verified_by,
      rating: verifications?.rating
    };
  }

  private async checkShelterAvailability(havenId: string) {
    const { data: shelter } = await supabase
      .from('safe_havens')
      .select('capacity_total, capacity_current')
      .eq('id', havenId)
      .single();

    return {
      hasSpace: shelter ? shelter.capacity_current < shelter.capacity_total : false,
      availableSpots: shelter ? shelter.capacity_total - shelter.capacity_current : 0
    };
  }

  private async notifyShelter(shelter: SafeHaven, emergencyType: string) {
    // Implement shelter notification logic
    // This could include:
    // 1. Sending SMS/WhatsApp to shelter staff
    // 2. Calling emergency line
    // 3. Updating shelter's pending requests
    // 4. Logging the notification
  }

  private rankSafeHavens(havens: (SafeHaven & { 
    distance: number; 
    riskFactors: CrimeRiskFactors;
    verificationStatus: any;
  })[]): SafeHaven[] {
    return havens.sort((a, b) => {
      // Calculate weighted score based on multiple factors
      const scoreA = this.calculateHavenScore(a);
      const scoreB = this.calculateHavenScore(b);
      return scoreB - scoreA;
    });
  }

  private calculateHavenScore(haven: any): number {
    const weights = {
      distance: 0.3,
      safety: 0.25,
      capacity: 0.15,
      verification: 0.15,
      services: 0.15
    };

    const distanceScore = 1 - (haven.distance / 5000); // Normalize to 5km
    const safetyScore = 1 - (
      haven.riskFactors.lighting * 0.3 +
      haven.riskFactors.surveillance * 0.3 +
      haven.riskFactors.crowdDensity * 0.2 +
      haven.riskFactors.historicalIncidents * 0.2
    );
    const capacityScore = (haven.capacity.total - haven.capacity.current) / haven.capacity.total;
    const verificationScore = haven.verificationStatus.rating / 5;
    const servicesScore = haven.services.length / 8; // Normalize to total possible services

    return (
      distanceScore * weights.distance +
      safetyScore * weights.safety +
      capacityScore * weights.capacity +
      verificationScore * weights.verification +
      servicesScore * weights.services
    );
  }

  private getCacheKey(location: GeoPoint, radius: number, types: SafeHavenType[]): string {
    return `${location.latitude},${location.longitude},${radius},${types.join(',')}`;
  }
}

export const safeHaven = SafeHavenService.getInstance(); 