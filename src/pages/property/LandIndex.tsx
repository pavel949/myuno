/**
 * Land plots landing — Phase 1 scaffold.
 * Reuses the commercial hooks with `asset_class = 'land'`.
 */
import { useSearchParams } from 'react-router-dom';
import { Trees } from 'lucide-react';
import { SEOHead } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useLandPlots } from '@/hooks/useCommercialProperties';
import { LandPlotCard } from '@/components/property/commercial/LandPlotCard';
import { PersonaGatePrompt } from '@/components/property/commercial/PersonaGatePrompt';
import { LAND_TYPES } from '@/lib/real-estate/commercialTaxonomy';
import { ECOSYSTEM_PAGE_CONTAINER } from '@/design-system/ecosystemLayout';

type Intent = 'rent' | 'sale';

export default function LandIndex() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';
  const [searchParams, setSearchParams] = useSearchParams();

  const intent = (searchParams.get('intent') as Intent) || 'sale';
  const type = searchParams.get('type') || 'all';

  const { data, isLoading, error } = useLandPlots({ intent, propertyType: type });
  const items = data ?? [];

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all' || !value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  return (
    <>
      <SEOHead
        title={isRu ? 'Земельные участки в Пхукете — myUNO' : isTh ? 'ที่ดินในภูเก็ต — myUNO' : 'Land Plots Phuket — myUNO'}
        description={
          isRu
            ? 'Земельные участки на Пхукете: жилые, коммерческие, у моря. Чаноте, зонирование, фронтаж — проверенная информация.'
            : isTh
            ? 'ที่ดินในภูเก็ต: ที่อยู่อาศัย เชิงพาณิชย์ ติดทะเล โฉนด การจัดโซน หน้ากว้าง — ข้อมูลที่ผ่านการตรวจสอบ'
            : 'Land plots in Phuket: residential, commercial, beachfront. Chanote, zoning, frontage — verified info.'
        }
      />

      <div className={ECOSYSTEM_PAGE_CONTAINER}>
        <div className="px-4 pt-3 pb-2">
          <BackButton />
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Trees className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              {isRu ? 'Земельные участки' : isTh ? 'ที่ดิน' : 'Land Plots'}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {isRu
              ? 'Жилые, коммерческие и пляжные участки с проверенным титулом.'
              : isTh
              ? 'ที่ดินที่อยู่อาศัย เชิงพาณิชย์ และติดทะเล พร้อมโฉนดที่ผ่านการตรวจสอบ'
              : 'Residential, commercial and beachfront plots with verified title.'}
          </p>
        </div>

        <div className="px-4 space-y-4">
          <PersonaGatePrompt />

          {/* Intent toggle */}
          <div className="inline-flex p-1 rounded-full bg-muted">
            {(['sale', 'rent'] as Intent[]).map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setParam('intent', i)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                  intent === i
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {i === 'sale' ? (isRu ? 'Продажа' : isTh ? 'ขาย' : 'Sale') : isRu ? 'Аренда' : isTh ? 'เช่า' : 'Rent'}
              </button>
            ))}
          </div>

          {/* Type chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => setParam('type', 'all')}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors',
                type === 'all'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-background text-muted-foreground border-border hover:text-foreground',
              )}
            >
              {isRu ? 'Все' : isTh ? 'ทั้งหมด' : 'All'}
            </button>
            {LAND_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setParam('type', t.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors',
                  type === t.id
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground',
                )}
              >
                <span className="mr-1">{t.icon}</span>
                {isRu ? t.labelRu : t.labelEn}{/* th label not in source taxonomy → EN fallback */}
              </button>
            ))}
          </div>

          {/* Grid */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[16/10] rounded-none" />
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className="text-sm text-destructive p-4 rounded-none bg-destructive/5">
              {isRu ? 'Не удалось загрузить участки' : isTh ? 'ไม่สามารถโหลดที่ดินได้' : 'Failed to load plots'}
            </div>
          )}

          {!isLoading && !error && items.length === 0 && (
            <div className="text-center py-16 px-4 border border-dashed border-border rounded-none">
              <Trees className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                {isRu ? 'Подбираем эксклюзивные участки' : isTh ? 'กำลังคัดสรรที่ดินเอ็กซ์คลูซีฟ' : 'Curating exclusive plots'}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {isRu
                  ? 'Каждый участок проходит проверку титула и зонирования перед публикацией.'
                  : isTh
                  ? 'ที่ดินทุกแปลงผ่านการตรวจสอบโฉนดและการจัดโซนก่อนเผยแพร่'
                  : 'Every plot is title- and zoning-verified before publishing.'}
              </p>
              <Button size="sm" variant="outline" asChild>
                <a href="mailto:capital@myuno.app">
                  {isRu ? 'Связаться с Capital Advisory' : isTh ? 'ติดต่อ Capital Advisory' : 'Contact Capital Advisory'}
                </a>
              </Button>
            </div>
          )}

          {!isLoading && !error && items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((p) => (
                <LandPlotCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
