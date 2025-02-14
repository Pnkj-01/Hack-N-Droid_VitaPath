import React, { createContext, useContext, useState } from 'react';
import type { GeoPoint } from '../types';
import { mapService } from '../services/mapService';

interface NavigationContextType {
  currentLocation: GeoPoint | null;
  destination: GeoPoint | null;
  route: GeoPoint[] | null;
  setDestination: (point: GeoPoint | null) => void;
  findSafeRoute: () => Promise<void>;
  clearRoute: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<GeoPoint | null>(null);
  const [destination, setDestination] = useState<GeoPoint | null>(null);
  const [route, setRoute] = useState<GeoPoint[] | null>(null);

  const findSafeRoute = async () => {
    if (!currentLocation || !destination) return;
    const safeRoute = await mapService.getSafeRoute(currentLocation, destination);
    setRoute(safeRoute);
  };

  return (
    <NavigationContext.Provider
      value={{
        currentLocation,
        destination,
        route,
        setDestination,
        findSafeRoute,
        clearRoute: () => setRoute(null),
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
} 