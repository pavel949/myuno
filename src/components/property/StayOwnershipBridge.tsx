import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { pickLang } from '@/lib/i18n/pickLang';
import { propertySearchHref } from '@/lib/propertySearchQuery';
import { complexDetailHref } from '@/lib/real-estate/propertyDetailIntent';

interface StayOwnershipBridgeProps {
  projectId?: string | null;
  district?: string | null;
}

export function StayOwnershipBridge({ projectId, district }: StayOwnershipBridgeProps) {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const href = projectId
    ? complexDetailHref(projectId, 'buy', '')
    : propertySearchHref('', { mode: 'buy', ...(district?.trim() ? { district: district.trim() } : {}) });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Рассматриваете покупку жилья?', 'Thinking about buying a home?', 'กำลังคิดจะซื้อบ้านใช่ไหม')}</CardTitle>
        <p className="text-body-sm text-muted-foreground">
          {projectId
            ? t('Посмотрите предложения о продаже в этом комплексе.', 'See the homes for sale in this development.', 'ดูบ้านที่ประกาศขายในโครงการนี้')
            : t('Посмотрите предложения о продаже и подробные условия.', 'Browse homes for sale and review listing terms.', 'ดูบ้านที่ประกาศขายและเงื่อนไขของแต่ละรายการ')}
        </p>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline">
          <Link to={href}>{t('Посмотреть жильё на продажу', 'See homes for sale', 'ดูบ้านที่ประกาศขาย')}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
