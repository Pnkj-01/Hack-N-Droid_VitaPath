import React, { createContext, useContext, useState, useEffect } from 'react';
import type { GeoPoint, SafetyScore, RiskAssessment } from '../types';
import { useLocation } from '../hooks/useLocation';
import { useAuth } from './AuthContext';
import { safetyService } from '../services/safety';
import { notificationService } from '../services/notifications';
import { useSafetyMonitoring } from '../hooks/useSafetyMonitoring';

interface SafetyContextType {
  safetyScore: SafetyScore | null;
  riskAssessment: RiskAssessment | null;
  loading: boolean;
  error: string | null;
  updateSafetyStatus: (location: GeoPoint) => Promise<void>;
}

const SafetyContext = createContext<SafetyContextType | undefined>(undefined);

export function SafetyProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [safetyScore, setSafetyScore] = useState<SafetyScore | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { location } = useLocation();
  const { user } = useAuth();

  // Use the safety monitoring hook
  useSafetyMonitoring();

  const updateSafetyStatus = async (location: GeoPoint): Promise<void> => {
    if (!location) return;
    
    setLoading(true);
    setError(null);

    try {
      const [score, risk] = await Promise.all([
        safetyService.calculateSafetyScore(location),
        safetyService.getRiskAssessment(location),
      ]);

      setSafetyScore(score);
      setRiskAssessment(risk);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Safety update failed';
      setError(message);
      await notificationService.show({
        type: 'error',
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location) {
      void updateSafetyStatus(location);
    }
  }, [location]);

  return (
    <SafetyContext.Provider
      value={{
        safetyScore,
        riskAssessment,
        loading,
        error,
        updateSafetyStatus,
      }}
    >
      {children}
    </SafetyContext.Provider>
  );
}

export function useSafety(): SafetyContextType {
  const context = useContext(SafetyContext);
  if (!context) {
    throw new Error('useSafety must be used within SafetyProvider');
  }
  return context;
}