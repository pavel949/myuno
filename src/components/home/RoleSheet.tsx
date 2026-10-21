import React from 'react';
import { ChevronUp, ChevronDown, Plus, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { PERSONA_OPTIONS_PRIMARY, PERSONA_OPTIONS_LIFESTYLE } from '@/hooks/useUserPersonas';
import { ROLE_META } from '@/lib/roleBlend';
import { pickLang } from '@/lib/i18n/pickLang';

const PREFERENCE_COPY_TH: Record<UserPersona, { label: string; description: string }> = {
  tourist: { label: 'ท่องเที่ยวภูเก็ต', description: 'การเดินทาง ที่พัก และกิจกรรม' },
  resident: { label: 'อาศัยในภูเก็ต', description: 'วีซ่า ที่อยู่อาศัย และบริการประจำวัน' },
  property_owner: { label: 'เจ้าของอสังหาริมทรัพย์', description: 'จัดการอสังหาริมทรัพย์และรายได้' },
  investor: { label: 'นักลงทุน', description: 'โอกาสลงทุน พันธมิตร และเงินทุน' },
  real_estate_developer: { label: 'ผู้พัฒนาอสังหาริมทรัพย์', description: 'โครงการ การจอง และการขาย' },
  local_services_provider: { label: 'ธุรกิจท้องถิ่น', description: 'หน้าร้าน การจอง และการรับเงิน' },
  family: { label: 'ครอบครัว', description: 'โรงเรียน คลินิก และการเดินทางของครอบครัว' },
  couple: { label: 'คู่รัก', description: 'ร้านอาหาร ทริปพักผ่อน และช่วงเวลาดี ๆ' },
  nightlife: { label: 'เที่ยวกลางคืน', description: 'คลับ บาร์ และรถรับส่งยามดึก' },
  active: { label: 'กีฬาและกิจกรรม', description: 'การออกกำลังกาย อุปกรณ์ และสถานที่เล่นกีฬา' },
  business: { label: 'ธุรกิจ', description: 'บริษัท บัญชี และสัญญา' },
  nomad: { label: 'ทำงานพร้อมเดินทาง', description: 'พื้นที่ทำงานร่วม ซิมการ์ด และที่พักระยะยาว' },
  pet_owner: { label: 'สัตว์เลี้ยง', description: 'สัตวแพทย์ ที่พักรับสัตว์เลี้ยง และการเดินทาง' },
  relocation: { label: 'ย้ายถิ่นฐาน', description: 'วีซ่า การหาที่อยู่อาศัย และเอกสาร' },
};

interface RoleSheetProps {
  open: boolean;
  personas: UserPersona[];
  onClose: () => void;
  onToggle: (p: UserPersona) => void;
  onReorder: (reordered: UserPersona[]) => void;
  /** Loading or saving preferences; closing the sheet remains available. */
  isBusy?: boolean;
  /** Do not offer mutations when the current preferences are unavailable. */
  hasError?: boolean;
}

export function RoleSheet({
  open,
  personas,
  onClose,
  onToggle,
  onReorder,
  isBusy = false,
  hasError = false,
}: RoleSheetProps) {
  const { language } = useLanguage();
  const mutationsDisabled = isBusy || hasError;
  const controlClass = 'inline-flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-35';

  const preferenceLabel = (persona: UserPersona) => {
    return pickLang(language, {
      ru: persona === 'pet_owner' ? 'Питомцы' : ROLE_META[persona].labelRu,
      en: persona === 'pet_owner' ? 'Pets' : ROLE_META[persona].label,
      th: PREFERENCE_COPY_TH[persona].label,
    });
  };

  const moveUp = (idx: number) => {
    if (mutationsDisabled || idx === 0) return;
    const next = [...personas];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onReorder(next);
  };

  const moveDown = (idx: number) => {
    if (mutationsDisabled || idx === personas.length - 1) return;
    const next = [...personas];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onReorder(next);
  };

  const renderAvailableGroup = (options: UserPersona[], title: string) => {
    const available = options.filter(p => !personas.includes(p) && ROLE_META[p]);
    if (available.length === 0) return null;

    return (
      <section className="space-y-2" aria-label={title}>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="divide-y divide-border/60 border-y border-border/60">
          {available.map(p => {
            const meta = ROLE_META[p];
            const label = preferenceLabel(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => onToggle(p)}
                disabled={mutationsDisabled}
                aria-label={`${pickLang(language, { ru: 'Добавить', en: 'Add', th: 'เพิ่ม' })}: ${label}`}
                className="flex min-h-14 w-full items-center gap-3 px-2 py-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-medium text-foreground">{label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {pickLang(language, { ru: meta.descRu, en: meta.descEn, th: PREFERENCE_COPY_TH[p].description })}
                  </span>
                </span>
                <Plus className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        closeLabel={pickLang(language, { ru: 'Закрыть', en: 'Close', th: 'ปิด' })}
        className="mx-auto flex h-[88dvh] max-h-[52rem] max-w-xl flex-col gap-0 overflow-hidden rounded-none bg-background p-0"
      >
        <SheetHeader className="shrink-0 border-b border-border px-4 py-4 text-left sm:px-5">
          <SheetTitle className="pr-10 font-display text-2xl font-semibold tracking-tight">
            {pickLang(language, { ru: 'Настроить главную', en: 'Customize home', th: 'ปรับแต่งหน้าหลัก' })}
          </SheetTitle>
          <SheetDescription className="text-xs leading-relaxed sm:text-sm">
            {pickLang(language, {
              ru: 'Выберите темы и приоритеты на главной. Права доступа к аккаунту и рабочим разделам не меняются.',
              en: 'Choose topics and priorities for your home page. Account and workspace permissions stay the same.',
              th: 'เลือกหัวข้อและลำดับความสำคัญสำหรับหน้าหลัก สิทธิ์เข้าถึงบัญชีและพื้นที่ทำงานจะไม่เปลี่ยนแปลง',
            })}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {hasError ? (
            <p role="alert" className="mb-4 border-l-2 border-destructive bg-muted px-3 py-2 text-sm text-foreground">
              {pickLang(language, {
                ru: 'Настройки недоступны. Закройте окно и попробуйте позже.',
                en: 'Preferences are unavailable. Close this panel and try again later.',
                th: 'ไม่สามารถโหลดการตั้งค่าได้ โปรดปิดหน้าต่างนี้แล้วลองอีกครั้งภายหลัง',
              })}
            </p>
          ) : isBusy ? (
            <p role="status" className="mb-4 text-sm text-muted-foreground">
              {pickLang(language, { ru: 'Обновляем настройки…', en: 'Updating preferences…', th: 'กำลังอัปเดตการตั้งค่า…' })}
            </p>
          ) : null}

          <div className="space-y-5" aria-busy={isBusy}>
            {personas.length > 0 ? (
              <section aria-label={pickLang(language, { ru: 'Выбранные темы', en: 'Selected topics', th: 'หัวข้อที่เลือก' })}>
                <h3 className="text-sm font-semibold text-foreground">
                  {pickLang(language, { ru: 'Выбрано', en: 'Selected', th: 'เลือกแล้ว' })} · {personas.length}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {pickLang(language, { ru: 'Поднимите важные темы выше.', en: 'Move the topics that matter most to the top.', th: 'เลื่อนหัวข้อที่สำคัญที่สุดไว้ด้านบน' })}
                </p>
                <ol className="mt-2 divide-y divide-border/60 border-y border-border/60">
                  {personas.map((p, i) => {
                    if (!ROLE_META[p]) return null;
                    const label = preferenceLabel(p);
                    return (
                      <li key={p} className="flex min-h-14 items-center gap-2 py-1.5">
                        <span className="w-5 shrink-0 text-center text-xs tabular-nums text-muted-foreground" aria-hidden="true">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="block break-words text-sm font-medium text-foreground">{label}</span>
                          {i === 0 && (
                            <span className="mt-0.5 block text-xs font-medium text-[hsl(var(--brand-orange))]">
                              {pickLang(language, { ru: 'Первый приоритет', en: 'Top priority', th: 'สำคัญที่สุด' })}
                            </span>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center">
                          <button
                            type="button"
                            onClick={() => moveUp(i)}
                            disabled={mutationsDisabled || i === 0}
                            aria-label={`${pickLang(language, { ru: 'Выше', en: 'Move up', th: 'เลื่อนขึ้น' })}: ${label}`}
                            className={controlClass}
                          >
                            <ChevronUp className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveDown(i)}
                            disabled={mutationsDisabled || i === personas.length - 1}
                            aria-label={`${pickLang(language, { ru: 'Ниже', en: 'Move down', th: 'เลื่อนลง' })}: ${label}`}
                            className={controlClass}
                          >
                            <ChevronDown className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggle(p)}
                            disabled={mutationsDisabled}
                            aria-label={`${pickLang(language, { ru: 'Убрать', en: 'Remove', th: 'นำออก' })}: ${label}`}
                            className={cn(controlClass, 'hover:text-destructive')}
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ) : !isBusy && !hasError ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {pickLang(language, { ru: 'Темы пока не выбраны. Добавьте то, что вам интересно.', en: 'No topics selected yet. Add what interests you.', th: 'ยังไม่ได้เลือกหัวข้อ เพิ่มหัวข้อที่คุณสนใจ' })}
              </p>
            ) : null}

            {renderAvailableGroup(PERSONA_OPTIONS_PRIMARY, pickLang(language, { ru: 'Контекст', en: 'Contexts', th: 'บริบทการใช้ชีวิต' }))}
            {renderAvailableGroup(PERSONA_OPTIONS_LIFESTYLE, pickLang(language, { ru: 'Интересы и образ жизни', en: 'Lifestyle interests', th: 'ความสนใจและไลฟ์สไตล์' }))}
          </div>
        </div>

        <div className="shrink-0 border-t border-border bg-background px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            {pickLang(language, {
              ru: 'Изменения применяются сразу. Порядок отображения сохраняется на этом устройстве.',
              en: 'Changes apply immediately. Display order is saved on this device.',
              th: 'การเปลี่ยนแปลงมีผลทันที ลำดับการแสดงผลจะบันทึกไว้บนอุปกรณ์นี้',
            })}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-full bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {pickLang(language, { ru: 'Готово', en: 'Done', th: 'เสร็จสิ้น' })}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
