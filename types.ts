
export interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  description: string;
}

export interface AudioResult {
  id: string;
  text: string;
  voiceName: string;
  timestamp: number;
  audioUrl: string;
}

export enum VoiceMood {
  NEUTRAL = 'Neutral',
  CHEERFUL = 'Cheerful',
  SERIOUS = 'Serious',
  CALM = 'Calm',
  ENERGETIC = 'Energetic',
  WHISPER = 'Whispering'
}

export interface SpeechParams {
  speed: number;       // 0-20
  pitch: number;       // 0-20
  resonance: number;   // 0-20
  aspiration: number;  // 0-20
  nasality: number;    // 0-20
  prosody: number;     // 0-20
  age: number;         // 0-20 (Infantil -> Idoso)
  texture: number;     // 0-20 (Áspera -> Sedosa)
  intensity: number;   // 0-20 (Íntima -> Projetada)
}

export interface VoiceProfile {
  id: string;
  name: string;
  baseVoiceId: string;
  mood: VoiceMood;
  params: SpeechParams;
}
