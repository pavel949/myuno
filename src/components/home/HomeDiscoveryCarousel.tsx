/**
 * HomeDiscoveryCarousel — mixed horizontal discovery rail after Property Tour.
 * Public items from events, restaurants, home services, experiences (listings).
 */
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ru as ruLocale } from 'date-fns/locale';
import { CalendarDays, Star, MapPin, Sparkles, Compass } from 'lucide-react';
import { SectionHeader } from '@/components/ds/SectionHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useEvents } from '@/hooks/useEvents';
import { useHomeServices } from '@/hooks/useHomeServices';
import { useExperiences } from '@/hooks/useExperiences';
import { Skeleton } from '@/components/ui/skeleton';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

const RAIL_CAP = 14;

type DiscoveryKind = 'event' | 'restaurant' | 'home_service' | 'experience';

interface DiscoveryRailItem {
  kind: DiscoveryKind;
  id: string;
  href: string;
  titleRu: string;
  titleEn: string;
  imageUrl: string;
  badgeRu: string;
  badgeEn: string;
  metaRu?: string;
  metaEn?: string;
}

function formatEventDateLabel(dateStr: string | null, isRu: boolean): string {
  if (!dateStr) return isRu ? 'Регулярно' : 'Recurring';
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return isRu ? 'Сегодня' : 'Today';
    if (isTomorrow(d)) return isRu ? 'Завтра' : 'Tomorrow';
    return format(d, 'd MMM', { locale: isRu ? ruLocale : undefined });
  } catch {
    return dateStr;
  }
}

function byRatingDesc<T extends { rating?: number | null }>(a: T, b: T): number {
  return (b.rating ?? 0) - (a.rating ?? 0);
}

/** Interleave queues in round-robin until cap. */
function mergeRoundRobin(queues: DiscoveryRailItem[][]): DiscoveryRailItem[] {
  const out: DiscoveryRailItem[] = [];
  const maxLen = Math.max(0, ...queues.map(q => q.length));
  for (let i = 0; i < maxLen && out.length < RAIL_CAP; i++) {
    for (const q of queues) {
      if (out.length >= RAIL_CAP) break;
      if (i < q.length) out.push(q[i]);
    }
  }
  return out;
}

function buildRailItemsWithImages(
  events: ReturnType<typeof useEvents>['events'],
  restaurants: ReturnType<typeof useRestaurants>['restaurants'],
  providers: ReturnType<typeof useHomeServices>['providers'],
  experiences: ReturnType<typeof useExperiences>['experiences'],
  now: Date,
  getProviderImage: ReturnType<typeof useHomeServices>['getProviderImage']
): DiscoveryRailItem[] {
  const upcoming = (events || [])
    .filter(e => {
      if (!e.event_date) return true;
      return new Date(e.event_date) >= now;
    })
    .sort((a, b) => {
      const ad = a.event_date ? new Date(a.event_date).getTime() : 0;
      const bd = b.event_date ? new Date(b.event_date).getTime() : 0;
      if (ad !== bd) return ad - bd;
      return (b.rating ?? 0) - (a.rating ?? 0);
    })
    .slice(0, 6);

  const eventItems: DiscoveryRailItem[] = upcoming.map(ev => ({
    kind: 'event' as const,
    id: ev.id,
    href: APP_ROUTES.EVENT_DETAIL(ev.id),
    titleRu: ev.title_ru,
    titleEn: ev.title_en,
    imageUrl: ev.cover_image || ev.images?.[0] || PLACEHOLDER_IMAGES.food,
    badgeRu: 'События',
    badgeEn: 'Events',
    metaRu: formatEventDateLabel(ev.event_date, true),
    metaEn: formatEventDateLabel(ev.event_date, false),
  }));

  const restItems: DiscoveryRailItem[] = [...(restaurants || [])]
    .sort(byRatingDesc)
    .slice(0, 5)
    .map(r => ({
      kind: 'restaurant' as const,
      id: r.id,
      href: APP_ROUTES.RESTAURANT_DETAIL(r.id),
      titleRu: r.name_ru,
      titleEn: r.name_en,
      imageUrl: r.cover_image || r.images?.[0] || PLACEHOLDER_IMAGES.restaurant,
      badgeRu: 'Рестораны',
      badgeEn: 'Restaurants',
      metaRu: r.district ?? undefined,
      metaEn: r.district ?? undefined,
    }));

  const topProviders = [...(providers || [])].sort(byRatingDesc).slice(0, 5);
  const homeItems: DiscoveryRailItem[] = topProviders.map(p => ({
    kind: 'home_service' as const,
    id: p.id,
    href: APP_ROUTES.SERVICE_PROVIDER(p.id),
    titleRu: p.name,
    titleEn: p.name,
    imageUrl: getProviderImage(p),
    badgeRu: 'Сервисы',
    badgeEn: 'Services',
    metaRu: p.rating != null && p.rating > 0 ? p.rating.toFixed(1) : undefined,
    metaEn: p.rating != null && p.rating > 0 ? p.rating.toFixed(1) : undefined,
  }));

  const expItems: DiscoveryRailItem[] = [...(experiences || [])]
    .sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      return (b.rating ?? 0) - (a.rating ?? 0);
    })
    .slice(0, 4)
    .map(ex => ({
      kind: 'experience' as const,
      id: ex.id,
      href: APP_ROUTES.EXPERIENCE_DETAIL(ex.id),
      titleRu: ex.title_ru,
      titleEn: ex.title_en,
      imageUrl: ex.cover_image || ex.images?.[0] || PLACEHOLDER_IMAGES.food,
      badgeRu: 'Приключения',
      badgeEn: 'Experiences',
      metaRu: ex.location_name ?? undefined,
      metaEn: ex.location_name ?? undefined,
    }));

  return mergeRoundRobin([eventItems, restItems, homeItems, expItems]);
}

