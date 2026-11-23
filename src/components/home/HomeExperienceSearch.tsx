import { useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { APP_ROUTES } from '@/lib/config/routes';

export function buildExperienceSearchParams(input: { q: string; type: string; maxPrice: string }): URLSearchParams {
  const p = new URLSearchParams();
  const q = input.q.trim().slice(0, 120);
  if (q) p.set('q', q);
  if (input.type === 'tour' || input.type === 'activity') p.set('type', input.type);
  const max = Number(input.maxPrice);
  if (input.maxPrice !== '' && Number.isFinite(max) && max >= 0) p.set('maxPrice', String(Math.round(max)));
  return p;
}

export function HomeExperienceSearch() {
  const { language } = useLanguage();
  const t = (v: LangValues) => pickLang(language, v);
  const navigate = useNavigate();
  const id = useId();
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [maxPrice, setMaxPrice] = useState('');
  function submit(e: FormEvent) {
    e.preventDefault();
    const p = buildExperienceSearchParams({ q, type, maxPrice });
    navigate(`${APP_ROUTES.EXPERIENCES}${p.toString() ? `?${p}` : ''}`);
  }
  return <form className="home-search home-search--homepage" onSubmit={submit} aria-label={t({ ru: 'Поиск впечатлений', en: 'Find experiences', th: 'ค้นหาประสบการณ์' })}>
    <div className="home-search-modes" role="group" aria-label={t({ ru: 'Формат', en: 'Format', th: 'รูปแบบ' })}>
      {(['all', 'tour', 'activity'] as const).map(v => <button key={v} type="button" aria-pressed={type === v} onClick={() => setType(v)}>{v === 'all' ? t({ ru: 'Все', en: 'All', th: 'ทั้งหมด' }) : v === 'tour' ? t({ ru: 'Экскурсии', en: 'Tours', th: 'ทัวร์' }) : t({ ru: 'Активный отдых', en: 'Activities', th: 'กิจกรรม' })}</button>)}
    </div>
    <label className="home-search-location" htmlFor={`${id}-q`}><span className="min-w-0 flex-1"><span className="home-field-label">{t({ ru: 'Что ищете', en: 'What are you looking for', th: 'คุณกำลังมองหาอะไร' })}</span><input id={`${id}-q`} type="search" value={q} maxLength={120} onChange={e => setQ(e.target.value)} placeholder={t({ ru: 'Например, дайвинг', en: 'For example, diving', th: 'เช่น ดำน้ำ' })} /></span></label>
    <label className="home-search-type" htmlFor={`${id}-p`}><span className="home-field-label">{t({ ru: 'Бюджет до, ฿', en: 'Budget up to, ฿', th: 'งบประมาณไม่เกิน ฿' })}</span><input id={`${id}-p`} type="number" min="0" step="100" inputMode="numeric" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder={t({ ru: 'Любой', en: 'Any', th: 'ไม่จำกัด' })} /></label>
    <button type="submit" className="home-search-submit">{t({ ru: 'Найти', en: 'Search', th: 'ค้นหา' })}<ArrowRight size={18} aria-hidden="true" /></button>
  </form>;
}
