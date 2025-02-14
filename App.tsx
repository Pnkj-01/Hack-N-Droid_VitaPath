import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationProvider } from './src/context/NavigationContext';
import { SafetyProvider } from './src/context/SafetyContext';
import { EmergencyProvider } from './src/context/EmergencyContext';
import { AuthProvider } from './src/context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomeScreen } from './src/screens/HomeScreen';
import { PaperProvider } from 'react-native-paper';
import { GroupProvider } from './src/context/GroupContext';
import * as Notifications from 'expo-notifications';

void Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const queryClient = new QueryClient();

export default function App(): JSX.Element {
  useEffect(() => {
    void (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.error('Notification permissions not granted');
      }
    })();
  }, []);

  return (
    <PaperProvider>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AuthProvider>
            <SafetyProvider>
              <EmergencyProvider>
                <GroupProvider>
                  <NavigationProvider>
                    <HomeScreen />
                  </NavigationProvider>
                </GroupProvider>
              </EmergencyProvider>
            </SafetyProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </PaperProvider>
  );
} 