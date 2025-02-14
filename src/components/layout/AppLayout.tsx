import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../hooks/useTheme';
import Header from './Header';
import BottomNav from './BottomNav';
import EmergencyButton from '../emergency/EmergencyButton';
import LocationBar from '../location/LocationBar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <Header />
      <LocationBar />
      <View style={styles.content}>
        {children}
      </View>
      <EmergencyButton />
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  }
}); 