import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { EmergencyProvider, useEmergencyContext } from '../../context/EmergencyContext';
import { supabase } from '../../services/supabase';
import { notifyEmergencyContacts, contactAuthorities } from '../../services/emergency';
import { AuthProvider } from '../../context/AuthContext';

// Mock services
jest.mock('../../services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: {
              id: '123',
              user_id: 'user123',
              latitude: 0,
              longitude: 0,
              status: 'active',
              contacted_authorities: false,
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })),
    })),
  },
}));

jest.mock('../../services/emergency', () => ({
  notifyEmergencyContacts: jest.fn().mockResolvedValue(undefined),
  contactAuthorities: jest.fn().mockResolvedValue(undefined),
}));

describe('EmergencyContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>
      <EmergencyProvider>{children}</EmergencyProvider>
    </AuthProvider>
  );

  const mockLocation = {
    latitude: 0,
    longitude: 0,
  };

  it('provides initial emergency state', () => {
    const { result } = renderHook(() => useEmergencyContext(), { wrapper });

    expect(result.current.activeAlert).toBeNull();
    expect(result.current.isEmergencyActive).toBe(false);
    expect(typeof result.current.activateEmergency).toBe('function');
    expect(typeof result.current.deactivateEmergency).toBe('function');
  });

  it('activates emergency', async () => {
    const { result } = renderHook(() => useEmergencyContext(), { wrapper });

    await act(async () => {
      await result.current.activateEmergency(mockLocation);
    });

    expect(supabase.from).toHaveBeenCalledWith('emergency_alerts');
    expect(contactAuthorities).toHaveBeenCalledWith(mockLocation);
    expect(result.current.isEmergencyActive).toBe(true);
  });

  it('deactivates emergency', async () => {
    const { result } = renderHook(() => useEmergencyContext(), { wrapper });

    await act(async () => {
      await result.current.activateEmergency(mockLocation);
      await result.current.deactivateEmergency();
    });

    expect(result.current.isEmergencyActive).toBe(false);
    expect(result.current.activeAlert).toBeNull();
  });
}); 