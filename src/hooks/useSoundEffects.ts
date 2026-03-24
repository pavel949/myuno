import { useCallback } from 'react';
import { getFeedbackSettings } from './useFeedbackSettings';

export type SoundType = 'click' | 'type' | 'success' | 'error' | 'notification' | 'keypad';

interface SoundConfig {
  frequency: number;
  duration: number;
  volume: number;
  type: OscillatorType;
}

const soundConfigs: Record<SoundType, SoundConfig> = {
  click: { frequency: 1000, duration: 0.05, volume: 0.08, type: 'sine' },
  type: { frequency: 1400, duration: 0.02, volume: 0.04, type: 'sine' },
  keypad: { frequency: 1200, duration: 0.04, volume: 0.06, type: 'square' },
  success: { frequency: 880, duration: 0.15, volume: 0.1, type: 'sine' },
  error: { frequency: 200, duration: 0.2, volume: 0.12, type: 'sawtooth' },
  notification: { frequency: 800, duration: 0.1, volume: 0.1, type: 'sine' },
};

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      return null;
    }
  }
  
  // Resume if suspended (required for autoplay policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  
  return audioContext;
}

function playTone(config: SoundConfig, volumeMultiplier: number = 1): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = config.frequency;
    oscillator.type = config.type;
    
    const volume = config.volume * volumeMultiplier;
    const now = ctx.currentTime;
    
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
    
    oscillator.start(now);
    oscillator.stop(now + config.duration);
  } catch (e) {
    // Silently fail if audio fails
  }
}

function playSuccessChord(volumeMultiplier: number = 1): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const frequencies = [523, 659, 784]; // C5, E5, G5
  const duration = 0.2;
  const volume = 0.08 * volumeMultiplier;

  frequencies.forEach((freq, i) => {
    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      const now = ctx.currentTime + (i * 0.05);
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch (e) {
      // Silently fail
    }
  });
}

/**
 * Play a sound effect
 * @param type - The type of sound to play
 */
export function playSound(type: SoundType): void {
  const settings = getFeedbackSettings();
  
  if (!settings.soundEnabled) return;
  if (type === 'type' && !settings.typingSoundEnabled) return;
  
  const volumeMultiplier = settings.volume;
  
  if (type === 'success') {
    playSuccessChord(volumeMultiplier);
  } else {
    const config = soundConfigs[type];
    playTone(config, volumeMultiplier);
  }
}

/**
 * React hook for sound effects
 */
export function useSoundEffects() {
  const play = useCallback((type: SoundType) => {
    playSound(type);
  }, []);

  const settings = getFeedbackSettings();

  return { 
    play, 
    isEnabled: settings.soundEnabled,
    isTypingEnabled: settings.typingSoundEnabled
  };
}

// Helper to check if a key should trigger typing sound
export function isTypingKey(e: React.KeyboardEvent): boolean {
  // Ignore modifier keys and special keys
  const ignoreKeys = [
    'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab',
    'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Home', 'End', 'PageUp', 'PageDown', 'Insert', 'F1', 'F2',
    'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'
  ];
  
  return !ignoreKeys.includes(e.key) && e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter';
}
