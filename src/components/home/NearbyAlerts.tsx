import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function NearbyAlerts() {
  const [alerts, setAlerts] = React.useState([
    {
      id: '1',
      type: 'info',
      title: 'Construction Work',
      location: 'Near Academic Block 2',
      time: '10:30 AM',
    }
  ]);

  if (alerts.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Nearby Updates</Text>
      {alerts.map(alert => (
        <TouchableOpacity 
          key={alert.id} 
          style={styles.alertCard}
          activeOpacity={0.8}
        >
          <View style={styles.alertIcon}>
            <Ionicons 
              name="information-circle" 
              size={24} 
              color="#007AFF" 
            />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>{alert.title}</Text>
            <Text style={styles.alertDetails}>
              {alert.location} • {alert.time}
            </Text>
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color="rgba(255,255,255,0.5)" 
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginBottom: 8,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,122,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  alertDetails: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
}); 