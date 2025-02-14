import { useEffect } from 'react';
import { notificationService } from './services/notificationService';
import { realtimeService } from './services/realtimeService';

export default function App() {
  useEffect(() => {
    setupServices();
  }, []);

  const setupServices = async () => {
    try {
      await notificationService.setup();
      realtimeService.setupIncidentChannel();
    } catch (error) {
      console.error('Error setting up services:', error);
    }
  };

  // Rest of your App component
} 