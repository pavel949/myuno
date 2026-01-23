import React from 'react';
import { useAdminProviders } from '@/hooks/useAdmin';
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2 } from 'lucide-react';

interface ProviderSelectorProps {
  value: string;
  onChange: (providerId: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export function ProviderSelector({ 
  value, 
  onChange, 
  label,
  required = false,
  disabled = false
}: ProviderSelectorProps) {
  const { language } = useLanguage();
  const { providers, isLoading } = useAdminProviders();
  const isRussian = language === 'ru';

  if (isLoading) {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label} {required && '*'}
        </Label>
      )}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={isRussian ? 'Выберите провайдера' : 'Select provider'} />
        </SelectTrigger>
        <SelectContent>
          {providers.map(provider => (
            <SelectItem key={provider.id} value={provider.id}>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{provider.name}</span>
                {!provider.is_verified && (
                  <span className="text-xs text-amber-500">
                    ({isRussian ? 'не верифицирован' : 'unverified'})
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
