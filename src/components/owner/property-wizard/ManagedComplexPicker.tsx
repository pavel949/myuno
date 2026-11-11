import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useCompanyAccessLifetime } from '@/hooks/useCompanyAccessLifetime';
import { bindCompanyAccessOperation } from '@/lib/companyAccessOperation';
import { listManagedComplexDrafts } from '@/lib/complexAuthoring';
import { pickLang } from '@/lib/i18n/pickLang';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/** A grouping choice only. The checked property writer revalidates the link. */
export function ManagedComplexPicker({ value, onChange }: { value?: string; onChange: (id: string | undefined) => void }) {
  const { user } = useAuth();
  const { activeCompany, isLoading, error } = useActiveCompany();
  const { language } = useLanguage();
  if (isLoading) return <p role="status">{pickLang(language, { en: 'Loading complex workspace…', ru: 'Загружаем рабочую область комплексов…', th: 'กำลังโหลดพื้นที่ทำงานของโครงการ…' })}</p>;
  if (error || !user || !activeCompany) return <p role="alert">{pickLang(language, { en: 'Complex selection needs an available company workspace. Your current link is preserved.', ru: 'Для выбора комплекса нужна доступная рабочая область компании. Текущая привязка сохранена.', th: 'ต้องมีพื้นที่ทำงานของบริษัทเพื่อเลือกโครงการ การเชื่อมโยงปัจจุบันยังคงเดิม' })}</p>;
  return <ScopedComplexPicker key={`${user.id}:${activeCompany.company_id}`} actorId={user.id} companyId={activeCompany.company_id} value={value} onChange={onChange} />;
}

function ScopedComplexPicker({ actorId, companyId, value, onChange }: { actorId: string; companyId: string; value?: string; onChange: (id: string | undefined) => void }) {
  const { language } = useLanguage();
  const text = (en: string, ru: string, th: string) => pickLang(language, { en, ru, th });
  const lifetime = useCompanyAccessLifetime(actorId, companyId);
  const complexes = useInfiniteQuery({
    queryKey: ['managed-complex-link-options', actorId, companyId],
    initialPageParam: 0,
    queryFn: async ({ signal, pageParam }) => {
      const lease = lifetime.begin();
      signal.addEventListener('abort', lease.finish, { once: true });
      try { return await listManagedComplexDrafts(await bindCompanyAccessOperation(lease), pageParam, 100); }
      finally { signal.removeEventListener('abort', lease.finish); lease.finish(); }
    },
    getNextPageParam: (last, pages) => last.length === 100 ? pages.length * 100 : undefined,
  });
  const options = complexes.error ? [] : (complexes.data?.pages.flat() || []).filter(row => row.is_active && row.approval_status === 'approved');
  const knownSelection = options.some(row => row.id === value);
  return <div className="space-y-2">
    <Label htmlFor="managed-property-complex">{text('Your published complex', 'Ваш опубликованный комплекс', 'โครงการที่คุณเผยแพร่')}</Label>
    <Select value={value || 'standalone'} disabled={complexes.isLoading || !!complexes.error} onValueChange={id => {
      if (id === 'standalone') onChange(undefined);
      else if (options.some(row => row.id === id)) onChange(id);
    }}>
      <SelectTrigger id="managed-property-complex" className="h-auto min-h-11 text-left [&>span]:line-clamp-none [&>span]:whitespace-normal [&>span]:break-words"><SelectValue /></SelectTrigger>
      <SelectContent className="max-w-[min(90vw,36rem)] w-[var(--radix-select-trigger-width)]">
        <SelectItem value="standalone" className="min-h-11 whitespace-normal break-words">{text('Standalone property', 'Отдельный объект', 'ที่พักแยกอิสระ')}</SelectItem>
        {value && !knownSelection && <SelectItem value={value} className="min-h-11 whitespace-normal break-words">{text('Current complex (not in this list)', 'Текущий комплекс (нет в этом списке)', 'โครงการปัจจุบัน (ไม่อยู่ในรายการนี้)')}</SelectItem>}
        {options.map(row => <SelectItem key={row.id} value={row.id} className="min-h-11 whitespace-normal break-words">{language === 'ru' ? row.name_ru || row.name : row.name || row.name_ru}</SelectItem>)}
      </SelectContent>
    </Select>
    <p className="text-xs text-muted-foreground">{text('Create a complex in Complexes and have it approved first. Then select it here to link this unit. Only your published complexes in this company are listed.', 'Сначала создайте комплекс в разделе «Жилые комплексы» и отправьте его на одобрение. Затем выберите его здесь, чтобы привязать объект. В списке только ваши опубликованные комплексы этой компании.', 'สร้างโครงการในหน้าโครงการและรออนุมัติก่อน จากนั้นเลือกที่นี่เพื่อเชื่อมยูนิต รายการแสดงเฉพาะโครงการที่คุณเผยแพร่ในบริษัทนี้')}</p>
    {complexes.isLoading && <p role="status">{text('Loading complexes…', 'Загружаем комплексы…', 'กำลังโหลดโครงการ…')}</p>}
    {complexes.error && <div role="alert"><p>{text('Complex choices could not be loaded. The current link is unchanged.', 'Не удалось загрузить комплексы. Текущая привязка сохранена.', 'โหลดตัวเลือกโครงการไม่ได้ การเชื่อมโยงปัจจุบันยังคงเดิม')}</p><Button type="button" variant="outline" onClick={() => void complexes.refetch()}>{text('Retry', 'Повторить', 'ลองอีกครั้ง')}</Button></div>}
    {!complexes.error && complexes.hasNextPage && <Button type="button" variant="outline" disabled={complexes.isFetchingNextPage} onClick={() => void complexes.fetchNextPage()}>{text('Load more complexes', 'Загрузить ещё комплексы', 'โหลดโครงการเพิ่มเติม')}</Button>}
  </div>;
}
