import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { NavigationMap } from '../../screens/NavigationMap';
import { NavigationProvider } from '../../context/NavigationContext';
import { SafetyProvider } from '../../context/SafetyContext';
import * as Location from 'expo-location';

jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    Marker: View,
    Polyline: View,
    PROVIDER_GOOGLE: 'google',
  };
});

describe('NavigationMap', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SafetyProvider>
      <NavigationProvider>{children}</NavigationProvider>
    </SafetyProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: {
        latitude: 0,
        longitude: 0,
      },
    });
  });

  it('renders map', async () => {
    const { getByTestId } = render(<NavigationMap />, { wrapper });
    await act(async () => {});
    expect(getByTestId('map-view')).toBeTruthy();
  });

  it('shows navigation controls', async () => {
    const { getByText } = render(<NavigationMap />, { wrapper });
    await act(async () => {});
    expect(getByText('Start Navigation')).toBeTruthy();
  });

  it('handles navigation start/stop', async () => {
    const { getByText, queryByText } = render(<NavigationMap />, { wrapper });
    
    await act(async () => {});
    
    await act(async () => {
      fireEvent.press(getByText('Start Navigation'));
    });
    
    expect(queryByText('Stop Navigation')).toBeTruthy();
    
    await act(async () => {
      fireEvent.press(getByText('Stop Navigation'));
    });
    
    expect(queryByText('Start Navigation')).toBeTruthy();
  });
}); 