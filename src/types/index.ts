// Base Types
export interface GeoPoint {
    latitude: number;
    longitude: number;
}

export interface Location extends GeoPoint {
    // Additional location properties if needed
}

// User and Contact Types
export interface User {
    id: string;
    email: string;
    name?: string;
    phone?: string;
    emergencyContacts?: EmergencyContact[];
    avatar_url?: string;
    groups: Group[];
    location_sharing_enabled: boolean;
    last_known_location?: GeoPoint;
    last_location_update?: string;
}

export interface EmergencyContact {
    id: string;
    name: string;
    phone: string;
    relationship: string;
    priority: number;
    email?: string;
    whatsapp?: string;
    preferred_language?: Language;
    emergency_type_preferences?: EmergencyAlert['type'][];
}

// Alert Types
export interface SafetyAlert {
    id: string;
    userId: string;
    location: Location;
    timestamp: Date;
    type: 'emergency' | 'warning' | 'info';
}

export interface EmergencyAlert {
    id: string;
    user_id: string;
    location: GeoPoint;
    status: 'active' | 'resolved';
    type: 'danger' | 'medical' | 'fire' | 'other';
    severity: 1 | 2 | 3; // 1 = high, 2 = medium, 3 = low
    contacted_authorities: boolean;
    contacted_emergency_contacts: boolean;
    created_at: string;
    resolved_at?: string | null;
    description?: string;
}

// Safety Types
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
    factors: Record<string, number>;
    timestamp: string;
}

export interface SafetyReport {
    id: string;
    created_at: string;
    severity: number;
}

// Navigation Types
export interface Route {
    id: string;
    startPoint: GeoPoint;
    endPoint: GeoPoint;
    waypoints: GeoPoint[];
    distance: number;
    estimatedDuration: number;
    safetyScore: number;
    safetyFactors: {
        lighting: number;
        crowd: number;
        incidents: number;
        infrastructure: number;
    };
    infrastructureIssues: InfrastructureReport[];
    alternativeRoutes?: Route[];
    trafficData?: TrafficData[];
    trafficPredictions?: TrafficPrediction[];
    weatherConditions?: WeatherData;
    estimatedTimeWithTraffic: number;
}

// Database Schema Types
export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string;
                    name: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    email: string;
                    name?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    name?: string | null;
                    created_at?: string;
                };
            };
            safety_alerts: {
                Row: {
                    id: string;
                    user_id: string;
                    latitude: number;
                    longitude: number;
                    type: 'emergency' | 'warning' | 'info';
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    latitude: number;
                    longitude: number;
                    type: 'emergency' | 'warning' | 'info';
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    latitude?: number;
                    longitude?: number;
                    type?: 'emergency' | 'warning' | 'info';
                    created_at?: string;
                };
            };
            emergency_alerts: {
                Row: {
                    id: string;
                    user_id: string;
                    latitude: number;
                    longitude: number;
                    status: 'active' | 'resolved';
                    contacted_authorities: boolean;
                    created_at: string;
                    resolved_at: string | null;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    latitude: number;
                    longitude: number;
                    status?: 'active' | 'resolved';
                    contacted_authorities?: boolean;
                    created_at?: string;
                    resolved_at?: string | null;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    latitude?: number;
                    longitude?: number;
                    status?: 'active' | 'resolved';
                    contacted_authorities?: boolean;
                    created_at?: string;
                    resolved_at?: string | null;
                };
            };
            user_locations: {
                Row: {
                    id: string;
                    user_id: string;
                    group_id: string;
                    latitude: number;
                    longitude: number;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    group_id: string;
                    latitude: number;
                    longitude: number;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    group_id?: string;
                    latitude?: number;
                    longitude?: number;
                    updated_at?: string;
                };
            };
            group_messages: {
                Row: {
                    id: string;
                    group_id: string;
                    user_id: string;
                    content: string;
                    created_at: string;
                    type: 'text' | 'location' | 'alert';
                };
                Insert: {
                    id?: string;
                    group_id: string;
                    user_id: string;
                    content: string;
                    created_at?: string;
                    type?: 'text' | 'location' | 'alert';
                };
                Update: {
                    id?: string;
                    content?: string;
                    type?: 'text' | 'location' | 'alert';
                };
            };
            group_activities: {
                Row: {
                    id: string;
                    group_id: string;
                    user_id: string;
                    type: 'join' | 'leave' | 'location' | 'alert' | 'safety';
                    description: string;
                    created_at: string;
                    metadata?: Record<string, any>;
                };
                Insert: {
                    id?: string;
                    group_id: string;
                    user_id: string;
                    type: 'join' | 'leave' | 'location' | 'alert' | 'safety';
                    description: string;
                    created_at?: string;
                    metadata?: Record<string, any>;
                };
            };
            safe_zones: {
                Row: {
                    id: string;
                    group_id: string;
                    name: string;
                    latitude: number;
                    longitude: number;
                    radius: number;
                    created_by: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    group_id: string;
                    name: string;
                    latitude: number;
                    longitude: number;
                    radius: number;
                    created_by: string;
                    created_at?: string;
                };
            };
        };
    };
}

export interface Group {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  type: 'family' | 'friends' | 'custom';
  members: GroupMember[];
}

export interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  role: 'admin' | 'member';
  location_sharing: boolean;
  joined_at: string;
  nickname?: string;
}

// Add a type for realtime payload
export interface RealtimeLocationPayload {
  new: {
    user_id: string;
    latitude: number;
    longitude: number;
  };
}

