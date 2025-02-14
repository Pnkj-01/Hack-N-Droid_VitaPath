import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, FAB, Portal, Modal, TextInput, Button, Chip } from 'react-native-paper';
import MapView, { Marker, Circle, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useGroupContext } from '../context/GroupContext';
import { useAuthContext } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { GeoPoint, GroupMember } from '../types';
import { sendGroupAlert } from '../services/notifications';
import { getDistance } from '../utils/distance';

interface MapEvent {
  nativeEvent: {
    coordinate: GeoPoint;
  };
}

export function GroupMapScreen() {
  const [loading, setLoading] = React.useState(true);
  const [memberLocations, setMemberLocations] = React.useState<Record<string, GeoPoint>>({});
  const [locationSharingModal, setLocationSharingModal] = React.useState(false);
  const [addingZone, setAddingZone] = React.useState(false);
  const [newZoneName, setNewZoneName] = React.useState('');
  const [newZoneRadius, setNewZoneRadius] = React.useState('100');
  const [selectedLocation, setSelectedLocation] = React.useState<GeoPoint | null>(null);
  const { 
    activeGroup, 
    getMemberLocations, 
    updateLocation, 
    toggleLocationSharing,
    safeZones,
    addSafeZone,
    removeSafeZone,
    checkSafeZones,
  } = useGroupContext();
  const { user } = useAuthContext();

  // Initial setup
  React.useEffect(() => {
    setupLocation();
    const interval = setInterval(updateMemberLocations, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const setupLocation = async () => {
    try {
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

      if (activeGroup) {
        await updateLocation(point);
        await updateMemberLocations();
      }
    } catch (error) {
      console.error('Error setting up location:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMemberLocations = async () => {
    if (!activeGroup) return;
    const locations = await getMemberLocations(activeGroup.id);
    setMemberLocations(locations);
  };

  const userLocation = React.useMemo(() => {
    if (!user?.id || !memberLocations[user.id]) {
      return {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }

    return {
      latitude: memberLocations[user.id].latitude,
      longitude: memberLocations[user.id].longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }, [user?.id, memberLocations]);

  if (loading || !activeGroup) return <LoadingSpinner />;

  const member = activeGroup.members.find(m => m.user_id === user?.id) as GroupMember | undefined;
  const isLocationSharingEnabled = member?.location_sharing;
  const isAdmin = member?.role === 'admin';

  // Check if user enters/exits safe zones
  React.useEffect(() => {
    if (!userLocation || !activeGroup || !user) return;

    const checkZones = async () => {
      const inZones = await checkSafeZones(userLocation);
      inZones.forEach(zone => {
        sendGroupAlert(
          activeGroup.id,
          'Safe Zone Update',
          `${member?.nickname || 'A member'} entered ${zone.name}`
        );
      });
    };

    checkZones();
  }, [userLocation, activeGroup?.id, user?.id]);

  const handleMapLongPress = (e: MapEvent) => {
    if (!isAdmin) return;
    setSelectedLocation(e.nativeEvent.coordinate);
    setAddingZone(true);
  };

  const handleAddZone = async () => {
    if (!selectedLocation || !newZoneName) return;

    await addSafeZone(
      newZoneName,
      selectedLocation,
      parseInt(newZoneRadius, 10) || 100
    );

    setAddingZone(false);
    setSelectedLocation(null);
    setNewZoneName('');
    setNewZoneRadius('100');
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={userLocation}
        onLongPress={handleMapLongPress}
      >
        {activeGroup.members.map(member => {
          const location = memberLocations[member.user_id];
          if (!location || !member.location_sharing) return null;

          return (
            <Marker
              key={member.user_id}
              coordinate={location}
              title={member.nickname || 'Group Member'}
            >
              <Callout>
                <View style={styles.callout}>
                  <Text variant="titleMedium">{member.nickname || 'Group Member'}</Text>
                  <Text variant="bodySmall">
                    Last updated: {new Date().toLocaleTimeString()}
                  </Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
        
        {/* Safe Zones */}
        {safeZones.map(zone => (
          <React.Fragment key={zone.id}>
            <Circle
              center={zone.location}
              radius={zone.radius}
              fillColor="rgba(0, 150, 255, 0.2)"
              strokeColor="rgba(0, 150, 255, 0.5)"
            />
            <Marker
              coordinate={zone.location}
              pinColor="blue"
            >
              <Callout>
                <View style={styles.callout}>
                  <Text variant="titleMedium">{zone.name}</Text>
                  <Text variant="bodySmall">
                    Radius: {zone.radius}m
                  </Text>
                  {isAdmin && (
                    <Button
                      onPress={() => removeSafeZone(zone.id)}
                      mode="contained-tonal"
                    >
                      Remove Zone
                    </Button>
                  )}
                </View>
              </Callout>
            </Marker>
          </React.Fragment>
        ))}
      </MapView>

      <View style={styles.chipContainer}>
        <Chip 
          icon={isLocationSharingEnabled ? 'eye' : 'eye-off'}
          onPress={() => setLocationSharingModal(true)}
        >
          {isLocationSharingEnabled ? 'Sharing Location' : 'Location Hidden'}
        </Chip>
        <Chip icon="account-group">
          {activeGroup.members.filter(m => m.location_sharing).length} Sharing
        </Chip>
      </View>

      <Portal>
        <Modal
          visible={locationSharingModal}
          onDismiss={() => setLocationSharingModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge">Location Sharing</Text>
          <Text variant="bodyMedium">
            {isLocationSharingEnabled
              ? 'Your location is currently visible to group members.'
              : 'Your location is currently hidden from group members.'}
          </Text>
          <Button
            mode="contained"
            onPress={async () => {
              await toggleLocationSharing(!isLocationSharingEnabled);
              setLocationSharingModal(false);
            }}
          >
            {isLocationSharingEnabled ? 'Stop Sharing' : 'Start Sharing'}
          </Button>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={addingZone}
          onDismiss={() => setAddingZone(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge">Add Safe Zone</Text>
          <TextInput
            label="Zone Name"
            value={newZoneName}
            onChangeText={setNewZoneName}
          />
          <TextInput
            label="Radius (meters)"
            value={newZoneRadius}
            onChangeText={setNewZoneRadius}
            keyboardType="numeric"
          />
          <Button mode="contained" onPress={handleAddZone}>
            Add Zone
          </Button>
        </Modal>
      </Portal>

      {isAdmin && (
        <View style={styles.adminControls}>
          <Text variant="bodySmall">
            Long press on map to add safe zone
          </Text>
        </View>
      )}

      <FAB
        icon="refresh"
        style={styles.fab}
        onPress={updateMemberLocations}
        label="Refresh"
      />
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
  chipContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  callout: {
    padding: 8,
    minWidth: 150,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    gap: 16,
  },
  adminControls: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
}); 