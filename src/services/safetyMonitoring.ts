import type { GeoPoint, RiskAssessment } from '../types';
import { safetyService } from './safety';
import { notificationService } from './notifications';

interface MonitoringCallbacks {
  onRiskChange?: (assessment: RiskAssessment) => void;
  onIncident?: () => void;
}

class SafetyMonitoringService {
  private static instance: SafetyMonitoringService;
  private intervals: Map<string, NodeJS.Timer> = new Map();

  private constructor() {}

  static getInstance(): SafetyMonitoringService {
    if (!this.instance) {
      this.instance = new SafetyMonitoringService();
    }
    return this.instance;
  }

  async startMonitoring(
    userId: string, 
    location: GeoPoint,
    callbacks?: MonitoringCallbacks
  ): Promise<void> {
    const monitorId = `${userId}-${location.latitude},${location.longitude}`;
    
    if (this.intervals.has(monitorId)) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const assessment = await safetyService.getRiskAssessment(location);
        
        if (assessment.level === 'high') {
          await notificationService.show({
            type: 'warning',
            message: 'Safety risk level has increased in your area',
            duration: 0,
          });
          callbacks?.onRiskChange?.(assessment);
        }
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, 30000); // Check every 30 seconds

    this.intervals.set(monitorId, interval);
  }

  stopMonitoring(userId: string, location: GeoPoint): void {
    const monitorId = `${userId}-${location.latitude},${location.longitude}`;
    const interval = this.intervals.get(monitorId);
    
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(monitorId);
    }
  }
}

export const safetyMonitoring = SafetyMonitoringService.getInstance(); 