import React from 'react';
import { Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import AppNavigator from './navigation';
import LandingPage from './components/web/LandingPage';

function AppEntry() {
  if (Platform.OS === 'web') {
    return <LandingPage />;
  }
  
  return <AppNavigator />;
}

registerRootComponent(AppEntry);

export default AppEntry;