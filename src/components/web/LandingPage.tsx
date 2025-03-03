import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

export default function LandingPage() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>SafeCity</Text>
        <Text style={styles.subtitle}>Making Cities Safer Together</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Download App</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.features}>
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Emergency Response</Text>
          <Text style={styles.featureText}>Quick access to emergency services and safe havens</Text>
        </View>
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Community Safety</Text>
          <Text style={styles.featureText}>Real-time safety alerts and community reporting</Text>
        </View>
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Safe Navigation</Text>
          <Text style={styles.featureText}>Navigate through safer routes with real-time updates</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  hero: {
    height: 500,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a73e8',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 40,
    flexWrap: 'wrap',
  },
  featureCard: {
    width: 300,
    padding: 24,
    margin: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1a73e8',
  },
  featureText: {
    fontSize: 16,
    color: '#5f6368',
    lineHeight: 24,
  },
});