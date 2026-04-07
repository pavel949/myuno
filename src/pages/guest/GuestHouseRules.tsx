import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGuestPropertyBookings } from '@/hooks/usePropertyBookings';
import { usePropertyWithRentalTerms } from '@/hooks/useProperties';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ScrollText,
  Moon,
  PawPrint,
  Baby,
  Car,
  PartyPopper,
  Ban,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';

interface SectionProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ icon: Icon, title, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <CardHeader
        className="pb-2 cursor-pointer select-none"
        onClick={() => setOpen(o => !o)}
      >
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            {title}
          </span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </CardTitle>
      </CardHeader>
      {open && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}

function BooleanLine({ value, labelYes, labelNo }: { value?: boolean; labelYes: string; labelNo: string }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="flex items-center gap-2">
      {value ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <X className="w-4 h-4 text-red-500" />
      )}
      <span>{value ? labelYes : labelNo}</span>
    </div>
  );
}

export default function GuestHouseRules() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { activeBookings, isLoading: bookingsLoading } = useGuestPropertyBookings();
  const propertyId = activeBookings?.[0]?.property_id;

  const { data: propertyData, isLoading: propertyLoading } = usePropertyWithRentalTerms(propertyId);

  const isLoading = bookingsLoading || propertyLoading;

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  if (!activeBookings || activeBookings.length === 0) {
    return (
      <PageContainer>
        <PageHeader title={isRu ? 'Правила проживания' : 'House Rules'} showBack />
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              {isRu ? 'Нет активного бронирования' : 'No Active Booking'}
            </h2>
            <p className="text-muted-foreground">
              {isRu
                ? 'Правила проживания будут доступны при активном бронировании'
                : 'House rules will be available when you have an active booking'}
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  // Property data with all fields from select('*')
  const p = propertyData as Record<string, any> | null;
  const terms = propertyData?.rentalTerms;

  const houseRules = isRu
    ? (terms?.house_rules_ru || terms?.house_rules)
    : (terms?.house_rules || terms?.house_rules_ru);

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Правила проживания' : 'House Rules'}
        showBack
      />

      <div className="space-y-4">
        {/* General Rules */}
        {houseRules && (
          <CollapsibleSection
            icon={ScrollText}
            title={isRu ? 'Общие правила' : 'General Rules'}
            defaultOpen
          >
            <div className="text-sm space-y-2">
              {houseRules.split(/[\n•\-]/).map((r: string) => r.trim()).filter((r: string) => r.length > 0).map((rule: string, idx: number) => (
                <p key={idx}>• {rule}</p>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Quiet Hours */}
        {(p?.quiet_hours_start || p?.quiet_hours_end) && (
          <CollapsibleSection
            icon={Moon}
            title={isRu ? 'Тихие часы' : 'Quiet Hours'}
          >
            <p className="text-sm">
              {p?.quiet_hours_start && p?.quiet_hours_end
                ? `${p.quiet_hours_start} — ${p.quiet_hours_end}`
                : p?.quiet_hours_start
                  ? `${isRu ? 'С' : 'From'} ${p.quiet_hours_start}`
                  : `${isRu ? 'До' : 'Until'} ${p?.quiet_hours_end}`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isRu
                ? 'Пожалуйста, соблюдайте тишину в указанное время'
                : 'Please keep noise levels down during these hours'}
            </p>
          </CollapsibleSection>
        )}

        {/* Pets */}
        {p?.pets_allowed !== undefined && (
          <CollapsibleSection
            icon={PawPrint}
            title={isRu ? 'Домашние животные' : 'Pets'}
          >
            <div className="space-y-2 text-sm">
              <BooleanLine
                value={p?.pets_allowed}
                labelYes={isRu ? 'Животные разрешены' : 'Pets allowed'}
                labelNo={isRu ? 'Животные не допускаются' : 'Pets not allowed'}
              />
              {p?.pet_deposit != null && p.pet_deposit > 0 && (
                <p className="text-muted-foreground">
                  {isRu ? 'Залог за животное:' : 'Pet deposit:'} {p.pet_deposit} THB
                </p>
              )}
              {p?.pet_notes && (
                <p className="text-muted-foreground">
                  {isRu ? (p.pet_notes_ru || p.pet_notes) : p.pet_notes}
                </p>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Children */}
        {p?.children_friendly !== undefined && (
          <CollapsibleSection
            icon={Baby}
            title={isRu ? 'Дети' : 'Children'}
          >
            <div className="space-y-2 text-sm">
              <BooleanLine
                value={p?.children_friendly}
                labelYes={isRu ? 'Подходит для детей' : 'Children friendly'}
                labelNo={isRu ? 'Не подходит для маленьких детей' : 'Not suitable for young children'}
              />
              <BooleanLine
                value={p?.has_crib}
                labelYes={isRu ? 'Детская кроватка доступна' : 'Crib available'}
                labelNo={isRu ? 'Детская кроватка недоступна' : 'No crib available'}
              />
              <BooleanLine
                value={p?.has_high_chair}
                labelYes={isRu ? 'Детский стульчик доступен' : 'High chair available'}
                labelNo={isRu ? 'Детский стульчик недоступен' : 'No high chair available'}
              />
            </div>
          </CollapsibleSection>
        )}

        {/* Parking */}
        {p?.parking_included !== undefined && (
          <CollapsibleSection
            icon={Car}
            title={isRu ? 'Парковка' : 'Parking'}
          >
            <div className="space-y-2 text-sm">
              <BooleanLine
                value={p?.parking_included}
                labelYes={isRu ? 'Парковка включена' : 'Parking included'}
                labelNo={isRu ? 'Парковка не включена' : 'Parking not included'}
              />
              {p?.parking_spaces != null && p.parking_spaces > 0 && (
                <p className="text-muted-foreground">
                  {isRu ? 'Парковочных мест:' : 'Parking spaces:'} {p.parking_spaces}
                </p>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Parties */}
        {p?.parties_allowed !== undefined && (
          <CollapsibleSection
            icon={PartyPopper}
            title={isRu ? 'Вечеринки' : 'Parties'}
          >
            <div className="space-y-2 text-sm">
              <BooleanLine
                value={p?.parties_allowed}
                labelYes={isRu ? 'Вечеринки разрешены' : 'Parties allowed'}
                labelNo={isRu ? 'Вечеринки запрещены' : 'Parties not allowed'}
              />
              {p?.max_party_guests != null && p.max_party_guests > 0 && (
                <p className="text-muted-foreground">
                  {isRu ? 'Максимум гостей:' : 'Maximum guests:'} {p.max_party_guests}
                </p>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Penalties */}
        {(p?.smoking_penalty != null || p?.late_checkout_penalty != null) && (
          <CollapsibleSection
            icon={Ban}
            title={isRu ? 'Штрафы' : 'Penalties'}
          >
            <div className="space-y-2 text-sm">
              {p?.smoking_penalty != null && p.smoking_penalty > 0 && (
                <p>
                  {isRu ? 'Штраф за курение:' : 'Smoking penalty:'} {p.smoking_penalty} THB
                </p>
              )}
              {p?.late_checkout_penalty != null && p.late_checkout_penalty > 0 && (
                <p>
                  {isRu ? 'Штраф за поздний выезд:' : 'Late checkout penalty:'} {p.late_checkout_penalty} THB
                </p>
              )}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </PageContainer>
  );
}
