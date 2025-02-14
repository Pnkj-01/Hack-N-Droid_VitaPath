import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, ProgressBar } from 'react-native-paper';
import { useSafetyContext } from '../context/SafetyContext';
import { useNavigationContext } from '../context/NavigationContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SafetyScore } from '../types';

function SafetyScoreCard({ score }: { score: SafetyScore }) {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge">Safety Score</Text>
        <Text variant="displaySmall">{Math.round(score.overall * 100)}%</Text>
        <View style={styles.factors}>
          <Text>Lighting</Text>
          <ProgressBar progress={score.factors.lighting} />
          <Text>Crowd Density</Text>
          <ProgressBar progress={score.factors.crowdDensity} />
          <Text>Historical Data</Text>
          <ProgressBar progress={score.factors.historicalData} />
        </View>
      </Card.Content>
    </Card>
  );
}

export function SafetyDashboard() {
  const { currentSafetyScore, loading } = useSafetyContext();
  const { currentRoute } = useNavigationContext();

  if (loading) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container}>
      {currentSafetyScore ? (
        <SafetyScoreCard score={currentSafetyScore} />
      ) : (
        <Card style={styles.card}>
          <Card.Content>
            <Text>No safety data available</Text>
          </Card.Content>
        </Card>
      )}

      {currentRoute && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge">Current Route</Text>
            <Text>Safety Score: {Math.round(currentRoute.safetyScore * 100)}%</Text>
            <Text>
              Estimated Time: {Math.round(currentRoute.estimatedDuration / 60)} minutes
            </Text>
            <Text>Distance: {(currentRoute.distance / 1000).toFixed(1)} km</Text>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">Safety Tips</Text>
          <Text>• Stay in well-lit areas</Text>
          <Text>• Keep your phone charged</Text>
          <Text>• Share your location with trusted contacts</Text>
          <Text>• Be aware of your surroundings</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  factors: {
    marginTop: 16,
    gap: 8,
  },
}); 