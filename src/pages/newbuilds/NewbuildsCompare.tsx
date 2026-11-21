import { publicNewbuildPresentation } from '@/lib/real-estate/publicNewbuildPresentation';
import { useNewbuildProjects } from '@/hooks/useNewbuildProjects';
/**
 * /newbuilds/compare — Side-by-side project comparison
 */
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { QueryRecovery } from '@/components/shared/QueryRecovery';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { readPublicJourneyOrigin } from '@/lib/real-estate/publicJourney';
import { ChevronLeft, MapPin, Building2, Layers, X, FileText } from 'lucide-react';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { useNbCompare } from '@/components/newbuilds/NbCompareProvider';
import { NbPriceDisplay } from '@/components/newbuilds/NbPriceDisplay';
import { useIPPLeadEvent } from '@/hooks/useIPPLeadEvent';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

const unitTypeLabels: Record<string, string> = {
  studio: 'Студия', '1br': '1 BR', '2br': '2 BR', '3br': '3 BR', penthouse: 'Пентхаус', villa: 'Вилла',
};

export default function NewbuildsCompare() {
  const { items: savedItems, remove, clear } = useNbCompare();
  const { data: currentProjects, isLoading, isError, refetch } = useNewbuildProjects();
  const { language } = useLanguage();
  const location = useLocation();
  const origin = readPublicJourneyOrigin(location.state);
  const returnHref = origin?.href.startsWith(APP_ROUTES.OFFPLAN_SEARCH) ? origin.href : APP_ROUTES.OFFPLAN_SEARCH;
  const catalogLabel = pickLang(language, { ru: 'К каталогу', en: 'Back to catalogue', th: 'กลับไปยังรายการโครงการ' });
  const title = pickLang(language, { ru: 'Сравнение проектов', en: 'Compare projects', th: 'เปรียบเทียบโครงการ' });
  // An ID in local storage does not grant publication eligibility. Never render stale card fields.
  const items = savedItems.flatMap(({ id }) => {
    const current = currentProjects?.find(project => project.id === id);
    return current ? [publicNewbuildPresentation(current)] : [];
  });
  const unavailableCount = savedItems.length - items.length;
  const nameOf = (item: typeof items[0]) => language === 'ru' ? item.name_ru || item.name_en : item.name_en || item.name_ru;
  const { track } = useIPPLeadEvent();

  // IPP §3 lead event: comparison open (+20). Fires once per item-set change.
  useEffect(() => {
    if (items.length >= 2) {
      track({
        eventType: 'comparison_open',
        meta: { project_ids: items.map(i => i.id) },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  if (savedItems.length === 0 || isLoading || isError || items.length === 0) {
    return (
      <NewbuildsLayout>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="space-y-4">
            <h1 className="nb-display text-2xl text-foreground">{title}</h1>
            {savedItems.length > 0 && isLoading
              ? <p role="status">{pickLang(language, { ru: 'Загружаем проекты…', en: 'Loading projects…', th: 'กำลังโหลดโครงการ…' })}</p>
              : savedItems.length > 0 && isError ? <QueryRecovery onRetry={refetch} />
              : <p className="text-sm text-muted-foreground">{savedItems.length
                  ? pickLang(language, { ru: 'Выбранные проекты больше не опубликованы. Добавьте другие из каталога.', en: 'The selected projects are no longer published. Add others from the catalogue.', th: 'โครงการที่เลือกไม่ได้เผยแพร่แล้ว เลือกโครงการอื่นจากรายการ' })
                  : pickLang(language, { ru: 'Добавьте проекты к сравнению из каталога.', en: 'Add projects to compare from the catalogue.', th: 'เลือกโครงการเพื่อเปรียบเทียบจากรายการ' })}</p>}
            <Link to={returnHref}
              className="inline-flex min-h-11 items-center justify-center px-5 py-2.5 rounded-none bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
              {catalogLabel}
            </Link>
            {savedItems.length > 0 && !isLoading && !isError && <button type="button" onClick={clear} className="ms-3 min-h-11 text-sm underline">
              {pickLang(language, { ru: 'Снять выбор', en: 'Clear selection', th: 'ล้างการเลือก' })}
            </button>}
          </div>
        </div>
      </NewbuildsLayout>
    );
  }

  const rows: { label: string; render: (item: typeof items[0]) => React.ReactNode }[] = [
    {
      label: pickLang(language, { ru: 'Фото', en: 'Photo', th: 'ภาพ' }),
      render: item => item.cover_image ? (
        <img src={item.cover_image} alt="" className="w-full h-32 rounded-none object-cover" />
      ) : <div className="w-full h-32 rounded-none bg-muted" />,
    },
    {
      label: pickLang(language, { ru: 'Цена', en: 'Price', th: 'ราคา' }),
      render: item => <NbPriceDisplay price={item.price_from || null} priceTo={item.price_to} size="md" />,
    },
    {
      label: pickLang(language, { ru: 'Район', en: 'Area', th: 'ทำเล' }),
      render: item => (
        <span className="flex items-center gap-1 text-sm text-foreground">
          <MapPin className="w-3.5 h-3.5 text-primary" aria-hidden />
          {item.location_area || '—'}
        </span>
      ),
    },
    {
      label: pickLang(language, { ru: 'Девелопер', en: 'Developer', th: 'ผู้พัฒนา' }),
      render: item => (
        <span className="flex items-center gap-1 text-sm text-foreground">
          <Building2 className="w-3.5 h-3.5 text-primary" aria-hidden />
          {item.developer_name || '—'}
        </span>
      ),
    },
    {
      label: pickLang(language, { ru: 'Квартир в проекте', en: 'Total homes in project', th: 'จำนวนยูนิตในโครงการ' }),
      render: item => (
        <span className="flex items-center gap-1 text-sm text-foreground">
          <Layers className="w-3.5 h-3.5 text-primary" aria-hidden />
          {item.total_units || '—'}
        </span>
      ),
    },
    {
      label: pickLang(language, { ru: 'Типы юнитов', en: 'Home types', th: 'ประเภทที่อยู่อาศัย' }),
      render: item => (
        <div className="flex flex-wrap gap-1">
          {(item.unit_types || []).map(t => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-none bg-primary/10 text-primary">
              {unitTypeLabels[t] || t}
            </span>
          ))}
          {(!item.unit_types || item.unit_types.length === 0) && <span className="text-xs text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      label: pickLang(language, { ru: 'Удобства', en: 'Amenities', th: 'สิ่งอำนวยความสะดวก' }),
      render: item => (
        <div className="flex flex-wrap gap-1">
          {(item.amenities || []).slice(0, 5).map(a => (
            <span key={a} className="text-[10px] px-1.5 py-0.5 rounded-none bg-muted text-muted-foreground">
              {a}
            </span>
          ))}
          {(!item.amenities || item.amenities.length === 0) && <span className="text-xs text-muted-foreground">—</span>}
        </div>
      ),
    },
  ];

  return (
    <NewbuildsLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        <div className="flex items-center justify-between mb-6 md:mb-8 gap-3">
          <div>
            <Link
              to={returnHref}
              className="inline-flex items-center gap-1 text-sm mb-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden /> {catalogLabel}
            </Link>
            <h1 className="nb-display text-2xl md:text-3xl text-foreground font-semibold">{title}</h1>
          </div>
          <button
            onClick={clear}
            className="text-xs px-3 py-1.5 rounded-none text-muted-foreground border border-border hover:text-foreground hover:border-foreground/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {pickLang(language, { ru: 'Очистить', en: 'Clear', th: 'ล้าง' })}
          </button>
        </div>

        {unavailableCount > 0 && <p className="mb-4 text-sm text-muted-foreground">
          {pickLang(language, { ru: 'Некоторые выбранные проекты больше не опубликованы.', en: 'Some selected projects are no longer published.', th: 'บางโครงการที่เลือกไม่ได้เผยแพร่แล้ว' })}
        </p>}
        {/* Comparison table */}
        <div role="region" aria-label={title} tabIndex={0} className="overflow-x-auto -mx-4 px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <table className="w-full" style={{ minWidth: items.length * 250 + 150 }}>
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 pr-4 w-[150px]" />
                {items.map(item => (
                  <th key={item.id} className="text-left py-3 px-3 min-w-[220px]">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={APP_ROUTES.OFFPLAN_DETAIL(item.id)}
                        className="nb-display text-base text-foreground hover:text-primary transition-colors"
                      >
                        {nameOf(item)}
                      </Link>
                      <button
                        onClick={() => remove(item.id)}
                        className="p-1 flex-shrink-0 text-muted-foreground hover:text-foreground rounded-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Убрать ${nameOf(item)} из сравнения`}
                      >
                        <X className="w-4 h-4" aria-hidden />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={row.label}
                  className={cn('border-b border-border/60', idx % 2 === 1 && 'bg-muted/30')}
                >
                  <th scope="row" className="py-3 pr-4 text-left text-xs font-medium align-top text-muted-foreground">
                    {row.label}
                  </th>
                  {items.map(item => (
                    <td key={item.id} className="py-3 px-3 align-top">
                      {row.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* P8 trigger — Full ClearView for one of the compared projects.
            IPP §12 step 5: "Get Full ClearView for winner". */}
        <div className="nb-separator my-10" />
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-3">
            <h3 className="nb-display text-xl text-foreground">Полный ClearView™ на фаворита</h3>
            <p className="text-sm mt-1 text-muted-foreground">
              {pickLang(language, { ru: 'Обсудите проверку выбранного проекта с myUNO.', en: 'Ask myUNO about due diligence for your project.', th: 'สอบถาม myUNO เรื่องการตรวจสอบโครงการที่เลือก' })}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {items.map(item => (
              <Link
                key={item.id}
                to={`${APP_ROUTES.CLEARVIEW_APPLY}?project=${item.id}`}
                className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-none border border-border bg-card hover:border-foreground/40 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground truncate">
                    {nameOf(item)}
                  </span>
                </div>
                <span className="text-xs font-mono text-muted-foreground shrink-0">→</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm text-muted-foreground">
            {pickLang(language, { ru: 'Чтобы уточнить условия, откройте карточку нужного проекта и отправьте заявку там.', en: 'To confirm details, open a project and send your enquiry from its page.', th: 'หากต้องการยืนยันรายละเอียด ให้เปิดหน้าโครงการและส่งคำถามจากหน้านั้น' })}
          </p>
        </div>
      </div>
    </NewbuildsLayout>
  );
}
