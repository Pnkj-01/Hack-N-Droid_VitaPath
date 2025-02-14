import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';

export function useHaptics() {
  const impact = useCallback((style: 'light' | 'medium' | 'heavy' = 'light') => {
    const strength = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    }[style];

    try {
      Haptics.impactAsync(strength);
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }, []);

  const notification = useCallback((type: 'success' | 'warning' | 'error') => {
    const style = {
      success: Haptics.NotificationFeedbackType.Success,
      warning: Haptics.NotificationFeedbackType.Warning,
      error: Haptics.NotificationFeedbackType.Error,
    }[type];

    try {
      Haptics.notificationAsync(style);
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }, []);

  return {
    impact,
    notification,
  };
} 