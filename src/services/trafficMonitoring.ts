import { GeoPoint, TrafficData, TrafficPrediction } from '../types';
import { supabase } from './supabase';
import * as tf from '@tensorflow/tfjs';
import { getDistance } from '../utils/distance';

class TrafficMonitoringService {
  private static instance: TrafficMonitoringService;
  private model: tf.LayersModel | null = null;
  private trafficCache: Map<string, TrafficData> = new Map();

  private constructor() {
    this.initializeModel();
  }

  static getInstance(): TrafficMonitoringService {
    if (!this.instance) {
      this.instance = new TrafficMonitoringService();
    }
    return this.instance;
  }

  private async initializeModel() {
    try {
      this.model = await tf.loadLayersModel('assets/traffic_model/model.json');
    } catch (error) {
      console.error('Error loading traffic prediction model:', error);
    }
  }

  async getRealtimeTraffic(location: GeoPoint, radius: number = 1000): Promise<TrafficData[]> {
    const { data: trafficData } = await supabase
      .from('traffic_data')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 15 * 60 * 1000).toISOString());

    if (!trafficData) return [];

    return trafficData.filter(data => 
      getDistance(location, {
        latitude: data.latitude,
        longitude: data.longitude
      }) <= radius
    );
  }

  async predictTraffic(
    route: GeoPoint[], 
    departureTime: Date
  ): Promise<TrafficPrediction[]> {
    if (!this.model) {
      throw new Error('Traffic prediction model not initialized');
    }

    const predictions = await Promise.all(
      route.map(async point => {
        const features = await this.extractFeatures(point, departureTime);
        const prediction = this.model!.predict(features) as tf.Tensor;
        const [congestionLevel] = await prediction.data();

        return {
          location: point,
          predictedCongestion: congestionLevel,
          confidence: 0.85, // Placeholder
          timestamp: departureTime.toISOString()
        };
      })
    );

    return predictions;
  }

  private async extractFeatures(point: GeoPoint, time: Date): Promise<tf.Tensor> {
    const historicalData = await this.getHistoricalTraffic(point, time);
    const weatherData = await this.getWeatherData(point);
    const events = await this.getNearbyEvents(point, time);

    // Normalize and combine features
    const features = [
      time.getHours() / 24,
      time.getDay() / 7,
      historicalData.averageCongestion,
      weatherData.precipitation,
      weatherData.visibility,
      events.length / 10,
      // Add more features as needed
    ];

    return tf.tensor2d([features], [1, features.length]);
  }

  private async getHistoricalTraffic(point: GeoPoint, time: Date) {
    const { data } = await supabase
      .from('historical_traffic')
      .select('congestion_level')
      .eq('day_of_week', time.getDay())
      .eq('hour', time.getHours())
      .near('location', [point.latitude, point.longitude], 1000);

    return {
      averageCongestion: data?.reduce((sum, d) => sum + d.congestion_level, 0) / (data?.length || 1)
    };
  }

  async updateTrafficData(data: TrafficData): Promise<void> {
    await supabase
      .from('traffic_data')
      .insert([{
        ...data,
        timestamp: new Date().toISOString()
      }]);

    // Update cache
    const cacheKey = `${data.latitude},${data.longitude}`;
    this.trafficCache.set(cacheKey, data);
  }
}

export const trafficMonitoring = TrafficMonitoringService.getInstance(); 