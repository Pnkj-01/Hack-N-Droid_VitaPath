import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Header } from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import LandingPage from '../components/web/LandingPage';
import { SafetyDashboard } from '../screens/SafetyDashboard';
import { GroupScreen } from '../screens/GroupScreen';
import { EmergencyScreen } from '../screens/EmergencyScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (Platform.OS === 'web' && !user) {
    return <LandingPage />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          header: (props) => <Header {...props} />
        }}
      >
        <Stack.Screen name="Safety" component={SafetyDashboard} />
        <Stack.Screen name="Groups" component={GroupScreen} />
        <Stack.Screen name="Emergency" component={EmergencyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}