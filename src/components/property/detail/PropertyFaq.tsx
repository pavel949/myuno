/**
 * PropertyFaq — derives a small FAQ from structured listing fields
 * (check-in/out, wifi, parking, pets, cancellation, quiet hours).
 *
 * Only questions whose underlying data exists are rendered. If nothing is
 * available, the component renders nothing (no empty accordion). Bilingual via
 * the inline RU/EN convention used across PropertyDetail.
 */
import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { useLanguage } from '@/contexts/LanguageContext';

interface PropertyFaqProps {
  checkInTime?: string | null;
  checkOutTime?: string | null;
  wifiIncluded?: boolean | null;
  parkingIncluded?: boolean | null;
  petsAllowed?: boolean | null;
  cancellationPolicy?: string | null;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
}

interface FaqEntry {
  id: string;
  q: string;
  a: string;
}

export function PropertyFaq({
  checkInTime,
  checkOutTime,
  wifiIncluded,
  parkingIncluded,
  petsAllowed,
  cancellationPolicy,
  quietHoursStart,
  quietHoursEnd,
}: PropertyFaqProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const entries: FaqEntry[] = [];

  if (checkInTime || checkOutTime) {
    const parts: string[] = [];
    if (checkInTime) parts.push(isRu ? `заезд с ${checkInTime}` : `check-in from ${checkInTime}`);
    if (checkOutTime) parts.push(isRu ? `выезд до ${checkOutTime}` : `check-out by ${checkOutTime}`);
    const sentence = parts.join(isRu ? ', ' : ', ');
    entries.push({
      id: 'check-in-out',
      q: isRu ? 'Когда заезд и выезд?' : 'What are the check-in and check-out times?',
      a: sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.',
    });
  }

  if (wifiIncluded != null) {
    entries.push({
      id: 'wifi',
      q: isRu ? 'Есть ли Wi-Fi?' : 'Is Wi-Fi available?',
      a: wifiIncluded
        ? (isRu ? 'Да, Wi-Fi включён.' : 'Yes, Wi-Fi is included.')
        : (isRu ? 'Wi-Fi не входит в стоимость.' : 'Wi-Fi is not included.'),
    });
  }

  if (parkingIncluded != null) {
    entries.push({
      id: 'parking',
      q: isRu ? 'Есть ли парковка?' : 'Is parking available?',
      a: parkingIncluded
        ? (isRu ? 'Да, парковка доступна.' : 'Yes, parking is available.')
        : (isRu ? 'Парковка не предоставляется.' : 'Parking is not provided.'),
    });
  }

  if (petsAllowed != null) {
    entries.push({
      id: 'pets',
      q: isRu ? 'Можно ли с питомцами?' : 'Are pets allowed?',
      a: petsAllowed
        ? (isRu ? 'Да, питомцы разрешены.' : 'Yes, pets are allowed.')
        : (isRu ? 'Размещение с питомцами не допускается.' : 'Pets are not allowed.'),
    });
  }

  if (quietHoursStart && quietHoursEnd) {
    entries.push({
      id: 'quiet-hours',
      q: isRu ? 'Есть ли тихие часы?' : 'Are there quiet hours?',
      a: isRu
        ? `Тихие часы с ${quietHoursStart} до ${quietHoursEnd}.`
        : `Quiet hours are from ${quietHoursStart} to ${quietHoursEnd}.`,
    });
  }

  if (cancellationPolicy) {
    entries.push({
      id: 'cancellation',
      q: isRu ? 'Какая политика отмены?' : 'What is the cancellation policy?',
      a: cancellationPolicy,
    });
  }

  if (entries.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl lg:text-2xl font-semibold mb-3 lg:mb-4 flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-muted-foreground" />
        {isRu ? 'Частые вопросы' : 'Frequently asked questions'}
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {entries.map((entry) => (
          <AccordionItem key={entry.id} value={entry.id}>
            <AccordionTrigger className="text-left text-sm font-medium">
              {entry.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
              {entry.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
