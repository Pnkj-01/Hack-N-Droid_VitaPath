import { GeoPoint, User } from '../types';
import { supabase } from './supabase';
import { campusSafety } from './campusSafety';

interface CampusLocation {
  id: string;
  name: string;
  type: CampusLocationType;
  building: string;
  floor: number;
  room?: string;
  location: GeoPoint;
  description?: string;
  images?: string[];
  operating_hours: {
    weekday: { open: number; close: number };
    weekend?: { open: number; close: number };
  };
  tags: string[];
  shortcuts?: ShortcutInfo[];
}

type CampusLocationType = 
  | 'classroom'
  | 'lab'
  | 'library'
  | 'cafeteria'
  | 'admin_office'
  | 'department'
  | 'washroom'
  | 'atm'
  | 'parking'
  | 'sports'
  | 'printshop'
  | 'medical'
  | 'stationery';

interface ShortcutInfo {
  description: string;
  from: string;
  to: string;
  landmarks: string[];
  time_saved: number; // minutes
  verified_count: number;
  safety_rating: number;
}

interface ClassSchedule {
  id: string;
  course_code: string;
  course_name: string;
  professor: string;
  location: CampusLocation;
  time: {
    day: number; // 0-6 for Sunday-Saturday
    start: number; // 24-hour format
    end: number;
  };
  building_entry?: string; // Specific entry point
  notes?: string;
}

interface FoodVenue {
  id: string;
  name: string;
  type: 'cafe' | 'canteen' | 'restaurant' | 'food_court' | 'vending';
  location: CampusLocation;
  cuisine_types: string[];
  price_range: 1 | 2 | 3; // 1 = budget, 3 = expensive
  menu_highlights: string[];
  peak_hours: {
    start: number;
    end: number;
  }[];
  ratings: {
    food: number;
    value: number;
    service: number;
  };
  current_status: {
    is_open: boolean;
    wait_time?: number;
    special_today?: string;
  };
}

class CampusNavigationService {
  private static instance: CampusNavigationService;
  private searchCache: Map<string, CampusLocation[]> = new Map();

  static getInstance(): CampusNavigationService {
    if (!this.instance) {
      this.instance = new CampusNavigationService();
    }
    return this.instance;
  }

  async searchLocation(
    query: string,
    userLocation?: GeoPoint
  ): Promise<CampusLocation[]> {
    // Search by name, room number, or common nicknames
    const { data: locations } = await supabase
      .from('campus_locations')
      .select('*')
      .or(`
        name.ilike.%${query}%, 
        room.ilike.%${query}%,
        tags.cs.{${query}}
      `)
      .limit(10);

    if (userLocation) {
      return this.sortByDistance(locations, userLocation);
    }
    return locations || [];
  }

  async getNearbyLocations(
    location: GeoPoint,
    types?: CampusLocationType[],
    radius: number = 200
  ): Promise<CampusLocation[]> {
    const { data: locations } = await supabase
      .from('campus_locations')
      .select('*')
      .near('location', [location.latitude, location.longitude], radius);

    if (types) {
      return locations?.filter(loc => types.includes(loc.type)) || [];
    }
    return locations || [];
  }

  async getShortcuts(
    from: CampusLocation,
    to: CampusLocation
  ): Promise<ShortcutInfo[]> {
    const { data: shortcuts } = await supabase
      .from('campus_shortcuts')
      .select('*')
      .or(`
        and(from_id.eq.${from.id},to_id.eq.${to.id}),
        and(from_id.eq.${to.id},to_id.eq.${from.id})
      `)
      .order('verified_count', { ascending: false });

    return shortcuts || [];
  }

  async addShortcut(
    shortcut: Omit<ShortcutInfo, 'verified_count' | 'safety_rating'>,
    user: User
  ): Promise<void> {
    await supabase.from('campus_shortcuts').insert([{
      ...shortcut,
      added_by: user.id,
      verified_count: 1,
      created_at: new Date().toISOString()
    }]);
  }

  async getQuickestRoute(
    from: GeoPoint,
    to: CampusLocation,
    preferences: {
      includeShortcuts?: boolean;
      avoidCrowded?: boolean;
      accessibilityNeeded?: boolean;
    } = {}
  ): Promise<{
    route: GeoPoint[];
    estimated_time: number;
    shortcuts?: ShortcutInfo[];
    indoor_navigation?: boolean;
    accessibility_friendly: boolean;
    crowd_level: number;
    landmarks: string[];
  }> {
    // Implementation for finding quickest route with preferences
    return {
      route: [],
      estimated_time: 0,
      accessibility_friendly: true,
      crowd_level: 0,
      landmarks: []
    };
  }

  async getLocationDetails(locationId: string): Promise<{
    location: CampusLocation;
    current_status: {
      is_open: boolean;
      crowd_level: number;
      wait_time?: number;
      next_opening?: Date;
    };
    shortcuts: ShortcutInfo[];
    photos: string[];
    reviews: any[];
  }> {
    const { data: location } = await supabase
      .from('campus_locations')
      .select('*')
      .eq('id', locationId)
      .single();

    return {
      location,
      current_status: await this.getLocationStatus(location),
      shortcuts: await this.getNearbyShortcuts(location),
      photos: await this.getLocationPhotos(locationId),
      reviews: await this.getLocationReviews(locationId)
    };
  }

  async reportIssue(
    location: CampusLocation,
    issue: {
      type: 'incorrect_info' | 'closed' | 'moved' | 'other';
      description: string;
    }
  ): Promise<void> {
    await supabase.from('location_reports').insert([{
      location_id: location.id,
      ...issue,
      status: 'pending',
      created_at: new Date().toISOString()
    }]);
  }

