import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Button, FAB } from 'react-native-paper';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigationContext } from '../context/NavigationContext';
import { useSafetyContext } from '../context/SafetyContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { GeoPoint } from '../types';

export function NavigationMap() {
  const [loading, setLoading] = React.useState(false);
  const [currentLocation, setCurrentLocation] = React.useState<GeoPoint | null>(null);
  const { currentRoute, startNavigation, stopNavigation, isTracking } = useNavigationContext();
  const { updateSafetyScore } = useSafetyContext();

  React.useEffect(() => {
    const setupLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const point = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setCurrentLocation(point);
      updateSafetyScore(point);
    };

    setupLocation();
  }, []);

  const handleStartNavigation = async (destination: GeoPoint) => {
    try {
      setLoading(true);
      if (!currentLocation) throw new Error('Current location not available');
      await startNavigation(currentLocation, destination);
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !currentLocation) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          ...currentLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="You are here"
          />
        )}

        {currentRoute && (
          <>
            <Marker
              coordinate={currentRoute.endPoint}
              title="Destination"
              pinColor="green"
            />
            <Polyline
              coordinates={currentRoute.waypoints}
              strokeColor="#000"
              strokeWidth={3}
            />
          </>
        )}
      </MapView>

      {isTracking ? (
        <FAB
          icon="stop"
          style={styles.fab}
          onPress={stopNavigation}
          label="Stop Navigation"
        />
      ) : (
        <FAB
          icon="navigation"
          style={styles.fab}
          onPress={() => {
            // For demo, navigate to a fixed destination
            handleStartNavigation({
              latitude: currentLocation.latitude + 0.01,
              longitude: currentLocation.longitude + 0.01,
            });
          }}
          label="Start Navigation"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 