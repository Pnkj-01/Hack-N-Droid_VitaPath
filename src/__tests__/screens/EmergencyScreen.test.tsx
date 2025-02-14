import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { EmergencyScreen } from '../../screens/EmergencyScreen';
import { EmergencyProvider } from '../../context/EmergencyContext';
import { AuthProvider } from '../../context/AuthContext';
import * as Location from 'expo-location';

jest.mock('expo-location');

describe('EmergencyScreen', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>
      <EmergencyProvider>{children}</EmergencyProvider>
    </AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders emergency button', () => {
    const { getByText } = render(<EmergencyScreen />, { wrapper });
    expect(getByText('Activate Emergency')).toBeTruthy();
  });

  it('handles emergency activation', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValueOnce({
      coords: {
        latitude: 0,
        longitude: 0,
      },
    });

    const { getByText } = render(<EmergencyScreen />, { wrapper });
    
    await act(async () => {
      fireEvent.press(getByText('Activate Emergency'));
    });

    expect(getByText('Cancel Emergency')).toBeTruthy();
  });

  it('shows emergency contacts', () => {
    const { getByText } = render(<EmergencyScreen />, { wrapper });
    expect(getByText('Emergency Contacts')).toBeTruthy();
  });
}); 