import { useState } from 'react';
import { useBuyerProjectUnits } from '@/hooks/useBuyerProjectUnits';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { Button } from '@/components/ui/button';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { BuyerRequestForm } from './BuyerRequestForm';
export function BuyerProjectUnits({ projectId, plansOnly = false }: { projectId: string; plansOnly?: boolean }) {
  const { data, isLoading, isError } = useBuyerProjectUnits(projectId);
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const [unitId, setUnitId] = useState<string>();
  if (isLoading) return <p role="status">{t('Загрузка…', 'Loading…', 'กำลังโหลด…')}</p>;
  if (isError) return <p role="alert">{t('Не удалось проверить наличие.', 'Availability could not be checked.', 'ไม่สามารถตรวจสอบสถานะได้')}</p>;
  if (!data?.length) return <p>{t('Наличие пока не подтверждено. Запросите информацию у команды.', 'Availability is not confirmed yet. Please ask the team.', 'ยังไม่ยืนยันสถานะ โปรดสอบถามทีมงาน')}</p>;
  const labels = { available: t('Доступно', 'Available', 'ว่าง'), reserved: t('Зарезервировано', 'Reserved', 'จองแล้ว'), sold: t('Продано', 'Sold', 'ขายแล้ว'), unavailable: t('Недоступно', 'Unavailable', 'ไม่พร้อมขาย'), unknown: t('Уточняется', 'Unknown', 'รอยืนยัน') };
  return <div className="space-y-4">
    <p>{Object.entries(labels).map(([status, label]) => `${label}: ${data.filter(u => u.availability === status).length}`).join(' · ')}</p>
    <p className="text-sm text-muted-foreground">{t('Цены и наличие требуют подтверждения команды.', 'Prices and availability require confirmation by the team.', 'ราคาและสถานะต้องได้รับการยืนยันจากทีมงาน')}</p>
    {plansOnly && !data.some(unit => unit.floor_plan_url) && <p>{t('Планировки пока не опубликованы.', 'Floor plans are not published yet.', 'ยังไม่มีแปลนห้องเผยแพร่')}</p>}
    {data.filter(unit => !plansOnly || unit.floor_plan_url).map(unit => <article key={unit.id} className="border p-4 space-y-2">
      <p className="font-medium">{unit.unit_code || unit.id} · {unit.unit_type}</p><p>{labels[unit.availability]}</p>
      <p>{unit.area_sqm != null ? `${unit.area_sqm} m²` : '—'} · {unit.price != null && unit.price > 0 && unit.currency ? new Intl.NumberFormat(language, { style: 'currency', currency: unit.currency }).format(unit.price) : t('Цена по запросу', 'Price on request', 'สอบถามราคา')}</p>
      {unit.floor_plan_url && <a href={unit.floor_plan_url} target="_blank" rel="noopener noreferrer">{t('Планировка', 'Floor plan', 'แปลนห้อง')}</a>}
      <Button variant="outline" onClick={() => setUnitId(unit.id)}>{t('Запросить информацию', 'Request information', 'สอบถามข้อมูล')}</Button>
    </article>)}
    <ResponsiveModal open={!!unitId} onOpenChange={open => { if (!open) setUnitId(undefined); }} title={t('Запрос по объекту', 'Unit enquiry', 'สอบถามยูนิต')}>
      {unitId && <BuyerRequestForm key={unitId} projectId={projectId} unitId={unitId} />}
    </ResponsiveModal>
  </div>;
}
