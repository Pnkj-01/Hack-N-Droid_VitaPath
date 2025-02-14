import React from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Alert,
  Easing 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEmergency } from '../../hooks/useEmergency';
import { useAnimation } from '../../hooks/useAnimation';

export default function EmergencyButton() {
  const { activateEmergencyMode } = useEmergency();
  const { scale, pulse } = useAnimation();
  const rotation = React.useRef(new Animated.Value(0)).current;
  const warningOpacity = React.useRef(new Animated.Value(0)).current;

  const startWarningAnimation = React.useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(warningOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(warningOpacity, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(rotation, {
          toValue: 1,
          duration: 200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: -1,
          duration: 400,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: 0,
          duration: 200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [rotation, warningOpacity]);

  const handlePress = () => {
    pulse(() => {
      Alert.alert(
        'Enable Emergency Mode',
        'This will alert emergency contacts and nearby authorities',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Enable', 
            onPress: () => {
              startWarningAnimation();
              activateEmergencyMode();
            },
            style: 'destructive'
          },
        ]
      );
    });
  };

  const spin = rotation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-5deg', '5deg']
  });

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.warningRing,
          { 
            opacity: warningOpacity,
            transform: [{ scale: Animated.add(1, Animated.multiply(warningOpacity, 0.2)) }]
          }
        ]} 
      />
      <Animated.View style={{ 
        transform: [
          { scale }, 
          { rotate: spin }
        ] 
      }}>
        <TouchableOpacity
          onPress={handlePress}
          style={styles.button}
          activeOpacity={0.8}
        >
          <Ionicons name="warning" size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  warningRing: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
}); 