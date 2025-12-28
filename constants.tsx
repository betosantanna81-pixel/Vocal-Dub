
import React from 'react';
import { VoiceOption, VoiceMood } from './types';

export const APP_VERSION = "0.1.8";

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'Kore', name: 'Kore', gender: 'female', description: 'Clara e profissional' },
  { id: 'Puck', name: 'Puck', gender: 'male', description: 'Amigável e enérgico' },
  { id: 'Charon', name: 'Charon', gender: 'male', description: 'Profundo e autoritário' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'male', description: 'Forte e ressonante' },
  { id: 'Zephyr', name: 'Zephyr', gender: 'female', description: 'Suave e arejada' },
];

export const MOOD_OPTIONS = [
  { value: VoiceMood.NEUTRAL, label: 'Neutro' },
  { value: VoiceMood.CHEERFUL, label: 'Alegre' },
  { value: VoiceMood.SERIOUS, label: 'Sério' },
  { value: VoiceMood.CALM, label: 'Calmo' },
  { value: VoiceMood.ENERGETIC, label: 'Enérgico' },
  { value: VoiceMood.WHISPER, label: 'Sussurrado' },
];

export const ChameleonLogo = () => (
  <div className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-br from-teal-400 to-indigo-600 rounded-xl shadow-lg">
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="w-8 h-8 text-white"
    >
      <path d="M18 10a5 5 0 1 0-8.9 3.01c.12.16.12.38 0 .54A5 5 0 0 1 4 15v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2a5 5 0 0 1-2-5z" />
      <circle cx="15" cy="9" r="1" fill="currentColor" />
      <path d="M10 10c0-1.1.9-2 2-2" />
      <path d="M10 18v2a2 2 0 0 0 2 2h4" />
      <rect x="11" y="2" width="2" height="5" rx="1" fill="white" stroke="none" />
    </svg>
    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
      <i className="fas fa-microphone text-[10px] text-indigo-600"></i>
    </div>
  </div>
);
