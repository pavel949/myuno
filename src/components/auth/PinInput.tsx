import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

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
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  // Clear values when error changes to true
  useEffect(() => {
    if (error) {
      setValues(Array(length).fill(''));
      inputRefs.current[0]?.focus();
    }
  }, [error, length]);

  const handleChange = (index: number, value: string) => {
    if (disabled) return;

    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newValues = [...values];
    newValues[index] = value;
    setValues(newValues);

    // Move to next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    const pin = newValues.join('');
    if (pin.length === length && !newValues.includes('')) {
      onComplete(pin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newValues = [...values];
    for (let i = 0; i < pastedData.length && i < length; i++) {
      newValues[i] = pastedData[i];
    }
    setValues(newValues);

    // Focus appropriate input
    const focusIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[focusIndex]?.focus();

    // Check if complete
    if (pastedData.length === length) {
      onComplete(pastedData);
    }
  };

  return (
    <div className={cn('flex gap-2 justify-center', className)}>
      {values.map((value, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={value}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            'w-12 h-14 text-center text-2xl font-semibold rounded-xl border-2 transition-all',
            'bg-background focus:outline-none focus:ring-2 focus:ring-primary/50',
            error 
              ? 'border-destructive animate-shake' 
              : 'border-border focus:border-primary',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-label={`PIN digit ${index + 1}`}
        />
      ))}
    </div>
  );
};
