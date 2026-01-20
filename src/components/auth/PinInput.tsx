import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Delete } from 'lucide-react';
import { playSound } from '@/hooks/useSoundEffects';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { getFeedbackSettings } from '@/hooks/useFeedbackSettings';

interface PinInputProps {
  length?: number;
  onComplete: (pin: string) => void;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export const PinInput: React.FC<PinInputProps> = ({
  length = 6,
  onComplete,
  disabled = false,
  error = false,
  className
}) => {
  const [pin, setPin] = useState('');

  // Clear PIN when error changes to true
  React.useEffect(() => {
    if (error) {
      setPin('');
    }
  }, [error]);

  const triggerFeedback = (type: 'keypad' | 'click' = 'keypad') => {
    const settings = getFeedbackSettings();
    if (settings.soundEnabled) {
      playSound(type);
    }
    if (settings.hapticEnabled) {
      triggerHaptic('light');
    }
  };

  const handleNumberClick = (num: number) => {
    if (disabled || pin.length >= length) return;
    
    triggerFeedback('keypad');
    
    const newPin = pin + num.toString();
    setPin(newPin);
    
    if (newPin.length === length) {
      onComplete(newPin);
    }
  };

  const handleDelete = () => {
    if (disabled) return;
    triggerFeedback('click');
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled) return;
    triggerFeedback('click');
    setPin('');
  };

  // Number pad layout
  const numbers = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    ['clear', 0, 'delete']
  ];

  return (
    <div className={cn('flex flex-col items-center gap-8', className)}>
      {/* PIN dots display */}
      <div className="flex gap-3 justify-center">
        {Array.from({ length }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'w-4 h-4 rounded-full transition-all duration-200',
              index < pin.length 
                ? 'bg-primary scale-110' 
                : 'bg-muted-foreground/20',
              error && index < pin.length && 'bg-destructive animate-shake'
            )}
          />
        ))}
      </div>

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-4 max-w-xs w-full">
        {numbers.flat().map((item, index) => {
          if (item === 'clear') {
            return (
              <button
                key={index}
                onClick={handleClear}
                disabled={disabled || pin.length === 0}
                className={cn(
                  'h-16 rounded-2xl flex items-center justify-center transition-all duration-200',
                  'text-muted-foreground hover:text-foreground',
                  'hover:bg-secondary/80 active:scale-95',
                  'disabled:opacity-30 disabled:cursor-not-allowed'
                )}
                aria-label="Clear"
              >
                <span className="text-xs font-medium uppercase tracking-wider">Clear</span>
              </button>
            );
          }
          
          if (item === 'delete') {
            return (
              <button
                key={index}
                onClick={handleDelete}
                disabled={disabled || pin.length === 0}
                className={cn(
                  'h-16 rounded-2xl flex items-center justify-center transition-all duration-200',
                  'text-muted-foreground hover:text-foreground',
                  'hover:bg-secondary/80 active:scale-95',
                  'disabled:opacity-30 disabled:cursor-not-allowed'
                )}
                aria-label="Delete"
              >
                <Delete className="w-6 h-6" />
              </button>
            );
          }

          return (
            <button
              key={index}
              onClick={() => handleNumberClick(item as number)}
              disabled={disabled}
              className={cn(
                'h-16 rounded-2xl flex items-center justify-center transition-all duration-200',
                'bg-secondary/50 hover:bg-secondary border border-border/50',
                'text-2xl font-semibold text-foreground',
                'hover:scale-105 active:scale-95 active:bg-primary/20',
                'shadow-sm hover:shadow-md',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
              )}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
};
