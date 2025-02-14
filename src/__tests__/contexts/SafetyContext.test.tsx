import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { SafetyProvider, useSafetyContext } from '../../context/SafetyContext';
import { calculateSafetyScore } from '../../services/safety';

// Mock safety service
jest.mock('../../services/safety', () => ({
  calculateSafetyScore: jest.fn().mockResolvedValue({
    overall: 0.8,
    factors: {
      lighting: 0.7,
      crowdDensity: 0.8,
      historicalData: 0.9,
    },
    timestamp: new Date().toISOString(),
  }),
}));

describe('SafetyContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SafetyProvider>{children}</SafetyProvider>
  );

  const mockLocation = {
    latitude: 0,
    longitude: 0,
  };

  it('provides initial safety state', () => {
    const { result } = renderHook(() => useSafetyContext(), { wrapper });

    expect(result.current.currentSafetyScore).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.updateSafetyScore).toBe('function');
    expect(typeof result.current.getSafetyScoreForLocation).toBe('function');
  });

  it('updates safety score', async () => {
    const { result } = renderHook(() => useSafetyContext(), { wrapper });

    await act(async () => {
      await result.current.updateSafetyScore(mockLocation);
    });

    expect(calculateSafetyScore).toHaveBeenCalledWith(mockLocation);
    expect(result.current.currentSafetyScore).toEqual({
      overall: 0.8,
      factors: {
        lighting: 0.7,
        crowdDensity: 0.8,
        historicalData: 0.9,
      },
      timestamp: expect.any(String),
    });
  });

  it('handles loading state during updates', async () => {
    const { result } = renderHook(() => useSafetyContext(), { wrapper });

    let loadingDuringUpdate = false;
    await act(async () => {
      result.current.updateSafetyScore(mockLocation);
      loadingDuringUpdate = result.current.loading;
    });

    expect(loadingDuringUpdate).toBe(true);
    expect(result.current.loading).toBe(false);
  });
}); 