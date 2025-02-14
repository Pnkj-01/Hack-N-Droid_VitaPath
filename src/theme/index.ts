import { Platform } from 'react-native';

export const theme = {
  colors: {
    // Brand Colors
    primary: '#007AFF',
    secondary: '#5856D6',
    
    // Status Colors
    success: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30',
    info: '#5856D6',
    
    // Background Colors
    background: {
      primary: '#000000',
      secondary: '#1C1C1E',
      tertiary: '#2C2C2E',
    },
    
    // Surface Colors
    surface: {
      default: 'rgba(255,255,255,0.08)',
      elevated: 'rgba(255,255,255,0.12)',
      overlay: 'rgba(0,0,0,0.5)',
    },
    
    // Text Colors
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255,255,255,0.7)',
      tertiary: 'rgba(255,255,255,0.5)',
      inverse: '#000000',
    },
    
    // Border Colors
    border: 'rgba(255,255,255,0.1)',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  typography: {
    heading: {
      h1: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
      h2: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
      h3: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
    },
    body: {
      large: { fontSize: 16, lineHeight: 24 },
      medium: { fontSize: 14, lineHeight: 20 },
      small: { fontSize: 12, lineHeight: 16 },
    },
  },
  
  shadows: Platform.select({
    ios: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
    },
    android: {
      sm: { elevation: 4 },
      md: { elevation: 8 },
      lg: { elevation: 12 },
    },
  }),
}; 