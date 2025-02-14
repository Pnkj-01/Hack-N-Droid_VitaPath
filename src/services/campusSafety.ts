import { GeoPoint, SafetyAlert, InfrastructureReport, User } from '../types';
import { supabase } from './supabase';

interface CampusZone {
  id: string;
  name: string;
  type: 'academic' | 'residential' | 'library' | 'cafeteria' | 'sports' | 'parking' | 'transit';
  boundaries: GeoPoint[];
  risk_level: number;
  operating_hours: {
    start: number;
    end: number;
  };
  security_features: CampusSecurityFeature[];
}

interface CampusSecurityFeature {
  type: 'emergency_phone' | 'security_camera' | 'guard_post' | 'lighting' | 'help_point';
  location: GeoPoint;
  status: 'active' | 'inactive' | 'maintenance';
  last_checked: string;
}

interface CampusReport extends InfrastructureReport {
  category: 'harassment' | 'suspicious_activity' | 'facility_issue' | 'security_concern';
  location_detail: string; // e.g., "Near Physics Lab", "Library 2nd Floor"
  anonymous: boolean;
  witnesses?: string[];
  institutional_response?: {
    department: string;
    action_taken: string;
    response_time: number;
  };
}

interface OfficeHoursSchedule {
  professor_id: string;
  location: {
    building: string;
    room: string;
    floor: number;
  };
  timing: {
    day: number;
    start: number;
    end: number;
  }[];
  safety_features: {
    has_window: boolean;
    door_lock: boolean;
    proximity_to_security: number;
    emergency_button: boolean;
  };
}

interface CampusTransport {
  id: string;
  type: 'shuttle' | 'night_bus' | 'security_escort';
  route_name: string;
  current_location?: GeoPoint;
  capacity: number;
  current_occupancy: number;
  schedule: {
    frequency: number; // minutes
    first_departure: number;
    last_departure: number;
  };
  tracking_enabled: boolean;
  security_features: string[];
  driver_details?: {
    id: string;
    name: string;
    phone: string;
    verified: boolean;
  };
}

interface HostelSecurity {
  building_id: string;
  entry_points: {
    type: 'main' | 'emergency' | 'side';
    location: GeoPoint;
    status: 'open' | 'closed' | 'maintenance';
    guard_present: boolean;
    has_camera: boolean;
  }[];
  current_status: {
    occupancy: number;
    guards_on_duty: number;
    last_patrol: string;
    alerts_active: boolean;
  };
  access_control: {
    biometric: boolean;
    card_reader: boolean;
    visitor_log: boolean;
    curfew_hours?: {
      start: number;
      end: number;
    };
  };
}

class CampusSafetyService {
  private static instance: CampusSafetyService;

  static getInstance(): CampusSafetyService {
    if (!this.instance) {
      this.instance = new CampusSafetyService();
    }
    return this.instance;
  }

  async reportIncident(
    report: Partial<CampusReport>,
    user: User
  ): Promise<void> {
    const { data: institution } = await this.getInstitutionFromEmail(user.email);
    
    await supabase.from('campus_reports').insert([{
      ...report,
      institution_id: institution.id,
      reporter_id: report.anonymous ? null : user.id,
      created_at: new Date().toISOString(),
      status: 'pending',
      verification_count: 0
    }]);

    // Notify relevant authorities based on severity and type
    await this.notifyAuthorities(report, institution);
  }

  async verifyReport(reportId: string, userId: string): Promise<void> {
    const { data: report } = await supabase
      .from('campus_reports')
      .select('verifications, verification_count')
      .eq('id', reportId)
      .single();

    if (!report) throw new Error('Report not found');

    // Update verifications
    await supabase
      .from('campus_reports')
      .update({
        verifications: [...(report.verifications || []), userId],
        verification_count: (report.verification_count || 0) + 1,
        status: report.verification_count >= 2 ? 'verified' : 'pending'
      })
      .eq('id', reportId);
  }

