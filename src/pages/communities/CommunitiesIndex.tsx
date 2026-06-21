/**
 * CommunitiesIndex — directory of churches, temples, mosques, clubs,
 * consulates and meetups. SSOT cluster: LIVE.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEOHead } from '@/components/seo';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Users, Landmark, Building2, Calendar, Search, MapPin, ExternalLink,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCommunities, type CommunityKind, type Community } from '@/hooks/useCommunities';
import { pickLocalized } from '@/lib/i18n/pickLocalized';
import { countryFlag } from '@/lib/utils/countryFlag';

const KIND_ICON: Record<CommunityKind, React.ComponentType<{ className?: string }>> = {
  religion: Landmark,
  club: Users,
  consulate: Building2,
  meetup: Calendar,
};

const KIND_LABEL: Record<CommunityKind, Record<'ru' | 'en' | 'th', string>> = {
  religion:  { ru: 'Религия',     en: 'Religion',    th: 'ศาสนา' },
  club:      { ru: 'Клубы',       en: 'Clubs',       th: 'ชมรม' },
  consulate: { ru: 'Консульства', en: 'Consulates',  th: 'สถานกงสุล' },
  meetup:    { ru: 'Встречи',     en: 'Meetups',     th: 'พบปะ' },
};

const STR = {
  title:    { ru: 'Найти своих',                         en: 'Find your community',                    th: 'หาชุมชนของคุณ' },
  subtitle: { ru: 'Церкви, храмы, экспат-клубы, консульства и встречи на Пхукете и в Таиланде.',
              en: 'Churches, temples, expat clubs, consulates and meetups across Phuket and Thailand.',
              th: 'โบสถ์ วัด ชมรมชาวต่างชาติ สถานกงสุล และกิจกรรมในภูเก็ตและทั่วประเทศไทย' },
  pill:     { ru: 'Сообщества',  en: 'Communities',  th: 'ชุมชน' },
  searchPh: { ru: 'Поиск по названию…', en: 'Search by name…', th: 'ค้นหาตามชื่อ…' },
  all:      { ru: 'Все',         en: 'All',          th: 'ทั้งหมด' },
  countryAll:{ru: 'Все страны',  en: 'All countries', th: 'ทุกประเทศ' },
  empty:    { ru: 'Ничего не нашли — попробуйте другой фильтр.',
              en: 'Nothing matches. Try clearing a filter.',
              th: 'ไม่พบรายการ — ลองล้างตัวกรอง' },
  loading:  { ru: 'Загружаем…',  en: 'Loading…',     th: 'กำลังโหลด…' },
  details:  { ru: 'Подробнее',   en: 'Details',      th: 'รายละเอียด' },
  source:   { ru: 'Источник: Wikipedia + кураторская подборка myUNO.',
              en: 'Source: Wikipedia + myUNO curated picks.',
              th: 'แหล่งที่มา: Wikipedia + รายการคัดสรรโดย myUNO' },
};

const T = (k: keyof typeof STR, lang: string) => STR[k][(lang as 'ru'|'en'|'th') ?? 'en'] ?? STR[k].en;

export default function CommunitiesIndex() {
  const { language } = useLanguage();
  const [kind, setKind] = useState<CommunityKind | 'all'>('all');
  const [search, setSearch] = useState('');
  const [countryCode, setCountryCode] = useState<string>('all');

  const { data: items = [], isLoading } = useCommunities({
    kind,
    search,
    countryCode: countryCode === 'all' ? undefined : countryCode,
  });

  // Country options derived from consulates we actually have
  const { data: allConsulates = [] } = useCommunities({ kind: 'consulate' });
  const countryOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of allConsulates) {
      if (c.country_code && !map.has(c.country_code)) {
        map.set(c.country_code, pickLocalized(c, language, 'name') || c.country_code);
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [allConsulates, language]);

  return (
    <AppLayout>
      <SEOHead
        title={T('title', language) + ' — myUNO'}
        description={T('subtitle', language)}
      />

      <div className="px-4 md:px-6 lg:px-8 py-6 pb-20 md:pb-8 max-w-[1200px] mx-auto space-y-6">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Users className="w-4 h-4" />
            {T('pill', language)}
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            {T('title', language)}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {T('subtitle', language)}
          </p>
        </div>

        {/* Kind tabs */}
        <Tabs value={kind} onValueChange={(v) => setKind(v as CommunityKind | 'all')}>
          <TabsList className="grid grid-cols-5 w-full max-w-2xl mx-auto">
            <TabsTrigger value="all">{T('all', language)}</TabsTrigger>
            <TabsTrigger value="religion">{KIND_LABEL.religion[language as 'ru'|'en'|'th'] ?? KIND_LABEL.religion.en}</TabsTrigger>
            <TabsTrigger value="club">{KIND_LABEL.club[language as 'ru'|'en'|'th'] ?? KIND_LABEL.club.en}</TabsTrigger>
            <TabsTrigger value="consulate">{KIND_LABEL.consulate[language as 'ru'|'en'|'th'] ?? KIND_LABEL.consulate.en}</TabsTrigger>
            <TabsTrigger value="meetup">{KIND_LABEL.meetup[language as 'ru'|'en'|'th'] ?? KIND_LABEL.meetup.en}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search + filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={T('searchPh', language)}
              className="pl-9"
            />
          </div>

          {(kind === 'all' || kind === 'consulate') && (
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder={T('countryAll', language)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{T('countryAll', language)}</SelectItem>
                {countryOptions.map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    <span className="inline-flex items-center gap-2">
                      <span className="text-base">{countryFlag(code)}</span>
                      {name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <p className="text-center text-muted-foreground py-12">{T('loading', language)}</p>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">{T('empty', language)}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <CommunityCard key={it.id} item={it} lang={language} />
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pt-6">{T('source', language)}</p>
      </div>
    </AppLayout>
  );
}

function CommunityCard({ item, lang }: { item: Community; lang: string }) {
  const Icon = KIND_ICON[item.kind] ?? Users;
  const name = pickLocalized(item, lang, 'name');
  const desc = pickLocalized(item, lang, 'description');
  const location = [item.city, item.province].filter(Boolean).join(', ');

  return (
    <Card className="border-border hover:border-primary/40 transition-colors flex flex-col">
      <CardContent className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-none bg-muted flex items-center justify-center text-lg shrink-0">
            {item.country_code ? countryFlag(item.country_code) : <Icon className="w-5 h-5 text-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-foreground leading-snug">{name}</div>
            {location && (
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {location}
              </div>
            )}
          </div>
        </div>

        {desc && <p className="text-sm text-muted-foreground line-clamp-2">{desc}</p>}

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-[10px]">
            {KIND_LABEL[item.kind][(lang as 'ru'|'en'|'th') ?? 'en'] ?? KIND_LABEL[item.kind].en}
          </Badge>
          {item.consulate_type && (
            <Badge variant="outline" className="text-[10px] capitalize">
              {item.consulate_type.replace('_', ' ')}
            </Badge>
          )}
          {item.religion && (
            <Badge variant="outline" className="text-[10px] capitalize">
              {item.religion.replace('_', ' ')}
            </Badge>
          )}
          {item.language_primary && (
            <Badge variant="outline" className="text-[10px] uppercase">
              {item.language_primary}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 mt-auto">
          <Button asChild size="sm" variant="default" className="flex-1">
            <Link to={`/communities/${item.slug}`}>
              {STR.details[(lang as 'ru'|'en'|'th') ?? 'en'] ?? STR.details.en}
            </Link>
          </Button>
          {(item.lat && item.lng) || item.address ? (
            <Button asChild size="sm" variant="outline" aria-label="Open in maps">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  item.address ? `${name}, ${item.address}` : `${name}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin className="w-4 h-4" />
              </a>
            </Button>
          ) : null}
          {item.website && (
            <Button asChild size="sm" variant="outline" aria-label="Open website">
              <a href={item.website} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
