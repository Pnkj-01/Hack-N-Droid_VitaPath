import React, { createContext, useContext, useState, useCallback } from 'react';
import { Region } from '@react-native-maps/maps';
import { mapConfig } from '../services/mapConfig';
import { GeoPoint } from '../types';

interface MapContextType {
  currentRegion: Region;
  setCurrentRegion: (region: Region) => void;
  selectedLocation: GeoPoint | null;
  setSelectedLocation: (location: GeoPoint | null) => void;
  isMapReady: boolean;
  setMapReady: (ready: boolean) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [currentRegion, setCurrentRegion] = useState<Region>(mapConfig.defaultRegion);
  const [selectedLocation, setSelectedLocation] = useState<GeoPoint | null>(null);
  const [isMapReady, setMapReady] = useState(false);

  return (
    <MapContext.Provider
      value={{
        currentRegion,
        setCurrentRegion,
        selectedLocation,
        setSelectedLocation,
        isMapReady,
        setMapReady
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
} 