// Add new types for safety features
export interface SafeZone {
  id: string;
  name: string;
  location: GeoPoint;
  radius: number;
  created_by: string;
  created_at: string;
}

export interface GroupActivity {
  id: string;
  type: 'join' | 'leave' | 'location' | 'alert' | 'safety';
  user_id: string;
  description: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface EmergencyService {
  id: string;
  name: string;
  type: 'police' | 'ambulance' | 'fire' | 'other';
  phone: string;
  jurisdiction: string;
}

// Add to existing types
export interface EmergencyZone {
  id: string;
  name: string;
  location: GeoPoint;
  radius: number;
  type: 'safe' | 'unsafe' | 'police' | 'hospital';
  contact_info?: {
    phone: string;
    address: string;
  };
}

export interface EmergencyTemplate {
  id: string;
  type: EmergencyAlert['type'];
  title: string;
  description: string;
  priority: 1 | 2 | 3;
  actions: {
    notify_contacts: boolean;
    notify_authorities: boolean;
    notify_group: boolean;
  };
}

export interface EmergencyResponse {
  id: string;
  alert_id: string;
  responder_id: string;
  status: 'acknowledged' | 'en_route' | 'arrived' | 'resolved';
  eta?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Add to existing types
export type Language = 
  | 'en'  // English
  | 'hi'  // Hindi
  | 'mr'  // Marathi
  | 'ta'  // Tamil
  | 'te'  // Telugu
  | 'kn'  // Kannada
  | 'ml'  // Malayalam
  | 'gu'  // Gujarati
  | 'bn'  // Bengali
  | 'pa'  // Punjabi
  | 'ur'  // Urdu
  | 'or'  // Odia
  | 'as'; // Assamese

// Add to existing types
export type InfrastructureType = 
  | 'pothole'
  | 'streetlight'
  | 'road_damage'
  | 'traffic_signal'
  | 'drainage'
  | 'sidewalk'
  | 'road_marking'
  | 'road_sign';

export interface InfrastructureReport {
  id: string;
  type: InfrastructureType;
  latitude: number;
  longitude: number;
  description: string;
  severity: 1 | 2 | 3;
  images?: string[];
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  created_at: string;
  resolved_at?: string;
  authority_notes?: string;
}

// Add to existing types
export interface TrafficData {
  latitude: number;
  longitude: number;
  speed: number;
  congestion_level: number;
  incident_type?: 'accident' | 'construction' | 'event';
  timestamp: string;
}

export interface TrafficPrediction {
  location: GeoPoint;
  predictedCongestion: number;
  confidence: number;
  timestamp: string;
}

export interface WeatherData {
  temperature: number;
  precipitation: number;
  visibility: number;
  wind_speed: number;
}

// Add to existing types
export interface CrimeHotspot {
  id: string;
  location: GeoPoint;
  radius: number;
  riskLevel: 1 | 2 | 3 | 4 | 5; // 5 being highest risk
  crimeTypes: CrimeType[];
  timePattern: TimePattern;
  activeHours: { start: number; end: number }[];
  lastUpdated: string;
  confidence: number;
}

export type CrimeType = 
  | 'harassment'
  | 'eve_teasing'
  | 'assault'
  | 'kidnapping'
  | 'theft'
  | 'vehicle_crime'
  | 'substance_abuse'
  | 'gang_activity';

export interface TimePattern {
  hourly: number[];      // 24 values for each hour
  daily: number[];       // 7 values for each day
  monthly: number[];     // 12 values for each month
  seasonal: number[];    // 4 values for seasons
}

export interface CrimePrediction {
  location: GeoPoint;
  riskScore: number;
  crimeTypes: Array<{
    type: CrimeType;
    probability: number;
  }>;
  timeWindow: {
    start: Date;
    end: Date;
  };
  factors: CrimeRiskFactors;
}

export interface CrimeRiskFactors {
  lighting: number;
  surveillance: number;
  crowdDensity: number;
  policeProximity: number;
  historicalIncidents: number;
  demographicRisk: number;
  infrastructureQuality: number;
  socialFactors: number;
}

// Add to existing types
export interface SafeHaven {
  id: string;
  name: string;
  location: GeoPoint;
  type: SafeHavenType;
  status: 'active' | 'full' | 'closed';
  capacity: {
    total: number;
    current: number;
  };
  contact: {
    phone: string;
    whatsapp?: string;
    emergency_line: string;
  };
  services: SafeHavenService[];
  operatingHours: {
    start: number; // 24-hour format
    end: number;
  };
  security: SecurityFeature[];
  lastVerified: string;
  rating: number;
}

export type SafeHavenType = 
  | 'women_shelter'
  | 'police_station'
  | 'hospital'
  | 'ngo_center'
  | 'community_center'
  | 'verified_business'
  | 'religious_place';

export type SafeHavenService = 
  | 'emergency_stay'
  | 'medical_aid'
  | 'counseling'
  | 'legal_aid'
  | 'transportation'
  | 'food_water'
  | 'communication'
  | 'child_care';

export type SecurityFeature = 
  | 'security_guard'
  | 'cctv'
  | 'police_connection'
  | 'panic_button'
  | 'secured_entrance'
  | 'women_security'
  | '24x7_staff';

export interface IncidentReport {
  id: string;
  type: 'medical' | 'security' | 'fire' | 'other';
  location: GeoPoint;
  description?: string;
  severity: 1 | 2 | 3;
  status: 'active' | 'resolved';
  reporterId: string;
  timestamp: string;
}