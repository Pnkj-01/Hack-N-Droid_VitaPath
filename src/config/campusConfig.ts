export const CAMPUS_CONFIG = {
  name: 'VIT Chennai',
  location: {
    latitude: 12.8406,  // VIT Chennai coordinates
    longitude: 80.1534,
    latitudeDelta: 0.01, // Zoom level appropriate for campus
    longitudeDelta: 0.01,
  },
  boundaries: {
    // Campus boundaries for geofencing
    north: 12.8456,
    south: 12.8356,
    east: 80.1584,
    west: 80.1484,
  },
  zones: {
    academic: [
      { id: 'ab1', name: 'Academic Block 1', type: 'academic' },
      { id: 'ab2', name: 'Academic Block 2', type: 'academic' },
      { id: 'ab3', name: 'Academic Block 3', type: 'academic' },
    ],
    hostels: [
      { id: 'mh', name: "Men's Hostel", type: 'residential' },
      { id: 'lh', name: "Ladies Hostel", type: 'residential' },
    ],
    facilities: [
      { id: 'fc', name: 'Food Court', type: 'cafeteria' },
      { id: 'lib', name: 'Central Library', type: 'library' },
      { id: 'gym', name: 'Sports Complex', type: 'sports' },
    ],
    emergencyPoints: [
      { id: 'ep1', name: 'Security Office', type: 'security' },
      { id: 'mc', name: 'Medical Center', type: 'medical' },
    ]
  },
  securityContacts: {
    emergency: '044-3993-1000',
    security: '044-3993-1234',
    medical: '044-3993-1111',
    hostelWarden: {
      mens: '044-3993-2000',
      womens: '044-3993-2001'
    }
  },
  operatingHours: {
    campus: {
      open: 6, // 6 AM
      close: 22, // 10 PM
    },
    library: {
      open: 8, // 8 AM
      close: 20, // 8 PM
    },
    hostelCurfew: {
      mens: { hours: 22, minutes: 30 }, // 10:30 PM
      womens: { hours: 22, minutes: 0 } // 10:00 PM
    }
  }
}; 