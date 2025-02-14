import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { GeoPoint, RealtimeLocationPayload } from '../types';

export function useRealtimeLocations(groupId: string | null) {
  const [locations, setLocations] = useState<Record<string, GeoPoint>>({});

  useEffect(() => {
    if (!groupId) return;

    // Initial fetch
    fetchLocations();

    // Subscribe to changes
    const subscription = supabase
      .channel(`group-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_locations',
          filter: `group_id=eq.${groupId}`,
        },
        (payload: { new: RealtimeLocationPayload['new'] }) => {
          const newLocation = payload.new;
          if (newLocation && 'latitude' in newLocation && 'longitude' in newLocation) {
            setLocations(prev => ({
              ...prev,
              [newLocation.user_id]: {
                latitude: newLocation.latitude,
                longitude: newLocation.longitude,
              },
            }));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [groupId]);

  const fetchLocations = async () => {
    if (!groupId) return;

    const { data, error } = await supabase
      .from('user_locations')
      .select('user_id, latitude, longitude')
      .eq('group_id', groupId);

    if (error || !data) {
      console.error('Error fetching locations:', error);
      return;
    }

    const locationMap = data.reduce<Record<string, GeoPoint>>((acc, loc) => {
      acc[loc.user_id] = {
        latitude: loc.latitude,
        longitude: loc.longitude,
      };
      return acc;
    }, {});

    setLocations(locationMap);
  };

  return locations;
} 