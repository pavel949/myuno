import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SectionCard } from '@/components/uno/SectionCard';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'booked', labelEn: 'Booked', labelRu: 'Забронировано' },
  { key: 'submitted', labelEn: 'Check-in Sent', labelRu: 'Заявка отправлена' },
  { key: 'verified', labelEn: 'Verified', labelRu: 'Проверено' },
  { key: 'checked_in', labelEn: 'Checked In', labelRu: 'Заселён' },
];

function resolveStep(checkIn: { status: string | null } | null): number {
  if (!checkIn || !checkIn.status) return 0;
  const status = checkIn.status;
  if (status === 'checked_in' || status === 'completed') return 3;
  if (status === 'verified' || status === 'approved') return 2;
  if (status === 'submitted' || status === 'pending') return 1;
  return 0;
}

export function CheckInStatusStepper() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';

  const { data: checkIn, isLoading } = useQuery({
    queryKey: ['guest-checkin-status', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('guest_check_in_data')
        .select('status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  if (isLoading) return null;

  const currentStep = resolveStep(checkIn);

  return (
    <SectionCard className="mb-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        {isRu ? 'Статус заселения' : 'Check-in Status'}
      </p>
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                    isCompleted && 'bg-success text-success-foreground',
                    isActive && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                    !isCompleted && !isActive && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={cn(
                    'text-[10px] text-center leading-tight',
                    isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {isRu ? step.labelRu : step.labelEn}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-1 rounded-full -mt-5',
                    idx < currentStep ? 'bg-success' : 'bg-muted'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </SectionCard>
  );
}
