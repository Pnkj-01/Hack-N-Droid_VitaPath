import { GeoPoint, Route, SafetyScore, InfrastructureReport } from '../types';
import { supabase } from './supabase';
import * as Location from 'expo-location';
import { getDistance } from '../utils/distance';
import { trafficMonitoring } from './trafficMonitoring';
import { TrafficPrediction } from '../types';
import { weatherMonitoring } from './weatherMonitoring';
import { IncidentPrediction } from '../types';
import { incidentPrediction } from './incidentPrediction';
import { predictionService } from './incidentPrediction';

interface SafetyFactor {
  type: 'lighting' | 'crowd' | 'incidents' | 'infrastructure';
  weight: number;
  score: number;
}

interface SegmentAnalysis {
  segment: GeoPoint[];
  safetyScore: number;
  incidentPrediction: IncidentPrediction;
  trafficScore: number;
  infrastructureScore: number;
}

interface RouteSegment {
  start: GeoPoint;
  end: GeoPoint;
  distance: number;
  riskScore: number;
}

class SafeRoutingService {
  private static instance: SafeRoutingService;
  private safetyCache: Map<string, SafetyScore> = new Map();
  private routeMonitors: Map<string, NodeJS.Timer> = new Map();

  private constructor() {}

  static getInstance(): SafeRoutingService {
    if (!this.instance) {
      this.instance = new SafeRoutingService();
    }
    return this.instance;
  }

  async findSafeRoute(start: GeoPoint, end: GeoPoint): Promise<GeoPoint[]> {
    const directPath = await this.getDirectPath(start, end);
    const safetyChecks = await this.assessPathSafety(directPath);
    
    if (safetyChecks.every(check => check < 0.7)) {
      return directPath;
    }
    
    return this.findAlternativeRoute(start, end, directPath, safetyChecks);
  }

  private async getDirectPath(start: GeoPoint, end: GeoPoint): Promise<GeoPoint[]> {
    const steps = 10;
    const path: GeoPoint[] = [];
    
    for (let i = 0; i <= steps; i++) {
      path.push({
        latitude: start.latitude + (end.latitude - start.latitude) * (i / steps),
        longitude: start.longitude + (end.longitude - start.longitude) * (i / steps),
      });
    }
    
    return path;
  }

  private async assessPathSafety(path: GeoPoint[]): Promise<number[]> {
    return Promise.all(
      path.map(point => predictionService.predictRisk(point, new Date()))
    );
  }

  private async findAlternativeRoute(
    start: GeoPoint,
    end: GeoPoint,
    originalPath: GeoPoint[],
    riskScores: number[]
  ): Promise<GeoPoint[]> {
    const highRiskIndex = riskScores.findIndex(score => score >= 0.7);
    if (highRiskIndex === -1) return originalPath;

    const midPoint = originalPath[highRiskIndex];
    const offset = 0.001; // Roughly 100m
    
    const alternativeWaypoint = {
      latitude: midPoint.latitude + offset,
      longitude: midPoint.longitude + offset,
    };

    const firstHalf = await this.getDirectPath(start, alternativeWaypoint);
    const secondHalf = await this.getDirectPath(alternativeWaypoint, end);

    return [...firstHalf, ...secondHalf.slice(1)];
  }

