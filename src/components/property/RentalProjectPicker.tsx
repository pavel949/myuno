import type { Language } from '@/i18n';
import { Building2, Check } from 'lucide-react';
import type { PropertyProject } from '@/hooks/usePropertyQuickFilters';
import { complexMediaUrl } from '@/lib/real-estate/complexMedia';
import { cn } from '@/lib/utils';
import { pickLang } from '@/lib/i18n/pickLang';

/** Display real catalogue records only. Selection filters properties by canonical project ID. */
export function RentalProjectPicker({ projects, selectedId, onSelect, language }: {
  projects: PropertyProject[]; selectedId: string | null; onSelect: (id: string | null) => void; language: Language;
}) {
  const text = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  if (!projects.length && !selectedId) return null;
  return <section className="rental-project-picker space-y-3 py-4" aria-label={text('Выберите комплекс', 'Choose a community', 'เลือกโครงการ')}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-h3 font-display">{text('Выберите комплекс', 'Choose a community', 'เลือกโครงการ')}</h2>
        <p className="text-body-sm text-muted-foreground">{text('Виллы и квартиры в одном месте. Даты и остальные условия поиска сохраняются.', 'Explore homes in one community. Your dates and other filters stay selected.', 'เลือกที่พักในโครงการเดียวกัน โดยเก็บวันที่และตัวกรองอื่นไว้')}</p></div>
      <button type="button" className="min-h-11 px-3 text-body-sm underline underline-offset-4" aria-pressed={!selectedId} onClick={() => onSelect(null)}>{text('Все комплексы', 'All communities', 'ทุกโครงการ')}</button>
    </div>
    <div className="rental-project-picker__rail" role="group" aria-label={text('Комплексы', 'Communities', 'โครงการ')}>
      {projects.map(project => {
        const selected = selectedId === project.id;
        const name = language === 'ru' ? project.nameRu : project.nameEn;
        const image = complexMediaUrl(project.coverImage);
        return <button key={project.id} type="button" aria-pressed={selected}
          onClick={() => onSelect(selected ? null : project.id)}
          onFocus={event => event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })}
          className={cn('rental-project-picker__card border bg-card text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary', selected ? 'border-primary ring-2 ring-primary' : 'border-border')}>
          <div className="rental-project-picker__image bg-muted flex items-center justify-center">
            {image ? <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" onError={event => { event.currentTarget.style.display = 'none'; }} /> : <Building2 aria-hidden="true" className="h-8 w-8 text-muted-foreground" />}
          </div>
          <span className="flex items-center justify-between gap-2 p-3 text-body-sm font-medium"><span>{name}</span>{selected && <Check aria-hidden="true" className="h-4 w-4 shrink-0" />}</span>
        </button>;
      })}
    </div>
    {selectedId && !projects.some(project => project.id === selectedId) && <p role="status" className="text-body-sm text-muted-foreground">{text('Применён фильтр комплекса из ссылки. Нажмите «Все комплексы», чтобы убрать его.', 'A community filter from your link is applied. Select All communities to remove it.', 'ใช้ตัวกรองโครงการจากลิงก์แล้ว เลือกทุกโครงการเพื่อล้าง')}</p>}
  </section>;
}
