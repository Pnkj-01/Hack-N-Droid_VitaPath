import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAnimation } from '../../hooks/useAnimation';
import { useHaptics } from '../../hooks/useHaptics';
import { theme } from '../../theme';

const ACTIONS = [
  {
    id: 'sos',
    icon: 'alert-circle',
    label: 'Emergency',
    color: '#FF3B30',
    priority: 1,
  },
  {
    id: 'route',
    icon: 'navigate',
    label: 'Find Route',
    color: '#007AFF',
    priority: 2,
  },
  {
    id: 'share',
    icon: 'location',
    label: 'Share Location',
    color: '#34C759',
    priority: 3,
  },
];

export default function QuickActions() {
  const { scale, pulse } = useAnimation();
  const { medium, heavy } = useHaptics();

  const handlePress = (action: typeof ACTIONS[0]) => {
    if (action.priority === 1) {
      heavy();
    } else {
      medium();
    }
    pulse(() => {
      // Handle action
      if (action.id === 'sos') {
        // Show emergency confirmation
      }
    });
  };

  return (
    <View style={styles.container}>
      {ACTIONS.map((action) => (
        <Animated.View 
          key={action.id}
          style={[
            action.priority === 1 && {
              transform: [{ scale: scale }]
            }
          ]}
        >
          <TouchableOpacity
            style={[
              styles.action,
              action.priority === 1 && styles.primaryAction
            ]}
            onPress={() => handlePress(action)}
            activeOpacity={0.7}
            onPressIn={() => {
              Animated.spring(scale, {
                toValue: 0.95,
                useNativeDriver: true,
              }).start();
            }}
            onPressOut={() => {
              Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
              }).start();
            }}
          >
            <View style={[
              styles.iconContainer, 
              { backgroundColor: action.color },
              action.priority === 1 && styles.primaryIcon
            ]}>
              <Ionicons 
                name={action.icon} 
                size={action.priority === 1 ? 32 : 24} 
                color="#fff" 
              />
            </View>
            <Text style={[
              styles.label,
              action.priority === 1 && styles.primaryLabel
            ]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  action: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  primaryAction: {
    transform: [{ scale: 1.1 }],
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  primaryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  primaryLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
}); 