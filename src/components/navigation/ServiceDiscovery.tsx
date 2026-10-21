import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Search, X } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageShell, PageHeader, EmptyState } from '@/components/page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CATEGORIES } from '@/lib/catalog/taxonomy';
import { APP_ROUTES } from '@/lib/config/routes';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';

// Navigation over the existing catalogue, never a second services inventory.
// A route being present does not imply live price, capacity or instant booking.
const categories = CATEGORIES.filter(c => c.id !== 'cat-real-estate' && c.id !== 'cat-partner-portal')
  .map(c => ({ ...c, services: c.services.filter(s => s.status === 'available' || s.status === 'info') }))
  .filter(c => c.services.length > 0);

export function ServiceDiscoveryContent() {
  const { language } = useLanguage();
  const [params, setParams] = useSearchParams();
  const L = (ru: string, en: string, th?: string) => pickLang(language, { ru, en, th });
  const query = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const selected = categories.some(c => c.id === category) ? category : '';
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    // Preserve other deep-link context, and don't create history per keystroke.
    setParams(next, { replace: key === 'q' });
  };
  const label = (v: { labelRu: string; labelEn: string; labelTh?: string }) =>
    pickLang(language, { ru: v.labelRu, en: v.labelEn, th: v.labelTh });
  const q = query.trim().toLocaleLowerCase();
  const visible = categories.filter(c => !selected || c.id === selected).map(c => ({
    ...c,
    services: c.services.filter(s => !q || [s.labelRu, s.labelEn, s.labelTh, c.labelRu, c.labelEn, c.labelTh]
      .filter(Boolean).join(' ').toLocaleLowerCase().includes(q)),
  })).filter(c => c.services.length > 0);

  return <>
    <PageHeader title={L('Услуги на Пхукете', 'Services in Phuket', 'บริการในภูเก็ต')}
      subtitle={L('Выберите, что нужно. Условия и способ заказа — на странице услуги.', 'Choose what you need. See terms and how to request or book on the service page.', 'เลือกบริการที่ต้องการ ดูเงื่อนไขและวิธีจองในหน้าบริการ')} />
    <section aria-label={L('Поиск услуг', 'Find services', 'ค้นหาบริการ')} className="mb-8 grid gap-4 border border-border bg-card p-4 sm:grid-cols-[1fr_240px] sm:p-5">
      <div>
        <label htmlFor="service-discovery-query" className="mb-2 block text-sm font-medium">{L('Что вам нужно?', 'What do you need?', 'คุณต้องการอะไร?')}</label>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-5 text-muted-foreground" />
          <Input id="service-discovery-query" type="search" value={query} onChange={e => update('q', e.target.value)}
            placeholder={L('Уборка, трансфер…', 'Cleaning, transfer…', 'ทำความสะอาด รถรับส่ง…')} className="pl-11 pr-12" />
          {query && <Button variant="ghost" size="icon" className="absolute right-0 top-0" onClick={() => update('q', '')} aria-label={L('Очистить поиск', 'Clear search', 'ล้างการค้นหา')}><X /></Button>}
        </div>
      </div>
      <div>
        <label htmlFor="service-discovery-category" className="mb-2 block text-sm font-medium">{L('Категория', 'Category', 'หมวดหมู่')}</label>
        <Select value={selected || 'all'} onValueChange={value => update('category', value === 'all' ? '' : value)}>
          <SelectTrigger id="service-discovery-category"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{L('Все категории', 'All categories', 'ทุกหมวดหมู่')}</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{label(c)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </section>
    <h2 className="sr-only">{L('Каталог услуг', 'Service catalogue', 'รายการบริการ')}</h2>
    <p role="status" className="sr-only">{L('Найдено направлений', 'Matching service types', 'ประเภทบริการที่พบ')}: {visible.reduce((sum, c) => sum + c.services.length, 0)}</p>
    {visible.length === 0 ? <EmptyState icon={Search} title={L('Ничего не нашлось', 'No matches', 'ไม่พบผลลัพธ์')}
      description={L('Попробуйте другое название или выберите все категории.', 'Try another search or choose all categories.', 'ลองค้นหาใหม่หรือเลือกทุกหมวดหมู่')}
      action={<Button variant="outline" onClick={() => { const next = new URLSearchParams(params); next.delete('q'); next.delete('category'); setParams(next); }}>{L('Сбросить поиск', 'Reset search', 'รีเซ็ตการค้นหา')}</Button>} />
      : <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label={L('Каталог услуг', 'Service catalogue', 'รายการบริการ')}>
        {visible.map(c => <Card key={c.id} className="shadow-none">
          <CardHeader className="flex-row items-center gap-3 space-y-0 border-b border-border p-5">
            <c.icon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
            <CardTitle>{label(c)}</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {c.services.map(s => <Link key={s.id} to={s.path}
              className="group flex min-h-12 items-center justify-between gap-3 px-3 py-3 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span>{label(s)}</span><ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            </Link>)}
          </CardContent>
        </Card>)}
      </div>}
    <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
      <p className="text-sm text-muted-foreground">{L('Не знаете, что выбрать?', 'Not sure what to choose?', 'ไม่แน่ใจว่าจะเลือกอะไร?')}</p>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline"><Link to={APP_ROUTES.SUPPORT}>{L('Помогите разобраться', 'Get help', 'ขอความช่วยเหลือ')}</Link></Button>
        <Button asChild variant="ghost"><Link to={APP_ROUTES.DISCOVER_SITUATIONS}>{L('Подобрать по ситуации', 'Browse by situation', 'เลือกตามสถานการณ์')}</Link></Button>
      </div>
    </div>
  </>;
}

export default function ServiceDiscovery() {
  return <AppLayout usePageContainer={false}><PageShell width="wide"><ServiceDiscoveryContent /></PageShell></AppLayout>;
}
