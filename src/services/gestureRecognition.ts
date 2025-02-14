import { Accelerometer, AccelerometerMeasurement } from 'expo-sensors';
import { EmergencyAlert } from '../types';

interface GesturePattern {
  name: string;
  type: EmergencyAlert['type'];
  threshold: number;
  timeWindow: number; // in milliseconds
  minOccurrences: number;
}

const EMERGENCY_GESTURES: GesturePattern[] = [
  {
    name: 'rapid_shake',
    type: 'danger',
    threshold: 2.5, // acceleration threshold
    timeWindow: 2000, // 2 seconds
    minOccurrences: 5,
  },
  {
    name: 'sos_pattern',
    type: 'danger',
    threshold: 1.8,
    timeWindow: 3000, // 3 seconds
    minOccurrences: 3,
  },
];

class GestureRecognitionService {
  private static instance: GestureRecognitionService;
  private isMonitoring: boolean = false;
  private accelerometerSubscription?: ReturnType<typeof Accelerometer.addListener>;
  private measurements: AccelerometerMeasurement[] = [];
  private onGestureDetected?: (type: EmergencyAlert['type']) => void;

  private constructor() {}

  static getInstance(): GestureRecognitionService {
    if (!this.instance) {
      this.instance = new GestureRecognitionService();
    }
    return this.instance;
  }

  async startMonitoring(onGestureDetected: (type: EmergencyAlert['type']) => void) {
    try {
      this.onGestureDetected = onGestureDetected;
      this.isMonitoring = true;
      await Accelerometer.setUpdateInterval(100); // 10 times per second

      this.accelerometerSubscription = Accelerometer.addListener(measurement => {
        this.processMeasurement(measurement);
      });
    } catch (error) {
      console.error('Error starting gesture monitoring:', error);
    }
  }

  private processMeasurement(measurement: AccelerometerMeasurement) {
    const now = Date.now();
    this.measurements.push(measurement);

    // Remove old measurements
    this.measurements = this.measurements.filter(
      m => now - m.timestamp < Math.max(...EMERGENCY_GESTURES.map(g => g.timeWindow))
    );

    // Check for gesture patterns
    for (const gesture of EMERGENCY_GESTURES) {
      if (this.detectGesturePattern(gesture)) {
        this.onGestureDetected?.(gesture.type);
        this.stopMonitoring();
        break;
      }
    }
  }

  private detectGesturePattern(gesture: GesturePattern): boolean {
    const now = Date.now();
    const relevantMeasurements = this.measurements.filter(
      m => now - m.timestamp < gesture.timeWindow
    );

    let occurrences = 0;
    for (const measurement of relevantMeasurements) {
      const magnitude = Math.sqrt(
        Math.pow(measurement.x, 2) +
        Math.pow(measurement.y, 2) +
        Math.pow(measurement.z, 2)
      );

      if (magnitude > gesture.threshold) {
        occurrences++;
      }
    }

    return occurrences >= gesture.minOccurrences;
  }

  async stopMonitoring() {
    this.isMonitoring = false;
    this.accelerometerSubscription?.remove();
    this.measurements = [];
  }

  isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }
}

export const gestureRecognition = GestureRecognitionService.getInstance(); 