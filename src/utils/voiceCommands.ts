import { EmergencyAlert, Language } from '../types';

interface VoiceCommand {
  command: string;
  type: EmergencyAlert['type'];
  language: Language;
  priority: number; // Higher number means higher priority match
}

export const VOICE_COMMANDS: VoiceCommand[] = [
  // Hindi
  { command: 'मदद', type: 'danger', language: 'hi', priority: 1 },
  { command: 'बचाओ', type: 'danger', language: 'hi', priority: 2 },
  { command: 'एम्बुलेंस', type: 'medical', language: 'hi', priority: 1 },
  { command: 'आग', type: 'fire', language: 'hi', priority: 1 },
  { command: 'पुलिस', type: 'danger', language: 'hi', priority: 1 },

  // Marathi
  { command: 'मदत', type: 'danger', language: 'mr', priority: 1 },
  { command: 'वाचवा', type: 'danger', language: 'mr', priority: 2 },
  { command: 'रुग्णवाहिका', type: 'medical', language: 'mr', priority: 1 },
  { command: 'आग', type: 'fire', language: 'mr', priority: 1 },
  { command: 'पोलीस', type: 'danger', language: 'mr', priority: 1 },

  // Tamil
  { command: 'உதவி', type: 'danger', language: 'ta', priority: 1 },
  { command: 'காப்பாற்று', type: 'danger', language: 'ta', priority: 2 },
  { command: 'ஆம்புலன்ஸ்', type: 'medical', language: 'ta', priority: 1 },
  { command: 'நெருப்பு', type: 'fire', language: 'ta', priority: 1 },
  { command: 'போலீஸ்', type: 'danger', language: 'ta', priority: 1 },

  // Telugu
  { command: 'సహాయం', type: 'danger', language: 'te', priority: 1 },
  { command: 'కాపాడండి', type: 'danger', language: 'te', priority: 2 },
  { command: 'అంబులెన్స్', type: 'medical', language: 'te', priority: 1 },
  { command: 'మంట', type: 'fire', language: 'te', priority: 1 },
  { command: 'పోలీస్', type: 'danger', language: 'te', priority: 1 },

  // Bengali
  { command: 'সাহায্য', type: 'danger', language: 'bn', priority: 1 },
  { command: 'বাঁচাও', type: 'danger', language: 'bn', priority: 2 },
  { command: 'অ্যাম্বুলেন্স', type: 'medical', language: 'bn', priority: 1 },
  { command: 'আগুন', type: 'fire', language: 'bn', priority: 1 },
  { command: 'পুলিশ', type: 'danger', language: 'bn', priority: 1 },

  // Gujarati
  { command: 'મદદ', type: 'danger', language: 'gu', priority: 1 },
  { command: 'બચાવો', type: 'danger', language: 'gu', priority: 2 },
  { command: 'એમ્બ્યુલન્સ', type: 'medical', language: 'gu', priority: 1 },
  { command: 'આગ', type: 'fire', language: 'gu', priority: 1 },
  { command: 'પોલીસ', type: 'danger', language: 'gu', priority: 1 },

  // English (for fallback)
  { command: 'help', type: 'danger', language: 'en', priority: 1 },
  { command: 'emergency', type: 'danger', language: 'en', priority: 2 },
  { command: 'ambulance', type: 'medical', language: 'en', priority: 1 },
  { command: 'fire', type: 'fire', language: 'en', priority: 1 },
  { command: 'police', type: 'danger', language: 'en', priority: 1 },
];

export function recognizeVoiceCommand(
  text: string,
  preferredLanguage: Language = 'en'
): { type: EmergencyAlert['type']; confidence: number } | null {
  // Normalize text
  const normalizedText = text.toLowerCase().trim();
  
  // First try preferred language
  const preferredMatch = findBestMatch(normalizedText, preferredLanguage);
  if (preferredMatch && preferredMatch.confidence > 0.7) {
    return preferredMatch;
  }

  // Try all languages if no good match in preferred language
  const allMatches = SUPPORTED_LANGUAGES.map(lang => 
    findBestMatch(normalizedText, lang)
  ).filter(Boolean) as Array<{ type: EmergencyAlert['type']; confidence: number }>;

  // Return the match with highest confidence
  return allMatches.sort((a, b) => b.confidence - a.confidence)[0] || null;
}

function findBestMatch(text: string, language: Language) {
  const languageCommands = VOICE_COMMANDS.filter(cmd => cmd.language === language);
  
  const matches = languageCommands.map(cmd => ({
    command: cmd,
    confidence: calculateConfidence(text, cmd.command)
  }));

  const bestMatch = matches.sort((a, b) => b.confidence - a.confidence)[0];
  
  if (!bestMatch || bestMatch.confidence < 0.3) return null;

  return {
    type: bestMatch.command.type,
    confidence: bestMatch.confidence * (bestMatch.command.priority / 2)
  };
}

function calculateConfidence(text: string, command: string): number {
  // Simple Levenshtein distance-based confidence
  const distance = levenshteinDistance(text, command.toLowerCase());
  const maxLength = Math.max(text.length, command.length);
  return 1 - (distance / maxLength);
}

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(b.length + 1).fill(null).map(() => 
    Array(a.length + 1).fill(null)
  );

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + substitutionCost
      );
    }
  }

  return matrix[b.length][a.length];
}

const SUPPORTED_LANGUAGES: Language[] = [
  'en', 'hi', 'mr', 'ta', 'te', 'bn', 'gu', 'kn', 'ml', 'pa', 'ur', 'or', 'as'
]; 