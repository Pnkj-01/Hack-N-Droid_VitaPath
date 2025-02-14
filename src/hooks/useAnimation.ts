import { useRef, useCallback } from 'react';
import { Animated, Easing } from 'react-native';

export function useAnimation() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const pulse = useCallback((callback?: () => void) => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.1,
        duration: 150,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 150,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
    ]).start(callback);
  }, [scale]);

  const fadeIn = useCallback((duration = 300) => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  const fadeOut = useCallback((duration = 300) => {
    Animated.timing(opacity, {
      toValue: 0,
      duration,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  const slideIn = useCallback((duration = 300) => {
    Animated.spring(translateY, {
      toValue: 0,
      damping: 20,
      stiffness: 90,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  const slideOut = useCallback((duration = 300) => {
    Animated.spring(translateY, {
      toValue: 100,
      damping: 20,
      stiffness: 90,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  return {
    scale,
    opacity,
    translateY,
    pulse,
    fadeIn,
    fadeOut,
    slideIn,
    slideOut,
  };
} 