export function HomeDiscoveryCarousel() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { restaurants = [], isLoading: restaurantsLoading } = useRestaurants({ limit: 10 });
  const { events = [], isLoading: eventsLoading } = useEvents({ limit: 12 });
  const { providers, isLoading: providersLoading, getProviderImage } = useHomeServices({});
  const { experiences = [], isLoading: experiencesLoading } = useExperiences({ limit: 8 });

  const now = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const rail = useMemo(
    () => buildRailItemsWithImages(events, restaurants, providers, experiences, now, getProviderImage),
    [events, restaurants, providers, experiences, now, getProviderImage]
  );

  const sectionLoading =
    restaurantsLoading || eventsLoading || providersLoading || experiencesLoading;

  if (!sectionLoading && rail.length === 0) {
    return null;
  }

  return (
    <section
      className="space-y-3"
      aria-label={isRu ? 'Сейчас в топе на myUNO' : 'Trending on myUNO'}
    >
      <SectionHeader
        icon={Compass}
        title={isRu ? 'Сейчас в топе' : 'Trending on myUNO'}
        subtitle={isRu
          ? 'События, еда, сервисы и приключения — в одной ленте'
          : 'Events, dining, services, and experiences in one place'}
        action={{ label: isRu ? 'Discover' : 'Discover', onClick: () => navigate(APP_ROUTES.DISCOVER) }}
      />

      {sectionLoading && rail.length === 0 ? (
        <div className="flex gap-3 -mx-4 px-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-[168px] w-[148px] rounded-none shrink-0" />
          ))}
        </div>
      ) : (
        <div className="carousel-scroll gap-3 -mx-4 px-4">
          {rail.map(item => {
            const title = isRu ? item.titleRu : item.titleEn;
            const badge = isRu ? item.badgeRu : item.badgeEn;
            const meta = isRu ? item.metaRu : item.metaEn;
            return (
              <button
                key={`${item.kind}-${item.id}`}
                type="button"
                onClick={() => navigate(item.href)}
                aria-label={`${badge}: ${title}${meta ? `, ${meta}` : ''}`}
                className="w-[148px] h-[168px] rounded-none overflow-hidden text-left group transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div className="relative h-[52%] overflow-hidden bg-muted">
                  <img
                    src={item.imageUrl}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-300 "
                    loading="lazy"
                  />
                  <span
                    className={cn(
                      'absolute top-1.5 left-1.5 max-w-[calc(100%-12px)] truncate rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                      'bg-background/90 text-foreground border border-border/60'
                    )}
                  >
                    {badge}
                  </span>
                </div>
                <div className="p-2.5 flex flex-col justify-between h-[48%]">
                  <p className="text-[12px] font-semibold text-foreground line-clamp-2 leading-snug">
                    {title}
                  </p>
                  {meta && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-1 truncate">
                      {item.kind === 'event' ? (
                        <CalendarDays className="w-3 h-3 shrink-0" aria-hidden />
                      ) : item.kind === 'restaurant' ? (
                        <MapPin className="w-3 h-3 shrink-0" aria-hidden />
                      ) : item.kind === 'experience' ? (
                        <Sparkles className="w-3 h-3 shrink-0" aria-hidden />
                      ) : (
                        <Star className="w-3 h-3 shrink-0 text-warning fill-warning" aria-hidden />
                      )}
                      {meta}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
