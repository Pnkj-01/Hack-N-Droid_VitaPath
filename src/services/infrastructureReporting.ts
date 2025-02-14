import { GeoPoint, InfrastructureReport, InfrastructureType } from '../types';
import { supabase } from './supabase';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from './storage';

class InfrastructureReportingService {
  private static instance: InfrastructureReportingService;

  static getInstance(): InfrastructureReportingService {
    if (!this.instance) {
      this.instance = new InfrastructureReportingService();
    }
    return this.instance;
  }

  async reportInfrastructureIssue(
    type: InfrastructureType,
    location: GeoPoint,
    description: string,
    severity: 1 | 2 | 3,
    images?: string[]
  ): Promise<InfrastructureReport> {
    try {
      // Upload images if provided
      const imageUrls = images ? await Promise.all(
        images.map(image => uploadImage(image, 'infrastructure-reports'))
      ) : [];

      // Create report
      const { data: report, error } = await supabase
        .from('infrastructure_reports')
        .insert([
          {
            type,
            latitude: location.latitude,
            longitude: location.longitude,
            description,
            severity,
            images: imageUrls,
            status: 'pending',
            created_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Notify relevant authorities
      await this.notifyAuthorities(report);

      return report;
    } catch (error) {
      console.error('Error reporting infrastructure issue:', error);
      throw error;
    }
  }

  async getReportsNearby(location: GeoPoint, radius: number = 1000): Promise<InfrastructureReport[]> {
    const { data: reports } = await supabase
      .from('infrastructure_reports')
      .select('*');

    if (!reports) return [];

    return reports.filter(report => 
      getDistance(location, {
        latitude: report.latitude,
        longitude: report.longitude
      }) <= radius
    );
  }

  private async notifyAuthorities(report: InfrastructureReport) {
    // Implementation of authority notification
  }

  async verifyReport(reportId: string, userId: string): Promise<void> {
    const { data: report } = await supabase
      .from('infrastructure_reports')
      .select('verifications')
      .eq('id', reportId)
      .single();

    if (!report) throw new Error('Report not found');

    // Add user verification
    const verifications = [...(report.verifications || []), userId];

    await supabase
      .from('infrastructure_reports')
      .update({ 
        verifications,
        verification_count: verifications.length,
        last_verified: new Date().toISOString()
      })
      .eq('id', reportId);
  }

  async updateReportStatus(
    reportId: string,
    status: InfrastructureReport['status'],
    notes?: string
  ): Promise<void> {
    await supabase
      .from('infrastructure_reports')
      .update({
        status,
        authority_notes: notes,
        updated_at: new Date().toISOString(),
        ...(status === 'resolved' ? { resolved_at: new Date().toISOString() } : {})
      })
      .eq('id', reportId);
  }

  async getReportStatistics(location: GeoPoint, radius: number = 5000) {
    const reports = await this.getReportsNearby(location, radius);

    return {
      total: reports.length,
      byType: reports.reduce((acc, report) => ({
        ...acc,
        [report.type]: (acc[report.type] || 0) + 1
      }), {} as Record<InfrastructureType, number>),
      byStatus: reports.reduce((acc, report) => ({
        ...acc,
        [report.status]: (acc[report.status] || 0) + 1
      }), {} as Record<InfrastructureReport['status'], number>),
      averageResolutionTime: this.calculateAverageResolutionTime(reports),
    };
  }

  private calculateAverageResolutionTime(reports: InfrastructureReport[]): number {
    const resolvedReports = reports.filter(r => 
      r.status === 'resolved' && r.resolved_at
    );

    if (resolvedReports.length === 0) return 0;

    const totalTime = resolvedReports.reduce((sum, report) => {
      const created = new Date(report.created_at);
      const resolved = new Date(report.resolved_at!);
      return sum + (resolved.getTime() - created.getTime());
    }, 0);

    return totalTime / resolvedReports.length / (1000 * 60 * 60 * 24); // In days
  }
}

export const infrastructureReporting = InfrastructureReportingService.getInstance(); 