  private sortByDistance(locations: CampusLocation[], userLocation: GeoPoint): CampusLocation[] {
    return locations.sort((a, b) => {
      const distA = this.calculateDistance(userLocation, a.location);
      const distB = this.calculateDistance(userLocation, b.location);
      return distA - distB;
    });
  }

  private calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
    // Haversine formula implementation
    return 0; // Placeholder
  }

  async getClassSchedule(
    userId: string,
    date: Date = new Date()
  ): Promise<{
    classes: ClassSchedule[];
    next_class?: ClassSchedule;
    recommended_route?: {
      route: GeoPoint[];
      leave_by: Date;
      estimated_time: number;
    };
  }> {
    const { data: schedule } = await supabase
      .from('class_schedules')
      .select('*')
      .eq('user_id', userId)
      .eq('day', date.getDay());

    if (!schedule?.length) {
      return { classes: [] };
    }

    const currentTime = date.getHours() * 100 + date.getMinutes();
    const nextClass = schedule.find(cls => cls.time.start > currentTime);

    let recommendedRoute;
    if (nextClass) {
      const userLocation = await this.getUserLastLocation(userId);
      if (userLocation) {
        recommendedRoute = await this.calculateClassRoute(
          userLocation,
          nextClass.location,
          nextClass.time.start
        );
      }
    }

    return {
      classes: schedule,
      next_class: nextClass,
      recommended_route: recommendedRoute
    };
  }

  async getFoodRecommendations(
    location: GeoPoint,
    preferences: {
      maxDistance?: number;
      maxWaitTime?: number;
      priceRange?: number[];
      cuisineTypes?: string[];
      mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
    } = {}
  ): Promise<FoodVenue[]> {
    const {
      maxDistance = 500,
      maxWaitTime = 15,
      priceRange = [1, 2, 3],
      mealType
    } = preferences;

    const { data: venues } = await supabase
      .from('food_venues')
      .select('*')
      .near('location', [location.latitude, location.longitude], maxDistance)
      .in('price_range', priceRange);

    if (!venues?.length) return [];

    // Get real-time status for all venues
    const venuesWithStatus = await Promise.all(
      venues.map(async venue => ({
        ...venue,
        current_status: await this.getVenueStatus(venue.id)
      }))
    );

    // Filter and sort based on current time and preferences
    return this.rankFoodVenues(
      venuesWithStatus.filter(venue => 
        venue.current_status.is_open &&
        (!maxWaitTime || venue.current_status.wait_time <= maxWaitTime) &&
        (!mealType || this.isVenueServingMeal(venue, mealType)) &&
        (!preferences.cuisineTypes?.length || 
          venue.cuisine_types.some(c => preferences.cuisineTypes.includes(c)))
      ),
      location,
      mealType
    );
  }

  private async calculateClassRoute(
    from: GeoPoint,
    to: CampusLocation,
    classTime: number
  ): Promise<{
    route: GeoPoint[];
    leave_by: Date;
    estimated_time: number;
  }> {
    const route = await this.getQuickestRoute(from, to, {
      includeShortcuts: true,
      avoidCrowded: true
    });

    // Add buffer time based on historical data
    const bufferTime = await this.calculateBufferTime(to, classTime);
    const leaveBy = new Date();
    leaveBy.setMinutes(leaveBy.getMinutes() - (route.estimated_time + bufferTime));

    return {
      route: route.route,
      leave_by: leaveBy,
      estimated_time: route.estimated_time
    };
  }

  private async getVenueStatus(venueId: string): Promise<FoodVenue['current_status']> {
    const { data: status } = await supabase
      .from('venue_status')
      .select('*')
      .eq('venue_id', venueId)
      .single();

    const isOpen = await this.checkVenueOpen(venueId);
    const waitTime = await this.estimateWaitTime(venueId);
    const specialToday = await this.getSpecialOfDay(venueId);

    return {
      is_open: isOpen,
      wait_time: waitTime,
      special_today: specialToday
    };
  }

  private rankFoodVenues(
    venues: FoodVenue[],
    userLocation: GeoPoint,
    mealType?: string
  ): FoodVenue[] {
    return venues.sort((a, b) => {
      const scoreA = this.calculateVenueScore(a, userLocation, mealType);
      const scoreB = this.calculateVenueScore(b, userLocation, mealType);
      return scoreB - scoreA;
    });
  }

  private calculateVenueScore(
    venue: FoodVenue,
    userLocation: GeoPoint,
    mealType?: string
  ): number {
    const weights = {
      distance: 0.3,
      rating: 0.2,
      waitTime: 0.2,
      price: 0.15,
      popularity: 0.15
    };

    const distance = this.calculateDistance(userLocation, venue.location);
    const distanceScore = 1 - Math.min(distance / 1000, 1);
    const ratingScore = (venue.ratings.food + venue.ratings.value + venue.ratings.service) / 15;
    const waitTimeScore = 1 - Math.min((venue.current_status.wait_time || 0) / 30, 1);
    const priceScore = (4 - venue.price_range) / 3;

    return (
      distanceScore * weights.distance +
      ratingScore * weights.rating +
      waitTimeScore * weights.waitTime +
      priceScore * weights.price
    );
  }

  private isVenueServingMeal(venue: FoodVenue, mealType: string): boolean {
    const hour = new Date().getHours();
    
    const mealTimes = {
      breakfast: [7, 11],
      lunch: [11, 15],
      dinner: [17, 22],
      snacks: [0, 24]
    };

    return hour >= mealTimes[mealType][0] && hour < mealTimes[mealType][1];
  }
}

export const campusNavigation = CampusNavigationService.getInstance(); 