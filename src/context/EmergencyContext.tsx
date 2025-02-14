import React, { createContext, useContext, useState, useCallback } from 'react';
import { GeoPoint, EmergencyAlert, EmergencyContact, EmergencyZone, EmergencyTemplate } from '../types';
import { supabase } from '../services/supabase';
import { useAuthContext } from './AuthContext';
import { notifyEmergencyContacts, contactAuthorities, trackEmergency } from '../services/emergency';
import { Alert } from 'react-native';
import { emergencyManager } from '../services/emergencyManager';
import * as Location from 'expo-location';
import { voiceRecognition } from '../services/voiceRecognition';
import { gestureRecognition } from '../services/gestureRecognition';
import { getPreferredLanguage } from '../utils/emergencyMessages';
import { useHaptics } from '../hooks/useHaptics';
import { useLocation } from '../hooks/useLocation';

interface EmergencyContextType {
  isEmergencyMode: boolean;
  activateEmergency: () => Promise<void>;
  deactivateEmergency: () => Promise<void>;
  sendEmergencyAlert: (details: EmergencyDetails) => Promise<void>;
}

interface EmergencyDetails {
  type: 'medical' | 'security' | 'fire' | 'other';
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

export function EmergencyProvider({ children }: { children: React.ReactNode }) {
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const { notification } = useHaptics();
  const { location } = useLocation();

  const activateEmergency = useCallback(async () => {
    try {
      setIsEmergencyMode(true);
      notification('warning');

      // Start location tracking
      // Notify emergency contacts
      // Alert nearby security
      
      await supabase.from('emergency_alerts').insert([{
        user_id: (await supabase.auth.getUser()).data.user?.id,
        status: 'active',
        location,
        created_at: new Date().toISOString(),
      }]);

    } catch (error) {
      console.error('Failed to activate emergency mode:', error);
      notification('error');
    }
  }, [location]);

  const deactivateEmergency = useCallback(async () => {
    try {
      setIsEmergencyMode(false);
      notification('success');

      // Stop location tracking
      // Update emergency status
      
      await supabase.from('emergency_alerts')
        .update({ status: 'resolved' })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('status', 'active');

    } catch (error) {
      console.error('Failed to deactivate emergency mode:', error);
    }
  }, []);

  const sendEmergencyAlert = useCallback(async (details: EmergencyDetails) => {
    try {
      notification('warning');
      
      await supabase.from('emergency_alerts').insert([{
        ...details,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        status: 'active',
        location: details.location || location,
        created_at: new Date().toISOString(),
      }]);

    } catch (error) {
      console.error('Failed to send emergency alert:', error);
      notification('error');
    }
  }, [location]);

  return (
    <EmergencyContext.Provider
      value={{
        isEmergencyMode,
        activateEmergency,
        deactivateEmergency,
        sendEmergencyAlert,
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
}

export function useEmergency() {
  const context = useContext(EmergencyContext);
  if (context === undefined) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
} 