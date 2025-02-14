import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SafetyDashboard } from '../../screens/SafetyDashboard';
import { SafetyProvider } from '../../context/SafetyContext';
import { NavigationProvider } from '../../context/NavigationContext';

describe('SafetyDashboard', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SafetyProvider>
      <NavigationProvider>{children}</NavigationProvider>
    </SafetyProvider>
  );

  it('renders loading state', () => {
    render(<SafetyDashboard />, { wrapper });
    expect(screen.getByTestId('loading-spinner')).toBeTruthy();
  });

  it('renders safety tips', () => {
    render(<SafetyDashboard />, { wrapper });
    expect(screen.getByText('Safety Tips')).toBeTruthy();
    expect(screen.getByText('• Stay in well-lit areas')).toBeTruthy();
    expect(screen.getByText('• Keep your phone charged')).toBeTruthy();
  });

  it('renders no safety data message when score is null', () => {
    render(<SafetyDashboard />, { wrapper });
    expect(screen.getByText('No safety data available')).toBeTruthy();
  });
}); 