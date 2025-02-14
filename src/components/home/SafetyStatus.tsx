import React from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

export default function SafetyStatus() {
  const [safetyStatus, setSafetyStatus] = React.useState({
    score: 85,
    level: 'Safe',
    message: 'Campus is secure',
    details: [
      { icon: 'shield-checkmark', text: 'Security patrols active' },
      { icon: 'people', text: 'Moderate crowd' },
      { icon: 'sunny', text: 'Good visibility' }
    ]
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Current Status</Text>
          <Text style={styles.level}>{safetyStatus.level}</Text>
        </View>
        <View style={styles.scoreContainer}>
          <AnimatedCircularProgress
            size={60}
            width={6}
            fill={safetyStatus.score}
            tintColor="#34C759"
            backgroundColor="rgba(255,255,255,0.2)"
          >
            {(fill) => (
              <Text style={styles.scoreText}>
                {Math.round(fill)}%
              </Text>
            )}
          </AnimatedCircularProgress>
        </View>
      </View>

      <View style={styles.details}>
        {safetyStatus.details.map((detail, index) => (
          <View key={index} style={styles.detailItem}>
            <Ionicons name={detail.icon} size={18} color="#fff" />
            <Text style={styles.detailText}>{detail.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    backdropFilter: 'blur(20px)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  level: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
  },
  details: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
}); 