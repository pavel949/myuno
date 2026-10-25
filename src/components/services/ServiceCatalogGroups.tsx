import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { useCatalogFromDB } from '@/lib/catalog/useCatalogFromDB';
import { publicServiceCategories } from '@/lib/services/publicServiceCategories';

/** A presentation of existing live destinations, never another service taxonomy. */
export function ServiceCatalogGroups({ search }: { search: string }) {
  const { language } = useLanguage();
  const catalog = useCatalogFromDB();
  const label = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const query = search.trim().toLocaleLowerCase();
  const rows = (catalog.isFromDB ? publicServiceCategories(catalog.categories) : []).filter(row =>
    !query || [row.labelRu, row.labelEn, row.labelTh, ...Object.values(row.benefit), row.secondary?.label.ru, row.secondary?.label.en, row.secondary?.label.th].some(value => value?.toLocaleLowerCase().includes(query)));
  if (catalog.isLoading) return <p role="status">{label('Загружаем категории…', 'Loading categories…', 'กำลังโหลดหมวดหมู่…')}</p>;
  if (catalog.error) return <div role="alert"><p>{label('Не удалось загрузить категории.', 'Could not load categories.', 'โหลดหมวดหมู่ไม่สำเร็จ')}</p><button type="button" className="min-h-11 underline" onClick={() => catalog.refetch()}>{label('Повторить', 'Try again', 'ลองอีกครั้ง')}</button></div>;
  if (!rows.length) return null;
  return <section aria-labelledby="service-catalog-groups" className="space-y-4"><h2 id="service-catalog-groups" className="font-display text-h3">{label('Разделы услуг', 'Service categories', 'หมวดหมู่บริการ')}</h2><div className="grid gap-3 sm:grid-cols-2">
    {rows.map(row => <article key={row.id} className="border border-border bg-card p-4"><h3 className="font-medium"><Link className="inline-flex min-h-11 items-center underline underline-offset-4" to={row.path}>{pickLang(language, { ru: row.labelRu, en: row.labelEn, th: row.labelTh })} →</Link></h3><p className="text-sm text-muted-foreground">{pickLang(language, row.benefit)}</p>{row.secondary && <Link className="inline-flex min-h-11 items-center text-sm underline underline-offset-4" to={row.secondary.path}>{pickLang(language, row.secondary.label)} →</Link>}</article>)}
  </div></section>;
}
