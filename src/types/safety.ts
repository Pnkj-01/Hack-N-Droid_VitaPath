export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface SafetyScore {
  overall: number;
  factors: {
    lighting: number;
    crowdDensity: number;
    historicalData: number;
  };
  timestamp: string;
}

export interface SafetyFactor {
  score: number;
  weight: number;
  confidence: number;
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high';
  score: number;
  factors: {
    [key: string]: number;
  };
  timestamp: string;
} 