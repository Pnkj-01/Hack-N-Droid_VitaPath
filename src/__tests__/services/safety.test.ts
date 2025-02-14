import { calculateSafetyScore } from '../../services/safety';
import { GeoPoint } from '../../types';

describe('safety service', () => {
  const mockLocation: GeoPoint = {
    latitude: 0,
    longitude: 0,
  };

  it('calculates safety score', async () => {
    const score = await calculateSafetyScore(mockLocation);

    expect(score).toEqual({
      overall: expect.any(Number),
      factors: {
        lighting: expect.any(Number),
        crowdDensity: expect.any(Number),
        historicalData: expect.any(Number),
      },
      timestamp: expect.any(String),
    });

    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(1);
  });
}); 