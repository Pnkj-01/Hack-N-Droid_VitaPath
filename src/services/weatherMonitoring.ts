import { GeoPoint, WeatherData } from '../types';
import { supabase } from './supabase';

class WeatherMonitoringService {
  private static instance: WeatherMonitoringService;
  private weatherCache: Map<string, WeatherData & { timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  static getInstance(): WeatherMonitoringService {
    if (!this.instance) {
      this.instance = new WeatherMonitoringService();
    }
    return this.instance;
  }

  async getCurrentWeather(location: GeoPoint): Promise<WeatherData> {
    const cacheKey = `${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}`;
    const cached = this.weatherCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached;
    }

    // Fetch from weather API (implement your preferred weather service)
    const weather = await this.fetchWeatherData(location);
    
    this.weatherCache.set(cacheKey, {
      ...weather,
      timestamp: Date.now()
    });

    return weather;
  }

  async getWeatherForecast(location: GeoPoint, hours: number = 24): Promise<WeatherData[]> {
    // Implement hourly forecast fetching
    return [];
  }

  async getWeatherImpact(weather: WeatherData): Promise<number> {
    // Calculate impact score (0-1) based on weather conditions
    let impact = 0;

    // Visibility impact
    impact += (1 - weather.visibility / 10) * 0.3;

    // Precipitation impact
    impact += (weather.precipitation / 50) * 0.4;

    // Temperature impact (extreme temperatures)
    const tempImpact = Math.abs(weather.temperature - 20) / 30;
    impact += tempImpact * 0.2;

    // Wind impact
    impact += (weather.wind_speed / 50) * 0.1;

    return Math.min(Math.max(impact, 0), 1);
  }

  private async fetchWeatherData(location: GeoPoint): Promise<WeatherData> {
    // Implement your weather API call here
    return {
      temperature: 20,
      precipitation: 0,
      visibility: 10,
      wind_speed: 5
    };
  }
}

export const weatherMonitoring = WeatherMonitoringService.getInstance(); 