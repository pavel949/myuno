import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { auditLifeMappings, type LifeMappingForAudit } from '@/lib/catalog/lifeMappingQuality';

/** Read-only structural audit. No simulated trust score or no-op moderation actions. */
export function LifeOSQualityTab() {
  const { language } = useLanguage();
  const ru = language === 'ru';
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['lifeos-quality-metrics'],
    queryFn: async () => {
      const rows: LifeMappingForAudit[] = [];
      const pageSize = 500;
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await supabase.from('catalog_life_map')
          .select('id, entity_type, entity_id, life_situation_id, weight, life_situations(code, title_en, title_ru, is_active)')
          .order('id').range(offset, offset + pageSize - 1);
        if (error) throw error;
        const page = (data ?? []) as LifeMappingForAudit[];
        rows.push(...page);
        if (page.length < pageSize) break;
      }
      return auditLifeMappings(rows);
    },
  });
  const labels: Record<string, string> = {
    'missing-situation': ru ? 'Ситуация не найдена' : 'Missing situation',
    'inactive-situation': ru ? 'Ситуация выключена' : 'Inactive situation',
    'missing-entity': ru ? 'Не указано предложение' : 'Missing entity reference',
    'invalid-weight': ru ? 'Вес вне диапазона 0–100' : 'Weight outside 0–100',
    'duplicate-link': ru ? 'Повторяющаяся связь' : 'Duplicate link',
  };
  return <div className="space-y-4">
    <Card><CardHeader><CardTitle>{ru ? 'Проверка связей' : 'Mapping checks'}</CardTitle></CardHeader><CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">{ru ? 'Вес определяет порядок рекомендаций, а не надёжность поставщика. Здесь проверяется структура связей, но не наличие предложения, его актуальность или доступность.' : 'Weight controls recommendation order, not provider trust. These checks cover link structure, not whether an offering exists, is current or is available.'}</p>
      {isLoading ? <p>{ru ? 'Загрузка…' : 'Loading…'}</p> : error ? <div role="alert"><p>{ru ? 'Не удалось проверить связи. Результат неизвестен.' : 'Could not check links. Result unknown.'}</p><Button onClick={() => refetch()}>{ru ? 'Повторить' : 'Retry'}</Button></div> : <>
        <p>{ru ? 'Проверено связей' : 'Links inspected'}: {data?.length ?? 0}</p>
        <p>{ru ? 'Связей с замечаниями' : 'Links with findings'}: {data?.filter(row => row.issues.length).length ?? 0}</p>
        {!data?.length && <p>{ru ? 'Связей пока нет.' : 'No links yet.'}</p>}
        <ul className="space-y-3">{data?.filter(row => row.issues.length).map(row => <li key={row.id} className="border border-border p-3 space-y-2">
          <p>{ru ? row.life_situations?.title_ru : row.life_situations?.title_en}</p>
          <p className="text-xs break-all">{row.entity_type} · {row.entity_id}</p>
          <div className="flex flex-wrap gap-2">{row.issues.map(issue => <Badge key={issue} variant="outline">{labels[issue]}</Badge>)}</div>
        </li>)}</ul>
      </>}
      <p className="text-sm">{ru ? 'Редактировать связи можно на вкладке «Маппинги». Категории и разделы настраиваются отдельно.' : 'Edit links in the Mappings tab. Categories and sections are managed separately.'}</p>
      <Button variant="outline" asChild><Link to="/admin/master-catalog">{ru ? 'Категории и разделы' : 'Categories and sections'}</Link></Button>
    </CardContent></Card>
  </div>;
}
