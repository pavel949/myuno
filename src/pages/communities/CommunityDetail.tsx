/**
 * CommunityDetail — single community page (church, club, consulate, meetup).
 */
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEOHead } from '@/components/seo';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin, Globe, Phone, Mail, MessageCircle, ChevronLeft, ExternalLink, Clock,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCommunityBySlug, type CommunitySchedule } from '@/hooks/useCommunities';
import { pickLocalized } from '@/lib/i18n/pickLocalized';
import { countryFlag } from '@/lib/utils/countryFlag';

const STR = {
  back:    { ru: '← К списку',         en: '← Back',                 th: '← ย้อนกลับ' },
  loading: { ru: 'Загружаем…',          en: 'Loading…',               th: 'กำลังโหลด…' },
  notFound:{ ru: 'Запись не найдена.',  en: 'Not found.',             th: 'ไม่พบ' },
  contact: { ru: 'Контакты',            en: 'Contact',                th: 'ติดต่อ' },
  routes:  { ru: 'Маршрут',             en: 'Directions',             th: 'เส้นทาง' },
  source:  { ru: 'Источник данных',     en: 'Data source',            th: 'แหล่งข้อมูล' },
  schedule:{ ru: 'Расписание служб',    en: 'Service schedule',       th: 'ตารางพิธี' },
};

const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
type DayKey = (typeof DAY_ORDER)[number];

const DAY_LABEL: Record<DayKey, { ru: string; en: string; th: string }> = {
  mon: { ru: 'Пн', en: 'Mon', th: 'จ.' },
  tue: { ru: 'Вт', en: 'Tue', th: 'อ.' },
  wed: { ru: 'Ср', en: 'Wed', th: 'พ.' },
  thu: { ru: 'Чт', en: 'Thu', th: 'พฤ.' },
  fri: { ru: 'Пт', en: 'Fri', th: 'ศ.' },
  sat: { ru: 'Сб', en: 'Sat', th: 'ส.' },
  sun: { ru: 'Вс', en: 'Sun', th: 'อา.' },
};

function scheduleNote(s: CommunitySchedule, lang: 'ru' | 'en' | 'th'): string {
  return (
    s[`notes_${lang}` as 'notes_en'] ||
    s.notes_en || s.notes_ru || s.notes_th || s.notes || ''
  );
}

function hasSchedule(s: CommunitySchedule | null | undefined): s is CommunitySchedule {
  if (!s) return false;
  const hasDay = DAY_ORDER.some((d) => Array.isArray(s[d]) && s[d]!.length > 0);
  return hasDay || Boolean(scheduleNote(s, 'en'));
}

export default function CommunityDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const lang = language as 'ru' | 'en' | 'th';
  const { data: item, isLoading } = useCommunityBySlug(slug);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto p-6">{STR.loading[lang] ?? STR.loading.en}</div>
      </AppLayout>
    );
  }

  if (!item) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto p-6 text-center">
          <p className="text-muted-foreground">{STR.notFound[lang] ?? STR.notFound.en}</p>
          <Button asChild variant="link"><Link to="/communities">{STR.back[lang] ?? STR.back.en}</Link></Button>
        </div>
      </AppLayout>
    );
  }

  const name = pickLocalized(item, lang, 'name');
  const desc = pickLocalized(item, lang, 'description');
  const location = [item.address, item.city, item.province].filter(Boolean).join(', ');
  const mapsQuery = encodeURIComponent(item.address ? `${name}, ${item.address}` : name);

  return (
    <AppLayout>
      <SEOHead title={name + ' — myUNO'} description={desc || name} />

      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/communities">
            <ChevronLeft className="w-4 h-4 mr-1" />
            {STR.back[lang] ?? STR.back.en}
          </Link>
        </Button>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-none bg-muted flex items-center justify-center text-3xl shrink-0">
                {item.country_code ? countryFlag(item.country_code) : '🏛️'}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-display font-bold text-foreground leading-tight">{name}</h1>
                {location && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-start gap-1">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{location}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="capitalize">{item.kind}</Badge>
              {item.consulate_type && <Badge variant="outline" className="capitalize">{item.consulate_type.replace('_', ' ')}</Badge>}
              {item.religion && <Badge variant="outline" className="capitalize">{item.religion.replace('_', ' ')}</Badge>}
              {item.language_primary && <Badge variant="outline" className="uppercase">{item.language_primary}</Badge>}
              {item.tags?.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
            </div>

            {desc && <p className="text-base text-foreground/90">{desc}</p>}

            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <Button asChild>
                <a href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`} target="_blank" rel="noopener noreferrer">
                  <MapPin className="w-4 h-4 mr-2" />
                  {STR.routes[lang] ?? STR.routes.en}
                </a>
              </Button>
              {item.website && (
                <Button asChild variant="outline">
                  <a href={item.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="w-4 h-4 mr-2" />
                    Website
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {hasSchedule(item.schedule) && (
          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                {STR.schedule[lang] ?? STR.schedule.en}
              </h2>
              {DAY_ORDER.some((d) => item.schedule![d]?.length) && (
                <div className="space-y-1.5 text-sm">
                  {DAY_ORDER.filter((d) => item.schedule![d]?.length).map((d) => (
                    <div key={d} className="flex items-baseline gap-3">
                      <span className="w-10 shrink-0 font-medium text-muted-foreground">
                        {DAY_LABEL[d][lang] ?? DAY_LABEL[d].en}
                      </span>
                      <span className="text-foreground">{item.schedule![d]!.join(', ')}</span>
                    </div>
                  ))}
                </div>
              )}
              {scheduleNote(item.schedule, lang) && (
                <p className="text-sm text-muted-foreground">{scheduleNote(item.schedule, lang)}</p>
              )}
            </CardContent>
          </Card>
        )}

        {(item.phone || item.email || item.whatsapp || item.telegram) && (
          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="text-lg font-semibold">{STR.contact[lang] ?? STR.contact.en}</h2>
              <div className="space-y-2 text-sm">
                {item.phone && <ContactRow icon={<Phone className="w-4 h-4" />} label={item.phone} href={`tel:${item.phone}`} />}
                {item.email && <ContactRow icon={<Mail className="w-4 h-4" />} label={item.email} href={`mailto:${item.email}`} />}
                {item.whatsapp && <ContactRow icon={<MessageCircle className="w-4 h-4" />} label={`WhatsApp: ${item.whatsapp}`} href={`https://wa.me/${item.whatsapp.replace(/\D/g, '')}`} external />}
                {item.telegram && <ContactRow icon={<MessageCircle className="w-4 h-4" />} label={`Telegram: ${item.telegram}`} href={`https://t.me/${item.telegram.replace(/^@/, '')}`} external />}
              </div>
            </CardContent>
          </Card>
        )}

        {item.source_url && item.source_url.startsWith('http') && (
          <p className="text-xs text-muted-foreground">
            {STR.source[lang] ?? STR.source.en}:&nbsp;
            <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">
              {new URL(item.source_url).hostname}
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        )}
      </div>
    </AppLayout>
  );
}

function ContactRow({ icon, label, href, external }: { icon: React.ReactNode; label: string; href: string; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span>{label}</span>
    </a>
  );
}
