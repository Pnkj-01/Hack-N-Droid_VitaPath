import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from './useLocation';
import { safetyMonitoring } from '../services/safetyMonitoring';
import { notificationService } from '../services/notifications';
import type { RiskAssessment } from '../types';

export function useSafetyMonitoring() {
  const { user } = useAuth();
  const { location } = useLocation();

  useEffect(() => {
    if (!user || !location) return;

    const handleRiskChange = (assessment: RiskAssessment) => {
      if (assessment.level === 'high') {
        void notificationService.show({
          type: 'warning',
          message: 'Safety risk level has increased in your area',
          duration: 0,
        });
      }
    };

    void safetyMonitoring.startMonitoring(user.id, location, {
      onRiskChange: handleRiskChange,
    });

    return () => {
      safetyMonitoring.stopMonitoring(user.id, location);
    };
  }, [user, location]);
} 