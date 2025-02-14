import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useLocation } from '../../hooks/useLocation';
import { campusMapService } from '../../services/campusMapService';

export default function LocationBar() {
  const { location } = useLocation();
  const [locationContext, setLocationContext] = React.useState<any>(null);
  const translateY = React.useRef(new Animated.Value(-50)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        damping: 15,
        stiffness: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  React.useEffect(() => {
    if (location) {
      loadLocationContext();
    }
  }, [location]);

  const loadLocationContext = async () => {
    if (location) {
      const context = await campusMapService.getLocationContext(location);
      setLocationContext(context);
    }
  };

  return (
    <Animated.View style={{ transform: [{ translateY }], opacity }}>
      <TouchableOpacity activeOpacity={0.8}>
        <BlurView intensity={40} style={styles.container}>
          <View style={styles.content}>
            <Ionicons name="location" size={20} color="#4CAF50" />
            <View style={styles.textContainer}>
              <Text style={styles.buildingText}>
                {locationContext?.building || 'Loading...'}
              </Text>
              <Text style={styles.zoneText}>
                {locationContext?.zone || 'Fetching location...'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  buildingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  zoneText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  shareButton: {
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.1)',
  }
}); 