import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useEmergencyContext } from '../context/EmergencyContext';
import { useAuthContext } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import * as Location from 'expo-location';

export function EmergencyScreen() {
  const { activateEmergency, deactivateEmergency, activeAlert, isEmergencyActive } = useEmergencyContext();
  const { user } = useAuthContext();
  const [loading, setLoading] = React.useState(false);

  const handleEmergency = async () => {
    try {
      setLoading(true);
      if (isEmergencyActive) {
        await deactivateEmergency();
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Location permission denied');
        }

        const location = await Location.getCurrentPositionAsync({});
        await activateEmergency({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Emergency error:', error);
      // Add error handling
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        onPress={handleEmergency}
        style={[
          styles.emergencyButton,
          isEmergencyActive && styles.emergencyActiveButton,
        ]}
        labelStyle={styles.emergencyButtonLabel}
      >
        {isEmergencyActive ? 'Cancel Emergency' : 'Activate Emergency'}
      </Button>

      {activeAlert && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge">Emergency Active</Text>
            <Text>Authorities have been notified</Text>
            <Text>Emergency contacts have been alerted</Text>
            <Text>Stay calm and find a safe location</Text>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">Emergency Contacts</Text>
          {user?.user_metadata?.emergency_contacts?.map((contact: any) => (
            <Text key={contact.id}>
              {contact.name} - {contact.phone}
            </Text>
          ))}
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  emergencyButton: {
    height: 120,
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#ff4444',
  },
  emergencyActiveButton: {
    backgroundColor: '#666666',
  },
  emergencyButtonLabel: {
    fontSize: 24,
  },
  card: {
    marginBottom: 16,
  },
}); 