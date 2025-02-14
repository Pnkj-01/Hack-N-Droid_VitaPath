import { Platform } from 'react-native';
import { ENV } from '../config/env';

export const mapConfig = {
  googleMapsApiKey: ENV.GOOGLE_MAPS_API_KEY,
  defaultRegion: {
    latitude: 28.6139,  // Delhi
    longitude: 77.2090,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  mapStyle: Platform.select({
    ios: [
      {
        featureType: 'all',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#000000' }]
      }
      // Add more custom styles as needed
    ],
    android: [
      {
        featureType: 'all',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#000000' }]
      }
      // Add more custom styles as needed
    ]
  }),
  clusterConfig: {
    radius: 50,
    maxZoom: 15,
    minZoom: 1,
    nodeSize: 64
  }
}; 