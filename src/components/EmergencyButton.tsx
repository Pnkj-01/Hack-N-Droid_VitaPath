import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Portal, Dialog, Text } from 'react-native-paper';
import * as Location from 'expo-location';
import { useEmergencyContext } from '../context/EmergencyContext';
import { useAuthContext } from '../context/AuthContext';
import { EmergencyAlert } from '../types';

interface EmergencyType {
  id: EmergencyAlert['type'];
  label: string;
  icon: string;
}

export function EmergencyButton() {
  const [confirmVisible, setConfirmVisible] = React.useState(false);
  const [activating, setActivating] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState<EmergencyAlert['type']>('danger');
  const { activateEmergency, isEmergencyActive, deactivateEmergency } = useEmergencyContext();
  const { user } = useAuthContext();

  const emergencyTypes: EmergencyType[] = [
    { id: 'danger', label: 'पुलिस / Police', icon: 'police-badge' },
    { id: 'medical', label: 'चिकित्सा / Medical', icon: 'ambulance' },
    { id: 'fire', label: 'आग / Fire', icon: 'fire' },
    { id: 'other', label: 'महिला हेल्पलाइन / Women Helpline', icon: 'human-female' },
  ];

  const handleEmergency = async (type: EmergencyAlert['type'] = selectedType) => {
    try {
      setActivating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission required for emergency services');
      }

      const location = await Location.getCurrentPositionAsync({});
      await activateEmergency(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        type
      );
    } catch (error) {
      console.error('Emergency activation failed:', error);
    } finally {
      setActivating(false);
      setConfirmVisible(false);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <Button
          mode="contained"
          onPress={() => isEmergencyActive ? deactivateEmergency() : setConfirmVisible(true)}
          loading={activating}
          style={[
            styles.button,
            isEmergencyActive ? styles.activeButton : styles.inactiveButton,
          ]}
          labelStyle={styles.buttonLabel}
        >
          {isEmergencyActive ? 'आपातकाल रद्द करें / Cancel Emergency' : 'आपातकाल / Emergency'}
        </Button>
      </View>

      <Portal>
        <Dialog visible={confirmVisible} onDismiss={() => setConfirmVisible(false)}>
          <Dialog.Title>आपातकालीन चेतावनी की पुष्टि करें / Confirm Emergency Alert</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              यह आपके आपातकालीन संपर्कों और अधिकारियों को आपकी स्थिति के बारे में सूचित करेगा।
            </Text>
            <Text style={styles.dialogText}>
              This will alert your emergency contacts and authorities about your situation.
            </Text>
            <View style={styles.emergencyTypes}>
              {emergencyTypes.map(type => (
                <Button
                  key={type.id}
                  mode="outlined"
                  icon={type.icon}
                  onPress={() => handleEmergency(type.id)}
                  style={styles.typeButton}
                >
                  {type.label}
                </Button>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmVisible(false)}>रद्द करें / Cancel</Button>
            <Button onPress={handleEmergency} loading={activating}>
              पुष्टि करें / Confirm
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  button: {
    height: 60,
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  inactiveButton: {
    backgroundColor: '#ff4444',
  },
  activeButton: {
    backgroundColor: '#666666',
  },
  dialogText: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emergencyTypes: {
    marginTop: 16,
    gap: 8,
  },
  typeButton: {
    marginVertical: 4,
  },
}); 