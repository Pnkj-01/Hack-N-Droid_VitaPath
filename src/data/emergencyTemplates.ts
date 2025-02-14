import { EmergencyTemplate } from '../types';

export const EMERGENCY_TEMPLATES: EmergencyTemplate[] = [
  {
    id: 'eve_teasing',
    type: 'danger',
    title: 'Eve Teasing / Harassment',
    description: 'Facing harassment or eve teasing situation',
    priority: 1,
    actions: {
      notify_contacts: true,
      notify_authorities: true,
      notify_group: true,
    },
  },
  {
    id: 'medical_emergency',
    type: 'medical',
    title: 'Medical Emergency',
    description: 'Need immediate medical assistance',
    priority: 1,
    actions: {
      notify_contacts: true,
      notify_authorities: true,
      notify_group: true,
    },
  },
  {
    id: 'unsafe_transport',
    type: 'danger',
    title: 'Unsafe Public Transport',
    description: 'Feeling unsafe in public transportation',
    priority: 2,
    actions: {
      notify_contacts: true,
      notify_authorities: false,
      notify_group: true,
    },
  },
  {
    id: 'domestic_violence',
    type: 'danger',
    title: 'Domestic Violence',
    description: 'Facing domestic violence situation',
    priority: 1,
    actions: {
      notify_contacts: true,
      notify_authorities: true,
      notify_group: false,
    },
  },
  {
    id: 'acid_attack',
    type: 'danger',
    title: 'Acid Attack',
    description: 'Acid attack emergency situation',
    priority: 1,
    actions: {
      notify_contacts: true,
      notify_authorities: true,
      notify_group: true,
    },
  },
  {
    id: 'railway_emergency',
    type: 'other',
    title: 'Railway Emergency',
    description: 'Emergency situation in train or at railway station',
    priority: 2,
    actions: {
      notify_contacts: true,
      notify_authorities: true,
      notify_group: true,
    },
  },
  {
    id: 'road_accident',
    type: 'medical',
    title: 'Road Accident',
    description: 'Road accident emergency',
    priority: 1,
    actions: {
      notify_contacts: true,
      notify_authorities: true,
      notify_group: true,
    },
  },
  {
    id: 'cyber_crime',
    type: 'other',
    title: 'Cyber Crime',
    description: 'Facing cyber crime or online harassment',
    priority: 2,
    actions: {
      notify_contacts: true,
      notify_authorities: true,
      notify_group: false,
    },
  },
]; 