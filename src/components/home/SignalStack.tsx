import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { ROLE_META, SIGNAL_ROUTE } from '@/lib/roleBlend';
import { useRoleSignals, type RoleSignal } from '@/hooks/useRoleSignals';
import { pickLang } from '@/lib/i18n/pickLang';

const PERSONA_LABEL_TH: Record<UserPersona, string> = {
  tourist: 'ท่องเที่ยวภูเก็ต',
  resident: 'อาศัยในภูเก็ต',
  property_owner: 'เจ้าของอสังหาริมทรัพย์',
  investor: 'นักลงทุน',
  real_estate_developer: 'ผู้พัฒนาอสังหาริมทรัพย์',
  local_services_provider: 'ธุรกิจท้องถิ่น',
  family: 'ครอบครัว',
  couple: 'คู่รัก',
  nightlife: 'เที่ยวกลางคืน',
  active: 'กีฬาและกิจกรรม',
  business: 'ธุรกิจ',
  nomad: 'ทำงานพร้อมเดินทาง',
  pet_owner: 'สัตว์เลี้ยง',
  relocation: 'ย้ายถิ่นฐาน',
};

interface SignalStackProps {
  personas: UserPersona[];
  onRoleSheetOpen: () => void;
}

/** Account facts only. Interest choices never manufacture appointments or status. */
export function SignalStack({ personas }: SignalStackProps) {
  const { language } = useLanguage();
  const { signals, isLoading, hasError, retry, unavailablePersonas = [] } = useRoleSignals(personas);
  const rows = personas.flatMap(persona => {
    const signal = signals[persona];
    return signal?.isLive ? [{ persona, signal }] : [];
  }).slice(0, 4);
  if (personas.length === 0) return null;

  const actionClassName = 'inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary';

  return (
    <section className="px-4 pb-4" aria-label={pickLang(language, { ru: 'Актуальное', en: 'Current updates', th: 'อัปเดตล่าสุด' })}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-foreground">{pickLang(language, { ru: 'Актуальное', en: 'Current updates', th: 'อัปเดตล่าสุด' })}</h2>
        <span className="text-xs text-muted-foreground">{pickLang(language, { ru: 'По выбранным темам', en: 'For selected topics', th: 'สำหรับหัวข้อที่เลือก' })}</span>
      </div>
      {isLoading && rows.length === 0 && unavailablePersonas.length < personas.length && (
        <p role="status" className="py-2 text-sm text-muted-foreground">
          {pickLang(language, { ru: 'Загружаем обновления по выбранным темам…', en: 'Loading updates for selected topics…', th: 'กำลังโหลดอัปเดตสำหรับหัวข้อที่เลือก…' })}
        </p>
      )}
      {hasError && (
        <div role="status" className="mb-2 flex flex-wrap items-center gap-x-3">
          <p className="text-sm text-muted-foreground">{pickLang(language, { ru: 'Часть обновлений по выбранным темам не удалось загрузить.', en: 'Some updates for selected topics could not be loaded.', th: 'ไม่สามารถโหลดอัปเดตบางรายการสำหรับหัวข้อที่เลือกได้' })}</p>
          <button type="button" onClick={retry} className={actionClassName}>
            <RefreshCw className="h-4 w-4" aria-hidden />{pickLang(language, { ru: 'Повторить', en: 'Retry', th: 'ลองอีกครั้ง' })}
          </button>
        </div>
      )}
      {unavailablePersonas.includes('local_services_provider') && (
        <div role="status" className="mb-2 flex flex-wrap items-center gap-x-3">
          <p className="text-sm text-muted-foreground">{pickLang(language, { ru: 'Сводка бизнеса здесь пока недоступна.', en: 'The business summary is not available here yet.', th: 'ยังไม่สามารถแสดงสรุปธุรกิจในหน้านี้ได้' })}</p>
          <Link to="/vendor" className={actionClassName}>
            {pickLang(language, { ru: 'Открыть рабочий кабинет', en: 'Open business workspace', th: 'เปิดพื้นที่ทำงานธุรกิจ' })}<ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      )}
      {!isLoading && !hasError && unavailablePersonas.length === 0 && rows.length === 0 && (
        <div className="flex flex-wrap items-center gap-x-3">
          <p className="text-sm text-muted-foreground">{pickLang(language, { ru: 'По выбранным темам пока нет обновлений.', en: 'No updates for selected topics yet.', th: 'ยังไม่มีอัปเดตสำหรับหัวข้อที่เลือก' })}</p>
          <Link to="/me" className={actionClassName}>
            {pickLang(language, { ru: 'Открыть «Моё»', en: 'Open My account', th: 'เปิดบัญชีของฉัน' })}<ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      )}
      <div className="space-y-2">
        {rows.map(({ persona, signal }) => <SignalCard key={persona} persona={persona} signal={signal} language={language} />)}
      </div>
    </section>
  );
}

function SignalCard({ persona, signal, language }: { persona: UserPersona; signal: RoleSignal; language: Language }) {
  const meta = ROLE_META[persona];
  if (!meta) return null;
  return (
    <Link to={signal.href ?? SIGNAL_ROUTE[persona]} className="block min-w-0 border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>{pickLang(language, { ru: meta.labelRu, en: meta.label, th: PERSONA_LABEL_TH[persona] })}</span>
        <span className="break-words">{pickLang(language, { ru: signal.leadRu, en: signal.lead, th: signal.leadTh ?? signal.lead })}</span>
        {signal.state === 'warn' && <span className="font-medium text-foreground">{pickLang(language, { ru: 'Требует внимания', en: 'Needs attention', th: 'ต้องตรวจสอบ' })}</span>}
      </div>
      <div className="mt-2 flex items-start justify-between gap-3">
        <p className="min-w-0 break-words font-display text-xl font-semibold leading-tight text-foreground">{pickLang(language, { ru: signal.valueRu ?? signal.value, en: signal.value, th: signal.valueTh ?? signal.value })}</p>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </div>
      <p className="mt-1 break-words text-sm leading-relaxed text-muted-foreground">{pickLang(language, { ru: signal.tailRu, en: signal.tail, th: signal.tailTh ?? signal.tail })}</p>
    </Link>
  );
}
