import { 
  GeoPoint, 
  CrimeHotspot, 
  CrimePrediction, 
  CrimeType,
  CrimeRiskFactors 
} from '../types';
import { supabase } from './supabase';
import * as tf from '@tensorflow/tfjs';
import { incidentPrediction } from './incidentPrediction';
import { weatherMonitoring } from './weatherMonitoring';

class CrimePredictionService {
  private static instance: CrimePredictionService;
  private model: tf.LayersModel | null = null;
  private hotspotCache: Map<string, CrimeHotspot[]> = new Map();

  private constructor() {
    this.initializeModel();
  }

  static getInstance(): CrimePredictionService {
    if (!this.instance) {
      this.instance = new CrimePredictionService();
    }
    return this.instance;
  }

  private async initializeModel() {
    try {
      this.model = await tf.loadLayersModel('assets/crime_model/model.json');
    } catch (error) {
      console.error('Error loading crime prediction model:', error);
    }
  }

  async predictCrimeRisk(
    location: GeoPoint,
    time: Date = new Date()
  ): Promise<CrimePrediction> {
    const features = await this.extractCrimeFeatures(location, time);
    const prediction = await this.runPrediction(features);
    const riskFactors = await this.analyzeRiskFactors(location, time);

    return {
      location,
      riskScore: prediction.riskScore,
      crimeTypes: prediction.crimeTypes,
      timeWindow: {
        start: time,
        end: new Date(time.getTime() + 3 * 60 * 60 * 1000) // 3 hour window
      },
      factors: riskFactors
    };
  }

  async getActiveHotspots(
    location: GeoPoint,
    radius: number = 5000
  ): Promise<CrimeHotspot[]> {
    const cacheKey = `${location.latitude},${location.longitude},${radius}`;
    if (this.hotspotCache.has(cacheKey)) {
      return this.hotspotCache.get(cacheKey)!;
    }

    const hotspots = await this.identifyHotspots(location, radius);
    this.hotspotCache.set(cacheKey, hotspots);
    
    return hotspots;
  }

  private async identifyHotspots(location: GeoPoint, radius: number): Promise<CrimeHotspot[]> {
    const [recentCrimes, historicalPatterns] = await Promise.all([
      this.getRecentCrimes(location, radius),
      this.getHistoricalPatterns(location)
    ]);

    const clusters = this.clusterIncidents(recentCrimes);
    const hotspots = await Promise.all(
      clusters.map(async cluster => {
        const riskAnalysis = await this.analyzeClusterRisk(cluster);
        return this.createHotspot(cluster, riskAnalysis, historicalPatterns);
      })
    );

    return hotspots.sort((a, b) => b.riskLevel - a.riskLevel);
  }

  private async getRecentCrimes(location: GeoPoint, radius: number) {
    const { data: crimes } = await supabase
      .from('crime_reports')
      .select('*')
      .near('location', [location.latitude, location.longitude], radius)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    return crimes || [];
  }

  private async analyzeRiskFactors(location: GeoPoint, time: Date): Promise<CrimeRiskFactors> {
    const [
      lightingScore,
      surveillanceScore,
      crowdData,
      policeStations,
      historicalData,
      demographicData,
      infrastructureData,
      socialData
    ] = await Promise.all([
      this.getLightingScore(location, time),
      this.getSurveillanceScore(location),
      this.getCrowdDensity(location, time),
      this.getPoliceProximity(location),
      this.getHistoricalIncidents(location),
      this.getDemographicRisk(location),
      this.getInfrastructureQuality(location),
      this.getSocialFactors(location)
    ]);

    return {
      lighting: lightingScore,
      surveillance: surveillanceScore,
      crowdDensity: crowdData,
      policeProximity: policeStations,
      historicalIncidents: historicalData,
      demographicRisk: demographicData,
      infrastructureQuality: infrastructureData,
      socialFactors: socialData
    };
  }

  private async getLightingScore(location: GeoPoint, time: Date): Promise<number> {
    const { data: streetlights } = await supabase
      .from('infrastructure')
      .select('*')
      .eq('type', 'streetlight')
      .near('location', [location.latitude, location.longitude], 500);

    const isNight = (await weatherMonitoring.getCurrentWeather(location)).visibility < 5;
    const workingLights = streetlights?.filter(light => light.status === 'functional') || [];

    return isNight ? workingLights.length / Math.max(streetlights?.length || 1, 1) : 1;
  }

  private async getSurveillanceScore(location: GeoPoint): Promise<number> {
    const { data: surveillance } = await supabase
      .from('infrastructure')
      .select('*')
      .in('type', ['cctv', 'police_booth', 'security_post'])
      .near('location', [location.latitude, location.longitude], 500);

    return Math.min((surveillance?.length || 0) / 10, 1); // Normalize to 0-1
  }

  private async getDemographicRisk(location: GeoPoint): Promise<number> {
    const { data: demographics } = await supabase
      .from('area_demographics')
      .select('*')
      .near('location', [location.latitude, location.longitude], 1000)
      .single();

    if (!demographics) return 0.5;

    // Calculate risk based on various demographic factors
    const factors = [
      demographics.gender_ratio / 1000, // Normalize gender ratio
      demographics.literacy_rate / 100,
      demographics.employment_rate / 100,
      demographics.poverty_index / 100
    ];

    return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
  }

  private async getSocialFactors(location: GeoPoint): Promise<number> {
    const { data: factors } = await supabase
      .from('social_indicators')
      .select('*')
      .near('location', [location.latitude, location.longitude], 1000)
      .single();

    if (!factors) return 0.5;

    // Analyze social factors that might influence crime
    return (
      factors.community_engagement * 0.2 +
      factors.social_cohesion * 0.2 +
      factors.economic_inequality * 0.3 +
      factors.substance_abuse_rate * 0.3
    );
  }
}

export const crimePrediction = CrimePredictionService.getInstance(); 