  async findSafestRoute(start: GeoPoint, end: GeoPoint): Promise<Route[]> {
    try {
      const routes = await this.getRouteOptions(start, end);
      
      // Enhance routes with segment analysis
      const enhancedRoutes = await Promise.all(
        routes.map(async route => {
          const segmentAnalyses = await this.analyzeRouteSegments(route);
          const routeWithTraffic = await this.getTrafficAdjustedRoute(route);
          const safetyScore = this.calculateOverallSafetyScore(segmentAnalyses);

          return {
            ...routeWithTraffic,
            safetyScore,
            segmentAnalyses,
            finalScore: this.calculateFinalScore(safetyScore, routeWithTraffic.trafficPredictions)
          };
        })
      );

      return enhancedRoutes
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, 3);
    } catch (error) {
      console.error('Error finding safest route:', error);
      throw error;
    }
  }

  private async analyzeRouteSegments(route: Route): Promise<SegmentAnalysis[]> {
    const segments = this.segmentRoute([route.startPoint, ...route.waypoints, route.endPoint]);
    const analyses: SegmentAnalysis[] = [];

    for (const segment of segments) {
      const [safetyScore, prediction, trafficData] = await Promise.all([
        this.calculateSegmentSafetyScore(segment),
        incidentPrediction.predictIncidents([segment[0], segment[segment.length - 1]]),
        trafficMonitoring.getRealtimeTraffic(segment[0])
      ]);

      const segmentKey = this.getSegmentKey(segment);
      analyses.push({
        segment,
        safetyScore,
        incidentPrediction: prediction.get(segmentKey)!,
        trafficScore: this.calculateTrafficScore(trafficData),
        infrastructureScore: await this.getInfrastructureScore(segment)
      });
    }

    return analyses;
  }

  private async calculateSegmentSafetyScore(segment: GeoPoint[]): Promise<number> {
    const factors = await Promise.all([
      this.getLightingScore({ startPoint: segment[0], endPoint: segment[segment.length - 1] } as Route),
      this.getCrowdScore({ startPoint: segment[0], endPoint: segment[segment.length - 1] } as Route)
    ]);

    return factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0) /
      factors.reduce((sum, factor) => sum + factor.weight, 0);
  }

  private async getLightingScore(route: Route): Promise<SafetyFactor> {
    const { data: streetlights } = await supabase
      .from('infrastructure')
      .select('*')
      .eq('type', 'streetlight')
      .eq('status', 'functional');

    // Calculate lighting coverage along route
    const coverage = this.calculateInfrastructureCoverage(route, streetlights);

    return {
      type: 'lighting',
      weight: 0.3,
      score: coverage
    };
  }

  private calculateInfrastructureCoverage(route: Route, infrastructure: any[]): number {
    // Implementation of coverage calculation
    return 0.8; // Placeholder
  }

  private async getCrowdScore(route: Route): Promise<SafetyFactor> {
    // Get real-time crowd data from nearby users
    const { data: userLocations } = await supabase
      .from('user_locations')
      .select('*')
      .gte('updated_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()); // Last 15 mins

    // Get historical crowd patterns
    const { data: historicalPatterns } = await supabase
      .from('crowd_patterns')
      .select('*')
      .eq('day_of_week', new Date().getDay())
      .eq('hour', new Date().getHours());

    const crowdDensity = this.calculateCrowdDensity(route, userLocations, historicalPatterns);

    return {
      type: 'crowd',
      weight: 0.2,
      score: crowdDensity
    };
  }

  private async getIncidentHistory(route: Route): Promise<SafetyFactor> {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Get recent incidents along route
    const { data: incidents } = await supabase
      .from('safety_alerts')
      .select('*')
      .gte('created_at', lastMonth.toISOString());

    // Get infrastructure issues
    const { data: infraIssues } = await supabase
      .from('infrastructure_reports')
      .select('*')
      .in('status', ['pending', 'in_progress']);

    const safetyScore = this.calculateSafetyScore(route, incidents, infraIssues);

    return {
      type: 'incidents',
      weight: 0.3,
      score: safetyScore
    };
  }

  private async getInfrastructureScore(route: Route): Promise<SafetyFactor> {
    // Get infrastructure quality data
    const { data: infrastructure } = await supabase
      .from('infrastructure_reports')
      .select('*')
      .in('type', ['streetlight', 'road_damage', 'traffic_signal'])
      .in('status', ['pending', 'in_progress']);

    const qualityScore = this.calculateInfrastructureQuality(route, infrastructure);

    return {
      type: 'infrastructure',
      weight: 0.2,
      score: qualityScore
    };
  }

  async getRouteOptions(start: GeoPoint, end: GeoPoint): Promise<Route[]> {
    try {
      // Get base routes from mapping service
      const baseRoutes = await this.getBaseRoutes(start, end);

      // Enhance routes with safety data
      const enhancedRoutes = await Promise.all(
        baseRoutes.map(async route => {
          const nearbyReports = await infrastructureReporting.getReportsNearby(route.startPoint);
          const safetyFactors = await this.calculateRouteSafetyScore(route);

          return {
            ...route,
            infrastructureIssues: nearbyReports,
            safetyScore: safetyFactors,
          };
        })
      );

      return enhancedRoutes;
    } catch (error) {
      console.error('Error getting route options:', error);
      throw error;
    }
  }

  private async getTrafficAdjustedRoute(route: Route): Promise<Route> {
    const departureTime = new Date();
    const trafficData = await trafficMonitoring.getRealtimeTraffic(route.startPoint);
    const predictions = await trafficMonitoring.predictTraffic(
      [route.startPoint, ...route.waypoints, route.endPoint],
      departureTime
    );

    // Adjust estimated duration based on traffic
    const trafficMultiplier = this.calculateTrafficMultiplier(predictions);
    const estimatedTimeWithTraffic = route.estimatedDuration * trafficMultiplier;

    return {
      ...route,
      trafficData,
      trafficPredictions: predictions,
      estimatedTimeWithTraffic
    };
  }

  private calculateTrafficMultiplier(predictions: TrafficPrediction[]): number {
    const avgCongestion = predictions.reduce(
      (sum, pred) => sum + pred.predictedCongestion, 
      0
    ) / predictions.length;

    // Congestion levels: 0-1 (free flow) to 5 (standstill)
    return 1 + (avgCongestion * 0.2); // Each congestion level adds 20% to travel time
  }

  private calculateFinalScore(safetyScore: number, trafficPredictions: TrafficPrediction[]): number {
    // Implement the logic to combine safety and traffic scores
    return safetyScore; // Placeholder
  }

  async startRouteMonitoring(
    routeId: string,
    onRerouteNeeded: (newRoute: Route) => void
  ): Promise<() => void> {
    const route = await this.getRoute(routeId);
    if (!route) throw new Error('Route not found');

    const interval = setInterval(async () => {
      try {
        const shouldReroute = await this.checkRerouteNeeded(route);
        if (shouldReroute) {
          const alternativeRoute = await this.findAlternativeRoute(route);
          if (alternativeRoute) {
            onRerouteNeeded(alternativeRoute);
          }
        }
      } catch (error) {
        console.error('Error monitoring route:', error);
      }
    }, 60000); // Check every minute

    this.routeMonitors.set(routeId, interval);

    return () => {
      clearInterval(interval);
      this.routeMonitors.delete(routeId);
    };
  }

  private async checkRerouteNeeded(route: Route): Promise<boolean> {
    const trafficData = await trafficMonitoring.getRealtimeTraffic(route.startPoint);
    const weather = await weatherMonitoring.getCurrentWeather(route.startPoint);
    const weatherImpact = await weatherMonitoring.getWeatherImpact(weather);

    // Check for significant traffic changes
    const currentTrafficScore = this.calculateTrafficScore(trafficData);
    const originalTrafficScore = this.calculateTrafficScore(route.trafficData || []);
    const trafficDegradation = currentTrafficScore - originalTrafficScore;

    // Check for weather impact
    const significantWeather = weatherImpact > 0.5;

    // Check for new incidents
    const newIncidents = await this.checkNewIncidents(route);

    return (
      trafficDegradation > 0.3 || // 30% traffic degradation
      significantWeather ||
      newIncidents
    );
  }

  private async findAlternativeRoute(currentRoute: Route): Promise<Route | null> {
    const alternatives = await this.findSafestRoute(
      currentRoute.startPoint,
      currentRoute.endPoint
    );

    // Filter out the current route and routes with similar issues
    const viableAlternatives = alternatives.filter(route => 
      route.id !== currentRoute.id &&
      this.isViableAlternative(route, currentRoute)
    );

    return viableAlternatives[0] || null;
  }

  private isViableAlternative(alternative: Route, current: Route): boolean {
    // Check if alternative is significantly better
    const timeDifference = 
      current.estimatedTimeWithTraffic - alternative.estimatedTimeWithTraffic;
    const safetyDifference = alternative.safetyScore - current.safetyScore;

    return (
      timeDifference > 300 || // 5 minutes faster
      safetyDifference > 0.2 // 20% safer
    );
  }

  private calculateTrafficScore(trafficData: TrafficData[]): number {
    if (!trafficData.length) return 0;

    return trafficData.reduce(
      (score, data) => score + (5 - data.congestion_level) / 5,
      0
    ) / trafficData.length;
  }

  private async checkNewIncidents(route: Route): Promise<boolean> {
    const { data: incidents } = await supabase
      .from('safety_alerts')
      .select('*')
      .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString());

    if (!incidents) return false;

    return incidents.some(incident =>
      this.isIncidentOnRoute(incident, route)
    );
  }

  private isIncidentOnRoute(incident: any, route: Route): boolean {
    // Check if incident is within 100m of any point on the route
    return [route.startPoint, ...route.waypoints, route.endPoint].some(point =>
      getDistance(point, {
        latitude: incident.latitude,
        longitude: incident.longitude
      }) <= 100
    );
  }

  private calculateOverallSafetyScore(analyses: SegmentAnalysis[]): number {
    return analyses.reduce((sum, analysis) => 
      sum + analysis.safetyScore * this.getSegmentWeight(analysis), 0
    ) / analyses.length;
  }

  private getSegmentWeight(analysis: SegmentAnalysis): number {
    // Give more weight to segments with high incident predictions
    return 1 + (analysis.incidentPrediction.probability * 0.5);
  }
}

export const safeRouting = SafeRoutingService.getInstance(); 