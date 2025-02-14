import { GeoPoint } from '../types';
import { supabase } from './supabase';

interface RiskFactor {
  weight: number;
  score: number;
}

class PredictionService {
  private static instance: PredictionService;

  static getInstance(): PredictionService {
    if (!this.instance) {
      this.instance = new PredictionService();
    }
    return this.instance;
  }

  async predictRisk(location: GeoPoint, time: Date): Promise<number> {
    const factors = await Promise.all([
      this.getHistoricalIncidents(location),
      this.getTimeBasedRisk(time),
      this.getCrowdDensity(location),
      this.getLightingConditions(location, time),
      this.getSecurityPresence(location)
    ]);

    return this.calculateRiskScore(factors);
  }

  private async getHistoricalIncidents(location: GeoPoint): Promise<RiskFactor> {
    const { data: incidents } = await supabase
      .from('incident_reports')
      .select('severity, created_at')
      .near('location', [location.latitude, location.longitude], 1000)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const score = incidents ? this.calculateIncidentScore(incidents) : 0;
    return { weight: 0.3, score };
  }

  private calculateIncidentScore(incidents: any[]): number {
    if (!incidents.length) return 0;

    const recentWeight = 0.7;
    const severityWeight = 0.3;

    const weightedScore = incidents.reduce((sum, incident) => {
      const daysAgo = (Date.now() - new Date(incident.created_at).getTime()) / (1000 * 60 * 60 * 24);
      const recency = Math.exp(-daysAgo / 30); // Exponential decay over 30 days
      const severity = incident.severity / 5; // Normalize severity to 0-1

      return sum + (recency * recentWeight + severity * severityWeight);
    }, 0);

    return Math.min(weightedScore / incidents.length, 1);
  }

  private async getTimeBasedRisk(time: Date): Promise<RiskFactor> {
    const hour = time.getHours();
    const isNight = hour < 6 || hour > 18;
    const isDawn = hour >= 5 && hour < 7;
    const isDusk = hour >= 17 && hour < 19;

    let score = 0;
    if (isNight) score = 0.8;
    else if (isDawn || isDusk) score = 0.6;
    else score = 0.3;

    return { weight: 0.2, score };
  }

  private async getCrowdDensity(location: GeoPoint): Promise<RiskFactor> {
    const { data: users } = await supabase
      .from('user_locations')
      .select('id')
      .near('location', [location.latitude, location.longitude], 500);

    const density = Math.min((users?.length || 0) / 50, 1); // Normalize to max 50 people
    const score = 1 - density; // Less crowded = higher risk

    return { weight: 0.2, score };
  }

  private async getLightingConditions(location: GeoPoint, time: Date): Promise<RiskFactor> {
    const { data: lights } = await supabase
      .from('security_features')
      .select('*')
      .eq('type', 'lighting')
      .near('location', [location.latitude, location.longitude], 100);

    const isNight = time.getHours() < 6 || time.getHours() > 18;
    const score = isNight ? 
      (lights?.length || 0) / 5 : // Normalize to 5 lights at night
      0.2; // Daytime baseline risk

    return { weight: 0.15, score };
  }

  private async getSecurityPresence(location: GeoPoint): Promise<RiskFactor> {
    const { data: security } = await supabase
      .from('security_features')
      .select('*')
      .in('type', ['guard_post', 'cctv', 'emergency_phone'])
      .near('location', [location.latitude, location.longitude], 200);

    const score = Math.min((security?.length || 0) / 3, 1); // Normalize to 3 security features

    return { weight: 0.15, score };
  }

  private calculateRiskScore(factors: RiskFactor[]): number {
    const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
    const weightedSum = factors.reduce((sum, factor) => sum + factor.weight * factor.score, 0);

    return weightedSum / totalWeight;
  }
}

export const predictionService = PredictionService.getInstance(); 