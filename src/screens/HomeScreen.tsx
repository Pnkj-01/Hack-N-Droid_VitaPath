import React from 'react';
import { 
  View, 
  StyleSheet, 
  Animated, 
  PanResponder,
  StatusBar,
  Dimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAnimation } from '../hooks/useAnimation';
import { useTheme } from '../hooks/useTheme';
import QuickActions from '../components/home/QuickActions';
import SafetyStatus from '../components/home/SafetyStatus';
import NearbyAlerts from '../components/home/NearbyAlerts';
import { CAMPUS_CONFIG } from '../config/campusConfig';

const { height } = Dimensions.get('window');
const SNAP_POINTS = [0, height * 0.5, height * 0.8];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { translateY } = useAnimation();
  const panY = React.useRef(new Animated.Value(0)).current;

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        panY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentPosition = gestureState.dy;
        const nearestPoint = SNAP_POINTS.reduce((prev, curr) => 
          Math.abs(curr - currentPosition) < Math.abs(prev - currentPosition) ? curr : prev
        );

        Animated.spring(panY, {
          toValue: nearestPoint,
          damping: 20,
          stiffness: 90,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Campus Map Background */}
      <View style={styles.mapContainer}>
        {/* Map component will go here */}
      </View>

      {/* Main Content */}
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            transform: [{ translateY: panY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <BlurView intensity={80} style={styles.content}>
          {/* Pull Indicator */}
          <View style={styles.pullIndicator} />

          {/* Quick Actions */}
          <QuickActions />

          {/* Safety Status */}
          <SafetyStatus />

          {/* Nearby Alerts */}
          <NearbyAlerts />
        </BlurView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a1a', // Placeholder for map
  },
  contentContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: height * 0.9,
  },
  content: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  pullIndicator: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
}); 