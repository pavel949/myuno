import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface UnderlineInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  error?: string;
  maxLengthDisplay?: number;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}

export const UnderlineInput = React.forwardRef<HTMLInputElement, UnderlineInputProps>(
  ({ label, error, maxLengthDisplay, value, onChange, icon, className, readOnly, type = 'text', ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <div className={cn("space-y-1", className)}>
        <label className="block text-sm text-muted-foreground">{label}</label>
        <div className="relative">
          {icon && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            readOnly={readOnly}
            className={cn(
              "w-full h-12 bg-transparent border-0 border-b-2 px-0 text-base transition-colors",
              "focus:outline-none focus:ring-0",
              icon ? "pr-10" : "",
              readOnly && "text-muted-foreground cursor-default",
              error
                ? "border-b-destructive"
                : focused
                  ? "border-b-primary"
                  : "border-b-border"
            )}
            {...props}
          />
        </div>
        <div className="flex items-center justify-between min-h-[1.25rem]">
          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : (
            <span />
          )}
          {maxLengthDisplay !== undefined && (
            <span className="text-xs text-muted-foreground">
              {value.length}/{maxLengthDisplay}
            </span>
          )}
        </div>
      </div>
    );
  }
);

UnderlineInput.displayName = 'UnderlineInput';
