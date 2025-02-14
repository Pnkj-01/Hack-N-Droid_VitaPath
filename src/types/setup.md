// Define common types for the SafeCity app
export interface Location {
    latitude: number;
    longitude: number;
}

export interface User {
    id: string;
    email: string;
    name?: string;
}

export interface SafetyAlert {
    id: string;
    userId: string;
    location: Location;
    timestamp: Date;
    type: 'emergency' | 'warning' | 'info';
}