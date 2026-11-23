/**
 * Open an existing canonical deal link. Do not call the historical converter:
 * the live platform does not expose it and an unverified company destination
 * must not receive client data. Any future conversion needs a checked writer.
 */
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';

interface Props {
  convertedDealId?: string | null;
}

export function ConvertLeadToDealButton({ convertedDealId }: Props) {
  const { language } = useLanguage();
  if (!convertedDealId || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(convertedDealId)) return null;

  return (
    <Button asChild size="sm" variant="secondary">
      <Link to={`/mc/sales/${convertedDealId}`}>
        <ExternalLink className="size-4" aria-hidden="true" />
        {pickLang(language, { ru: 'Открыть связанную сделку', en: 'Open linked deal', th: 'เปิดดีลที่เชื่อมโยง' })}
      </Link>
    </Button>
  );
}
