import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import { EmergencyAlert, Language } from '../types';
import { recognizeVoiceCommand } from '../utils/voiceCommands';
import { getPreferredLanguage } from '../utils/emergencyMessages';

class VoiceRecognitionService {
  private static instance: VoiceRecognitionService;
  private isListening: boolean = false;
  private onEmergencyDetected?: (type: EmergencyAlert['type']) => void;

  private constructor() {
    this.setupVoiceRecognition();
  }

  static getInstance(): VoiceRecognitionService {
    if (!this.instance) {
      this.instance = new VoiceRecognitionService();
    }
    return this.instance;
  }

  private setupVoiceRecognition() {
    Voice.onSpeechResults = this.handleSpeechResults.bind(this);
    Voice.onSpeechError = this.handleSpeechError.bind(this);
  }

  private async handleSpeechResults(e: SpeechResultsEvent) {
    if (!e.value || !this.onEmergencyDetected) return;

    for (const text of e.value) {
      const result = recognizeVoiceCommand(text);
      if (result && result.confidence > 0.7) {
        this.onEmergencyDetected(result.type);
        await this.stopListening();
        break;
      }
    }
  }

  private handleSpeechError(e: any) {
    console.error('Speech recognition error:', e);
  }

  async startListening(
    onEmergencyDetected: (type: EmergencyAlert['type']) => void,
    preferredLanguage?: Language
  ) {
    try {
      this.onEmergencyDetected = onEmergencyDetected;
      this.isListening = true;

      // Set up voice recognition for preferred language
      await Voice.start(preferredLanguage || 'en-IN');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
    }
  }

  async stopListening() {
    try {
      this.isListening = false;
      await Voice.stop();
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  async destroy() {
    try {
      await Voice.destroy();
    } catch (error) {
      console.error('Error destroying voice recognition:', error);
    }
  }
}

export const voiceRecognition = VoiceRecognitionService.getInstance(); 