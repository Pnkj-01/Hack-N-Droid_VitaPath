import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { theme } from '../../theme';

interface LoadingIndicatorProps {
  size?: number;
  color?: string;
  style?: any;
}

export function LoadingIndicator({ 
  size = 24, 
  color = theme.colors.primary,
  style
}: LoadingIndicatorProps) {
  const rotation = React.useRef(new Animated.Value(0)).current;
  const scale = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Rotation animation
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Scale animation
    Animated.spring(scale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [
            { rotate: spin },
            { scale }
          ],
        },
        style
      ]}
    >
      <View
        style={[
          styles.indicator,
          {
            borderColor: color,
            borderWidth: size / 8,
          },
        ]}
      />
      <View
        style={[
          styles.highlightDot,
          {
            width: size / 4,
            height: size / 4,
            backgroundColor: color,
            top: 0,
            left: (size - size / 4) / 2,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: '100%',
    height: '100%',
    borderRadius: theme.radius.full,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  highlightDot: {
    position: 'absolute',
    borderRadius: theme.radius.full,
  },
}); 