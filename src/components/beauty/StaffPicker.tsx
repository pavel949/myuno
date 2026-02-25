import React from 'react';
import { Star, Clock, Award, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { cn } from '@/lib/utils';

export interface SalonStaff {
  id: string;
  salon_id: string;
  name_en: string;
  name_ru: string;
  photo: string | null;
  bio_en: string | null;
  bio_ru: string | null;
  specializations: string[];
  experience_years: number | null;
  certifications: string[] | null;
  working_days: string[] | null;
  working_hours: Record<string, string> | null;
  rating: number | null;
  review_count: number | null;
  portfolio_images: string[] | null;
  is_featured: boolean;
}

interface StaffPickerProps {
  staff: SalonStaff[];
  selectedId?: string;
  onSelect: (staffId: string | undefined) => void;
  isLoading?: boolean;
  allowAny?: boolean;
  className?: string;
}

export function StaffPicker({
  staff,
  selectedId,
  onSelect,
  isLoading = false,
  allowAny = true,
  className,
}: StaffPickerProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-32 h-40 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!staff || staff.length === 0) {
    return null;
  }

  const handleSelect = (id: string | undefined) => {
    onSelect(id === selectedId ? undefined : id);
  };

  return (
    <div className={className}>
      <h3 className="font-semibold mb-3">
        {isRu ? 'Выберите мастера' : 'Choose Your Specialist'}
      </h3>
      
      <div className="flex gap-3 pb-2 overflow-x-auto scrollbar-hide touch-pan-y snap-x snap-mandatory -mx-4 px-4">
        {/* "Any available" option */}
        {allowAny && (
          <Card
            className={cn(
              'w-28 flex-shrink-0 cursor-pointer transition-all hover:shadow-md snap-start touch-manipulation',
              !selectedId && 'ring-2 ring-primary'
            )}
            onClick={() => handleSelect(undefined)}
          >
            <CardContent className="p-3 text-center">
              <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                {!selectedId && (
                  <Check className="w-6 h-6 text-primary" />
                )}
                {selectedId && (
                  <span className="text-2xl">👤</span>
                )}
              </div>
              <p className="font-medium text-sm">
                {isRu ? 'Любой' : 'Any'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'свободный' : 'available'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Staff members */}
        {staff.map((member) => {
          const isSelected = selectedId === member.id;
          const name = isRu ? member.name_ru : member.name_en;
          const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);

          return (
            <Card
              key={member.id}
              className={cn(
                'w-32 flex-shrink-0 cursor-pointer transition-all hover:shadow-md snap-start touch-manipulation',
                isSelected && 'ring-2 ring-primary'
              )}
              onClick={() => handleSelect(member.id)}
            >
              <CardContent className="p-3">
                <div className="relative mb-2">
                  <Avatar className="w-16 h-16 mx-auto">
                    <AvatarImage src={member.photo || undefined} alt={name} />
                    <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                  </Avatar>
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  {member.is_featured && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] px-1.5 py-0"
                    >
                      <Award className="w-2.5 h-2.5 mr-0.5" />
                      Top
                    </Badge>
                  )}
                </div>

                <p className="font-medium text-sm text-center truncate">
                  {name.split(' ')[0]}
                </p>

                {member.rating && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-warning text-warning" />
                    <span className="text-xs font-medium">{member.rating.toFixed(1)}</span>
                    {member.review_count && (
                      <span className="text-xs text-muted-foreground">
                        ({member.review_count})
                      </span>
                    )}
                  </div>
                )}

                {member.experience_years && (
                  <div className="flex items-center justify-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      {member.experience_years} {isRu ? 'лет' : 'yrs'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Compact inline picker for forms
interface StaffPickerInlineProps {
  staff: SalonStaff[];
  selectedId?: string;
  onSelect: (staffId: string | undefined) => void;
  isLoading?: boolean;
}

export function StaffPickerInline({
  staff,
  selectedId,
  onSelect,
  isLoading = false,
}: StaffPickerInlineProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto py-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="w-16 h-16 rounded-full flex-shrink-0" />
        ))}
      </div>
    );
  }

  if (!staff || staff.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 overflow-x-auto py-2">
      {/* Any option */}
      <button
        type="button"
        onClick={() => onSelect(undefined)}
        className={cn(
          'flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[60px]',
          !selectedId ? 'bg-primary/10' : 'hover:bg-muted'
        )}
      >
        <div className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center',
          !selectedId ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}>
          <span className="text-lg">👤</span>
        </div>
        <span className="text-xs font-medium">
          {isRu ? 'Любой' : 'Any'}
        </span>
      </button>

      {staff.map((member) => {
        const isSelected = selectedId === member.id;
        const name = isRu ? member.name_ru : member.name_en;
        const firstName = name.split(' ')[0];
        const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);

        return (
          <button
            key={member.id}
            type="button"
            onClick={() => onSelect(member.id)}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[60px]',
              isSelected ? 'bg-primary/10' : 'hover:bg-muted'
            )}
          >
            <div className="relative">
              <Avatar className={cn(
                'w-12 h-12',
                isSelected && 'ring-2 ring-primary ring-offset-2'
              )}>
                <AvatarImage src={member.photo || undefined} alt={name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              {isSelected && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                </div>
              )}
            </div>
            <span className="text-xs font-medium truncate max-w-[56px]">
              {firstName}
            </span>
          </button>
        );
      })}
    </div>
  );
}
