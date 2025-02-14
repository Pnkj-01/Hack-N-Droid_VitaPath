import type { GeoPoint, SafetyScore, RiskAssessment } from '../types';
import { supabase } from './supabase';

class SafetyService {
  private static instance: SafetyService;

  private constructor() {}

  static getInstance(): SafetyService {
    if (!this.instance) {
      this.instance = new SafetyService();
    }
    return this.instance;
  }

  async calculateSafetyScore(location: GeoPoint): Promise<SafetyScore> {
    const { data: incidents } = await supabase
      .from('incidents')
      .select('*')
      .near('location', [location.latitude, location.longitude], 1000);

    const score = this.calculateScore(incidents || []);

    return {
      overall: score,
      factors: {
        lighting: 0.8,
        crowdDensity: 0.7,
        historicalData: 0.9,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getRiskAssessment(location: GeoPoint): Promise<RiskAssessment> {
    const score = await this.calculateSafetyScore(location);
    
    return {
      level: this.getRiskLevel(score.overall),
      score: score.overall,
      factors: score.factors,
      timestamp: score.timestamp,
    };
  }

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' {
    if (score >= 0.7) return 'low';
    if (score >= 0.4) return 'medium';
    return 'high';
  }

  private calculateScore(incidents: any[]): number {
    if (!incidents.length) return 1;
    return Math.max(0, 1 - (incidents.length * 0.1));
  }
}

export const safetyService = SafetyService.getInstance();