import { ExpoConfig, ConfigContext } from '@expo/config';
import Constants from 'expo-constants';

// Read from .env file manually
import * as dotenv from 'dotenv';
dotenv.config();

// Load environment variables
const env = {
  SUPABASE_URL: Constants.expoConfig?.extra?.supabaseUrl || '',
  SUPABASE_ANON_KEY: Constants.expoConfig?.extra?.supabaseAnonKey || '',
  GOOGLE_MAPS_API_KEY: Constants.expoConfig?.extra?.googleMapsApiKey || '',
  EAS_PROJECT_ID: Constants.expoConfig?.extra?.eas?.projectId || 'your-project-id',
};

// Validate required environment variables
const validateEnv = () => {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'GOOGLE_MAPS_API_KEY'];
  const missing = required.filter(key => !env[key as keyof typeof env]);
  
  if (missing.length > 0) {
    console.warn(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

validateEnv();

const config = (_ctx: ConfigContext): ExpoConfig => ({
  name: 'SafeCity',
  slug: 'safecity',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  updates: {
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/your-project-id'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.safecity.app',
    buildNumber: '1.0.0',
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'This app needs access to location to provide safety features.',
      NSLocationAlwaysUsageDescription: 'This app needs access to location for emergency tracking.',
      NSCameraUsageDescription: 'This app needs access to camera for incident reporting.',
      NSPhotoLibraryUsageDescription: 'This app needs access to photos for incident reporting.',
      UIBackgroundModes: [
        'location',
        'fetch',
        'remote-notification'
      ]
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF'
    },
    package: 'com.safecity.app',
    versionCode: 1,
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'VIBRATE',
      'RECEIVE_BOOT_COMPLETED',
      'SCHEDULE_EXACT_ALARM'
    ],
    config: {
      googleMaps: {
        apiKey: env.GOOGLE_MAPS_API_KEY
      }
    }
  },
  plugins: [
    'expo-location',
    'expo-camera',
    'expo-media-library',
    'expo-notifications',
    'expo-haptics',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: 'Allow SafeCity to use your location.'
      }
    ],
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#ffffff',
        sounds: ['./assets/notification-sound.wav']
      }
    ]
  ],
  extra: {
    supabaseUrl: env.SUPABASE_URL,
    supabaseAnonKey: env.SUPABASE_ANON_KEY,
    eas: {
      projectId: env.EAS_PROJECT_ID
    }
  },
  owner: 'your-expo-account',
  runtimeVersion: {
    policy: 'sdkVersion'
  }
});

export default config;