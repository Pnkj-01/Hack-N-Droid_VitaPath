import React from 'react';
import { Group, GroupMember, GeoPoint, SafeZone, GroupActivity } from '../types';
import { supabase } from '../services/supabase';
import { useAuthContext } from './AuthContext';

interface GroupContextType {
  groups: Group[];
  activeGroup: Group | null;
  loading: boolean;
  createGroup: (name: string, type: Group['type']) => Promise<void>;
  joinGroup: (inviteCode: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  switchGroup: (groupId: string) => Promise<void>;
  updateLocation: (location: GeoPoint) => Promise<void>;
  toggleLocationSharing: (enabled: boolean) => Promise<void>;
  getMemberLocations: (groupId: string) => Promise<Record<string, GeoPoint>>;
  safeZones: SafeZone[];
  addSafeZone: (name: string, location: GeoPoint, radius: number) => Promise<void>;
  removeSafeZone: (zoneId: string) => Promise<void>;
  checkSafeZones: (location: GeoPoint) => Promise<SafeZone[]>;
  logActivity: (type: GroupActivity['type'], description: string, metadata?: Record<string, any>) => Promise<void>;
}

const GroupContext = React.createContext<GroupContextType | null>(null);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = React.useState<Group | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { user } = useAuthContext();
  const [safeZones, setSafeZones] = React.useState<SafeZone[]>([]);

  // Load user's groups on mount
  React.useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  // Load safe zones when group changes
  React.useEffect(() => {
    if (activeGroup) {
      loadSafeZones();
    }
  }, [activeGroup?.id]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          members:group_members(*)
        `)
        .eq('members.user_id', user?.id);

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSafeZones = async () => {
    if (!activeGroup) return;

    const { data, error } = await supabase
      .from('safe_zones')
      .select('*')
      .eq('group_id', activeGroup.id);

    if (error) throw error;
    setSafeZones(data.map(zone => ({
      ...zone,
      location: {
        latitude: zone.latitude,
        longitude: zone.longitude,
      },
    })));
  };

  const createGroup = async (name: string, type: Group['type']) => {
    if (!user) throw new Error('Must be logged in to create a group');

    const { data, error } = await supabase
      .from('groups')
      .insert([
        {
          name,
          type,
          created_by: user.id,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Add creator as admin member
    await supabase.from('group_members').insert([
      {
        group_id: data.id,
        user_id: user.id,
        role: 'admin',
        location_sharing: true,
        joined_at: new Date().toISOString(),
      },
    ]);

    await loadGroups();
  };

  const joinGroup = async (inviteCode: string) => {
    if (!user) throw new Error('Must be logged in to join a group');

    const { data: group, error } = await supabase
      .from('groups')
      .select()
      .eq('invite_code', inviteCode)
      .single();

    if (error) throw error;

    await supabase.from('group_members').insert([
      {
        group_id: group.id,
        user_id: user.id,
        role: 'member',
        location_sharing: true,
        joined_at: new Date().toISOString(),
      },
    ]);

    await loadGroups();
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;

    await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id);

    await loadGroups();
    if (activeGroup?.id === groupId) {
      setActiveGroup(null);
    }
  };

  const switchGroup = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    setActiveGroup(group || null);
  };

  const updateLocation = async (location: GeoPoint) => {
    if (!user || !activeGroup) return;

    await supabase.from('user_locations').upsert([
      {
        user_id: user.id,
        group_id: activeGroup.id,
        latitude: location.latitude,
        longitude: location.longitude,
        updated_at: new Date().toISOString(),
      },
    ]);
  };

  const toggleLocationSharing = async (enabled: boolean) => {
    if (!user || !activeGroup) return;

    await supabase
      .from('group_members')
      .update({ location_sharing: enabled })
      .eq('group_id', activeGroup.id)
      .eq('user_id', user.id);

    await loadGroups();
  };

  const getMemberLocations = async (groupId: string) => {
    const { data, error } = await supabase
      .from('user_locations')
      .select('user_id, latitude, longitude')
      .eq('group_id', groupId);

    if (error) throw error;

    return data.reduce((acc, loc) => {
      acc[loc.user_id] = {
        latitude: loc.latitude,
        longitude: loc.longitude,
      };
      return acc;
    }, {} as Record<string, GeoPoint>);
  };

  const addSafeZone = async (name: string, location: GeoPoint, radius: number) => {
    if (!activeGroup || !user) return;

    await supabase.from('safe_zones').insert([{
      group_id: activeGroup.id,
      name,
      latitude: location.latitude,
      longitude: location.longitude,
      radius,
      created_by: user.id,
    }]);

    await loadSafeZones();
    await logActivity('safety', `Added safe zone: ${name}`);
  };

  const removeSafeZone = async (zoneId: string) => {
    if (!activeGroup) return;

    const zone = safeZones.find(z => z.id === zoneId);
    await supabase.from('safe_zones').delete().eq('id', zoneId);

    await loadSafeZones();
    if (zone) {
      await logActivity('safety', `Removed safe zone: ${zone.name}`);
    }
  };

  const checkSafeZones = async (location: GeoPoint) => {
    return safeZones.filter(zone => {
      const distance = getDistance(location, zone.location);
      return distance <= zone.radius;
    });
  };

  const logActivity = async (
    type: GroupActivity['type'],
    description: string,
    metadata?: Record<string, any>
  ) => {
    if (!activeGroup || !user) return;

    await supabase.from('group_activities').insert([{
      group_id: activeGroup.id,
      user_id: user.id,
      type,
      description,
      metadata,
    }]);
  };

  return (
    <GroupContext.Provider
      value={{
        groups,
        activeGroup,
        loading,
        createGroup,
        joinGroup,
        leaveGroup,
        switchGroup,
        updateLocation,
        toggleLocationSharing,
        getMemberLocations,
        safeZones,
        addSafeZone,
        removeSafeZone,
        checkSafeZones,
        logActivity,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
}

export function useGroupContext() {
  const context = React.useContext(GroupContext);
  if (!context) {
    throw new Error('useGroupContext must be used within a GroupProvider');
  }
  return context;
} 