  async getSafePathToCampusLocation(
    from: GeoPoint,
    to: GeoPoint,
    time: Date = new Date()
  ): Promise<Route> {
    const isNightTime = this.isNightTime(time);
    const routes = await this.getAllPossibleRoutes(from, to);

    return routes
      .map(route => ({
        ...route,
        safety_score: this.calculateCampusRouteSafety(route, isNightTime)
      }))
      .sort((a, b) => b.safety_score - a.safety_score)[0];
  }

  async getNearbySecurityFeatures(location: GeoPoint): Promise<CampusSecurityFeature[]> {
    const { data: features } = await supabase
      .from('campus_security_features')
      .select('*')
      .near('location', [location.latitude, location.longitude], 200) // Within 200m
      .eq('status', 'active');

    return features || [];
  }

  async requestCompanion(
    from: GeoPoint,
    to: GeoPoint,
    time: Date
  ): Promise<User[]> {
    // Find other students heading in the same direction
    const { data: potentialCompanions } = await supabase
      .from('companion_requests')
      .select('user_id')
      .gte('departure_time', new Date(time.getTime() - 15 * 60000).toISOString())
      .lte('departure_time', new Date(time.getTime() + 15 * 60000).toISOString())
      .near('start_location', [from.latitude, from.longitude], 200);

    return potentialCompanions || [];
  }

  async getZoneStatus(zoneId: string): Promise<{
    crowdedness: number;
    recent_incidents: number;
    security_presence: boolean;
    recommendations: string[];
  }> {
    // Implementation for getting real-time zone status
    return {
      crowdedness: 0.5,
      recent_incidents: 0,
      security_presence: true,
      recommendations: []
    };
  }

  async getOfficeHoursSafety(
    scheduleId: string,
    time: Date = new Date()
  ): Promise<{
    safety_score: number;
    recommendations: string[];
    nearby_security: CampusSecurityFeature[];
    emergency_contacts: any[];
  }> {
    const { data: schedule } = await supabase
      .from('office_hours_schedule')
      .select('*')
      .eq('id', scheduleId)
      .single();

    const buildingLocation = await this.getBuildingLocation(schedule.location.building);
    const securityFeatures = await this.getNearbySecurityFeatures(buildingLocation);
    const safetyScore = this.calculateOfficeSafety(schedule, time, securityFeatures);

    return {
      safety_score: safetyScore,
      recommendations: this.getOfficeHoursRecommendations(schedule, safetyScore),
      nearby_security: securityFeatures,
      emergency_contacts: await this.getEmergencyContacts(schedule.location.building)
    };
  }

  async trackCampusTransport(transportId: string): Promise<{
    current_location: GeoPoint;
    eta: number;
    occupancy: number;
    next_stops: Array<{
      location: GeoPoint;
      arrival_time: Date;
    }>;
    safety_status: {
      driver_verified: boolean;
      camera_active: boolean;
      security_guard: boolean;
      last_safety_check: string;
    };
  }> {
    const { data: transport } = await supabase
      .from('campus_transport')
      .select('*')
      .eq('id', transportId)
      .single();

    return {
      current_location: transport.current_location,
      eta: await this.calculateTransportETA(transport),
      occupancy: transport.current_occupancy,
      next_stops: await this.getNextStops(transport),
      safety_status: await this.getTransportSafetyStatus(transport)
    };
  }

  async getHostelSecurityStatus(
    hostelId: string,
    userId: string
  ): Promise<{
    access_status: 'allowed' | 'restricted' | 'curfew';
    current_security_level: number;
    active_alerts: any[];
    safe_exit_routes: GeoPoint[];
    emergency_procedures: string[];
  }> {
    const [hostel, userAccess] = await Promise.all([
      this.getHostelDetails(hostelId),
      this.getUserHostelAccess(hostelId, userId)
    ]);

    const securityStatus = await this.assessHostelSecurity(hostel);
    
    return {
      access_status: this.determineAccessStatus(userAccess, hostel),
      current_security_level: securityStatus.level,
      active_alerts: await this.getActiveHostelAlerts(hostelId),
      safe_exit_routes: await this.getHostelExitRoutes(hostelId),
      emergency_procedures: this.getEmergencyProcedures(hostel.type)
    };
  }

