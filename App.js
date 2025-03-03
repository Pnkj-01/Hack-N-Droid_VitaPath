import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LandingPage from './src/components/web/LandingPage';

export default function App() {
  return (
    <SafeAreaProvider>
      <LandingPage />
    </SafeAreaProvider>
  );
}