import type { GeoPoint } from '../types';

interface StateEmergency {
  state: string;
  police: string;
  ambulance: string;
  women_helpline: string;
  child_helpline: string;
  domestic_violence: string;
  railway_alert: string;
  road_accident: string;
  senior_citizen: string;
}

export const STATE_EMERGENCY_NUMBERS: StateEmergency[] = [
  {
    state: 'Delhi',
    police: '112',
    ambulance: '102',
    women_helpline: '1091',
    child_helpline: '1098',
    domestic_violence: '181',
    railway_alert: '1512',
    road_accident: '1073',
    senior_citizen: '1291',
  },
  {
    state: 'Maharashtra',
    police: '100',
    ambulance: '108',
    women_helpline: '103',
    child_helpline: '1098',
    domestic_violence: '181',
    railway_alert: '182',
    road_accident: '108',
    senior_citizen: '1090',
  },
  {
    state: 'Karnataka',
    police: '100',
    ambulance: '108',
    women_helpline: '1091',
    child_helpline: '1098',
    domestic_violence: '181',
    railway_alert: '182',
    road_accident: '108',
    senior_citizen: '1090',
  },
  {
    state: 'Tamil Nadu',
    police: '100',
    ambulance: '108',
    women_helpline: '1091',
    child_helpline: '1098',
    domestic_violence: '181',
    railway_alert: '182',
    road_accident: '108',
    senior_citizen: '1090',
  },
  {
    state: 'Kerala',
    police: '100',
    ambulance: '108',
    women_helpline: '1091',
    child_helpline: '1098',
    domestic_violence: '181',
    railway_alert: '182',
    road_accident: '108',
    senior_citizen: '1090',
  },
  {
    state: 'Gujarat',
    police: '100',
    ambulance: '108',
    women_helpline: '181',
    child_helpline: '1098',
    domestic_violence: '181',
    railway_alert: '182',
    road_accident: '108',
    senior_citizen: '1090',
  },
  // Add more states...
];

export function getStateEmergencyNumbers(stateName: string): StateEmergency | undefined {
  return STATE_EMERGENCY_NUMBERS.find(
    state => state.state.toLowerCase() === stateName.toLowerCase()
  );
}

export function getEmergencyNumbersByLocation(location: GeoPoint): Promise<StateEmergency> {
  // TODO: Implement reverse geocoding to get state from location
  return Promise.resolve(STATE_EMERGENCY_NUMBERS[0]); // Default to Delhi for now
} 