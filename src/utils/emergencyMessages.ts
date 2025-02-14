import { EmergencyAlert, Language, GeoPoint } from '../types';

interface EmergencyMessage {
  title: string;
  body: string;
}

export const EMERGENCY_MESSAGES: Record<EmergencyAlert['type'], Record<Language, EmergencyMessage>> = {
  danger: {
    en: {
      title: 'Emergency Alert',
      body: 'I am in danger and need immediate help. My location:',
    },
    hi: {
      title: 'आपातकालीन चेतावनी',
      body: 'मैं खतरे में हूं और तत्काल मदद की जरूरत है। मेरी लोकेशन:',
    },
    mr: {
      title: 'आणीबाणीची सूचना',
      body: 'मी धोक्यात आहे आणि मला तात्काळ मदतीची गरज आहे. माझे स्थान:',
    },
    ta: {
      title: 'அவசர எச்சரிக்கை',
      body: 'நான் ஆபத்தில் உள்ளேன், உடனடி உதவி தேவை. என் இருப்பிடம்:',
    },
    te: {
      title: 'అత్యవసర హెచ్చరిక',
      body: 'నేను ప్రమాదంలో ఉన్నాను మరియు వెంటనే సహాయం కావాలి. నా స్థానం:',
    },
    bn: {
      title: 'জরুরি সতর্কতা',
      body: 'আমি বিপদে আছি এবং অবিলম্বে সাহায্য প্রয়োজন। আমার অবস্থান:',
    },
    // Add more languages...
  },
  medical: {
    en: {
      title: 'Medical Emergency',
      body: 'I need immediate medical assistance. My location:',
    },
    hi: {
      title: 'चिकित्सा आपातकाल',
      body: 'मुझे तत्काल चिकित्सा सहायता की आवश्यकता है। मेरी लोकेशन:',
    },
    ta: {
      title: 'மருத்துவ அவசரம்',
      body: 'எனக்கு உடனடி மருத்துவ உதவி தேவை. என் இருப்பிடம்:',
    },
    // Add more languages...
  },
  fire: {
    en: {
      title: 'Fire Emergency',
      body: 'Fire emergency situation. Need immediate assistance. Location:',
    },
    hi: {
      title: 'आग आपातकाल',
      body: 'आग लगने की आपात स्थिति। तत्काल सहायता की आवश्यकता है। स्थान:',
    },
    // Add more languages...
  },
  other: {
    en: {
      title: 'Emergency Alert',
      body: 'Emergency situation. Need immediate assistance. Location:',
    },
    hi: {
      title: 'आपातकालीन सूचना',
      body: 'आपात स्थिति। तत्काल सहायता की आवश्यकता है। स्थान:',
    },
    // Add more languages...
  },
};

export function getEmergencyMessage(
  type: EmergencyAlert['type'],
  language: Language = 'en',
  location: GeoPoint,
  customMessage?: string
): string {
  const message = EMERGENCY_MESSAGES[type][language] || EMERGENCY_MESSAGES[type]['en'];
  const locationUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
  
  let fullMessage = `${message.title}\n\n${message.body}\n${locationUrl}`;
  
  if (customMessage) {
    fullMessage += `\n\n${customMessage}`;
  }

  return fullMessage;
}

export function getPreferredLanguage(state: string): Language {
  // Map states to their primary languages
  const stateLanguages: Record<string, Language> = {
    'Maharashtra': 'mr',
    'Tamil Nadu': 'ta',
    'Karnataka': 'kn',
    'Kerala': 'ml',
    'Gujarat': 'gu',
    'West Bengal': 'bn',
    'Punjab': 'pa',
    // Add more states...
  };

  return stateLanguages[state] || 'hi'; // Default to Hindi if state not found
} 