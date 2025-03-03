import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationProvider } from './src/context/NavigationContext';
import { SafetyProvider } from './src/context/SafetyContext';
import { EmergencyProvider } from './src/context/EmergencyContext';
import { AuthProvider } from './src/context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import { GroupProvider } from './src/context/GroupContext';
import RootNavigation from './src/navigation';

// Create a client
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootNavigation />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}