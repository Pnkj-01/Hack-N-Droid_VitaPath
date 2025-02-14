import { EmergencyContact, EmergencyAlert } from '../types';

interface PrioritizedContact extends EmergencyContact {
  score: number;
}

export function prioritizeContacts(
  contacts: EmergencyContact[],
  alertType: EmergencyAlert['type'],
  time: Date = new Date()
): EmergencyContact[] {
  const scored: PrioritizedContact[] = contacts.map(contact => {
    let score = contact.priority * 100; // Base score from priority

    // Adjust based on relationship
    switch (contact.relationship) {
      case 'family':
        score += 50;
        break;
      case 'friend':
        score += 30;
        break;
      default:
        score += 10;
    }

    // Adjust based on alert type
    if (alertType === 'medical' && contact.relationship === 'family') {
      score += 20;
    }

    // Adjust based on time of day (prefer family during night hours)
    const hour = time.getHours();
    if (hour < 6 || hour > 22) { // Night time
      if (contact.relationship === 'family') {
        score += 30;
      }
    }

    return { ...contact, score };
  });

  return scored.sort((a, b) => b.score - a.score);
} 