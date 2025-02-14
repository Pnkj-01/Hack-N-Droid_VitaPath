/// <reference types="jest" />
import '@testing-library/jest-native/extend-expect';

const mockFn = jest.fn;

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: mockFn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: mockFn().mockResolvedValue({
    coords: {
      latitude: 0,
      longitude: 0,
    },
  }),
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const mockComponent = mockFn().mockImplementation(() => null);
  return {
    __esModule: true,
    default: mockComponent,
    Marker: mockComponent,
    Polyline: mockComponent,
    PROVIDER_GOOGLE: 'google',
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: mockFn(),
  getItem: mockFn(),
  removeItem: mockFn(),
})); 