  async reportHostelSecurityIssue(
    issue: {
      hostel_id: string;
      type: 'unauthorized_access' | 'suspicious_activity' | 'facility_issue' | 'emergency';
      location: string;
      description: string;
      severity: 1 | 2 | 3;
    },
    user: User
  ): Promise<void> {
    // Create security issue report
    const { data: report } = await supabase
      .from('hostel_security_reports')
      .insert([{
        ...issue,
        reporter_id: user.id,
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    // Notify appropriate authorities
    if (issue.severity === 1) {
      await this.notifyHostelEmergency(report);
    }

    // Update security status
    await this.updateHostelSecurityStatus(issue.hostel_id);
  }

  private async getInstitutionFromEmail(email: string) {
    const domain = email.split('@')[1];
    return await supabase
      .from('institutions')
      .select('*')
      .eq('email_domain', domain)
      .single();
  }

  private async notifyAuthorities(report: Partial<CampusReport>, institution: any) {
    const authorities = await this.getDepartmentContacts(
      institution.id,
      report.category
    );

    // Notify campus security
    if (report.severity === 1) { // High severity
      await this.sendEmergencyAlert(authorities.emergency, report);
    }

    // Notify department heads
    await this.sendDepartmentNotification(authorities.department, report);
  }

  private calculateCampusRouteSafety(route: Route, isNightTime: boolean): number {
    const factors = {
      lighting: isNightTime ? 0.3 : 0.1,
      security_presence: 0.25,
      crowd_density: 0.2,
      incident_history: 0.15,
      emergency_access: 0.1
    };

    // Calculate safety score based on campus-specific factors
    return Object.entries(factors).reduce(
      (score, [factor, weight]) => score + (this.getFactorScore(route, factor) * weight),
      0
    );
  }

  private getFactorScore(route: Route, factor: string): number {
    // Implementation for calculating individual factor scores
    return 0.8; // Placeholder
  }

  private isNightTime(time: Date): boolean {
    const hour = time.getHours();
    return hour < 6 || hour >= 18;
  }

  private async calculateOfficeSafety(
    schedule: OfficeHoursSchedule,
    time: Date,
    securityFeatures: CampusSecurityFeature[]
  ): Promise<number> {
    const factors = {
      time_of_day: this.getTimeRiskFactor(time),
      security_proximity: this.calculateSecurityProximity(securityFeatures),
      room_safety: this.getRoomSafetyScore(schedule.safety_features),
      historical_incidents: await this.getLocationIncidentHistory(schedule.location)
    };

    return Object.values(factors).reduce((sum, score) => sum + score, 0) / 4;
  }

  private getOfficeHoursRecommendations(
    schedule: OfficeHoursSchedule,
    safetyScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (!schedule.safety_features.has_window) {
      recommendations.push('Keep door open during meetings');
    }

    if (safetyScore < 0.7) {
      recommendations.push('Consider meeting in library or public space');
      recommendations.push('Inform a friend about your meeting schedule');
    }

    return recommendations;
  }

  private async getTransportSafetyStatus(transport: CampusTransport) {
    const { data: status } = await supabase
      .from('transport_safety_checks')
      .select('*')
      .eq('transport_id', transport.id)
      .order('checked_at', { ascending: false })
      .limit(1)
      .single();

    return {
      driver_verified: transport.driver_details?.verified ?? false,
      camera_active: status?.camera_functional ?? false,
      security_guard: status?.guard_present ?? false,
      last_safety_check: status?.checked_at
    };
  }
}

export const campusSafety = CampusSafetyService.getInstance(); 