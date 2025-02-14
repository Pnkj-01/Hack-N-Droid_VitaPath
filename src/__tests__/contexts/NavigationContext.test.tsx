import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { NavigationProvider, useNavigationContext } from '../../context/NavigationContext';
import { SafetyProvider } from '../../context/SafetyContext';
import { calculateRoute, startTracking, stopTracking } from '../../services/navigation';

// Mock navigation services
jest.mock('../../services/navigation', () => ({
  calculateRoute: jest.fn().mockResolvedValue({
    id: 'route123',
    startPoint: { latitude: 0, longitude: 0 },
    endPoint: { latitude: 1, longitude: 1 },
    waypoints: [
      { latitude: 0, longitude: 0 },
      { latitude: 0.5, longitude: 0.5 },
      { latitude: 1, longitude: 1 },
    ],
    distance: 1000,
    estimatedDuration: 600,
    safetyScore: 0.8,
  }),
  startTracking: jest.fn().mockResolvedValue(undefined),
  stopTracking: jest.fn().mockResolvedValue(undefined),
  calculateProgressAlongRoute: jest.fn().mockReturnValue(0.5),
}));

describe('NavigationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SafetyProvider>
      <NavigationProvider>{children}</NavigationProvider>
    </SafetyProvider>
  );

  const mockStart = { latitude: 0, longitude: 0 };
  const mockEnd = { latitude: 1, longitude: 1 };

  it('provides initial navigation state', () => {
    const { result } = renderHook(() => useNavigationContext(), { wrapper });

    expect(result.current.currentRoute).toBeNull();
    expect(result.current.isTracking).toBe(false);
    expect(result.current.routeProgress).toBe(0);
    expect(typeof result.current.startNavigation).toBe('function');
    expect(typeof result.current.stopNavigation).toBe('function');
    expect(typeof result.current.updateProgress).toBe('function');
  });

  it('starts navigation', async () => {
    const { result } = renderHook(() => useNavigationContext(), { wrapper });

    await act(async () => {
      await result.current.startNavigation(mockStart, mockEnd);
    });

    expect(calculateRoute).toHaveBeenCalledWith(mockStart, mockEnd);
    expect(startTracking).toHaveBeenCalled();
    expect(result.current.isTracking).toBe(true);
    expect(result.current.currentRoute).toEqual({
      id: 'route123',
      startPoint: mockStart,
      endPoint: mockEnd,
      waypoints: expect.any(Array),
      distance: 1000,
      estimatedDuration: 600,
      safetyScore: 0.8,
    });
  });

  it('stops navigation', async () => {
    const { result } = renderHook(() => useNavigationContext(), { wrapper });

    await act(async () => {
      await result.current.startNavigation(mockStart, mockEnd);
      await result.current.stopNavigation();
    });

    expect(stopTracking).toHaveBeenCalled();
    expect(result.current.isTracking).toBe(false);
    expect(result.current.currentRoute).toBeNull();
    expect(result.current.routeProgress).toBe(0);
  });

  it('updates progress', async () => {
    const { result } = renderHook(() => useNavigationContext(), { wrapper });

    await act(async () => {
      await result.current.startNavigation(mockStart, mockEnd);
      result.current.updateProgress({ latitude: 0.5, longitude: 0.5 });
    });

    expect(result.current.routeProgress).toBe(0.5);
  });
}); 