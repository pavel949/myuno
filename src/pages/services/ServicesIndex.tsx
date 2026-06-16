import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { MessageCircle, Wrench, Zap, ChevronRight } from "lucide-react";
import { MiniAppLayout } from "@/components/miniapp/MiniAppLayout";
import { EmptyState } from "@/components/uno/EmptyState";
import { useServiceFunctions, type LocalizedServiceFunction } from "@/hooks/useServiceFunctions";
import { ServiceFunctionCard } from "@/components/services";
import { CrossSellSection } from "@/components/crosssell";
import { SERVICE_CATEGORIES, type ServiceCategory } from "@/lib/config/homeServiceFunctions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePersonaFilter } from "@/hooks/usePersonaFilter";

/**
 * URL-slug → SERVICE_CATEGORIES.id normaliser.
 *
 * The catalog SSOT (`src/lib/catalog/taxonomy.ts`) routes 9 "info" services
 * to `/services?category=<slug>`, but SERVICE_CATEGORIES uses underscores +
 * different keys. Without this mapping every deep link from Discover landed
 * on "all services" and looked broken. Keep new aliases here.
 */
const CATEGORY_ALIAS: Record<string, ServiceCategory> = {
  laundry: 'cleaning',
  'pest-control': 'pest_control',
  pest_control: 'pest_control',
  'ac-repair': 'ac',
  gardening: 'garden',
  locksmith: 'security',
  storage: 'moving',
};

/**
 * Bilingual one-liner shown above the grid when the user lands on a
 * category-deep-linked page from Discover. Covers the 9 "info" categories
 * that don't have a per-service booking flow today.
 */
const CATEGORY_INTRO: Record<string, { titleRu: string; titleEn: string; descRu: string; descEn: string }> = {
  laundry:        { titleRu: 'Прачечная с доставкой', titleEn: 'Laundry & dry-cleaning',
                    descRu: 'Опишите задачу — координатор найдёт проверенную прачечную и привезёт чистое.',
                    descEn: 'Tell us what you need — our coordinator picks a vetted laundry and delivers.' },
  pest_control:   { titleRu: 'Дезинсекция',           titleEn: 'Pest control',
                    descRu: 'Опишите проблему — пришлём специалиста с сертификатом в течение 24 ч.',
                    descEn: 'Describe the pest — we send a certified specialist within 24 h.' },
  handyman:       { titleRu: 'Мастер на час',         titleEn: 'Handyman',
                    descRu: 'Опишите, что нужно сделать — мастер с инструментами приедет в течение 2 ч.',
                    descEn: 'Describe the task — a handyman with tools shows up within 2 hours.' },
  plumbing:       { titleRu: 'Сантехника',            titleEn: 'Plumbing',
                    descRu: 'Опишите проблему — фотофиксация, смета до выезда, работа в день обращения.',
                    descEn: 'Describe the issue — photo quote up front, work the same day.' },
  electrical:     { titleRu: 'Электрика',             titleEn: 'Electrical',
                    descRu: 'Опишите задачу — лицензированный электрик с протоколом безопасности.',
                    descEn: 'Describe the job — licensed electrician with safety protocol.' },
  ac:             { titleRu: 'Кондиционеры',          titleEn: 'Air conditioning',
                    descRu: 'Чистка, дозаправка фреона, ремонт — фикс-ставки, без сюрпризов.',
                    descEn: 'Cleaning, refrigerant top-up, repair — fixed rates, no surprises.' },
  security:       { titleRu: 'Замки',                 titleEn: 'Locksmith',
                    descRu: 'Срочно — на месте за час. Плановая замена — в удобное время.',
                    descEn: 'Urgent — on-site within an hour. Planned change — at your time.' },
  garden:         { titleRu: 'Сад и двор',            titleEn: 'Garden & yard',
                    descRu: 'Стрижка, полив, уход за пальмами и орхидеями. Разово или по графику.',
                    descEn: 'Trimming, watering, palm and orchid care. One-off or scheduled.' },
  moving:         { titleRu: 'Переезд и хранение',    titleEn: 'Moving & storage',
                    descRu: 'Локальные переезды и склад для вещей. Опишите объём — пришлём смету.',
                    descEn: 'Local moves and storage. Tell us the volume — we send a quote.' },
};

const COORDINATOR_WHATSAPP = '66922407355';

function whatsappLink(categoryLabel: string, language: 'ru' | 'en'): string {
  const summary = language === 'ru'
    ? `Здравствуйте! Нужна помощь по категории «${categoryLabel}». Опишу детали в ответ.`
    : `Hello! I need help with "${categoryLabel}". I'll describe the details in a follow-up.`;
  return `https://wa.me/${COORDINATOR_WHATSAPP}?text=${encodeURIComponent(summary)}`;
}

export default function ServicesIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isRu = language === 'ru';

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { functions, categories, popular, search, getFunctionsByCategory } = useServiceFunctions();
  const { applyFilter: applyPersonaFilter } = usePersonaFilter();

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (!categoryParam) {
      setSelectedCategory('all');
      return;
    }
    // Normalise legacy/discovery slugs to the canonical SERVICE_CATEGORIES id.
    const aliased = CATEGORY_ALIAS[categoryParam] ?? categoryParam;
    setSelectedCategory(aliased);
  }, [searchParams]);

  const introCategoryKey = selectedCategory === 'all' ? null : selectedCategory;
  const intro = introCategoryKey ? CATEGORY_INTRO[introCategoryKey] : null;
  const introCategoryLabel = intro ? (isRu ? intro.titleRu : intro.titleEn) : '';

  const filteredFunctions = useMemo(() => {
    let result: LocalizedServiceFunction[] = [];

    if (selectedCategory === 'all') {
      result = functions;
    } else {
      result = getFunctionsByCategory(selectedCategory as ServiceCategory);
    }

    if (searchQuery.trim()) {
      result = search(searchQuery);
    }

    result = applyPersonaFilter(result, (fn) => {
      const raw = fn as unknown as Record<string, unknown>;
      const tags = (raw.tags as string[] | null) ?? [];
      return [...tags, fn.category, fn.id].filter(Boolean) as string[];
    });

    return result;
  }, [functions, selectedCategory, searchQuery, getFunctionsByCategory, search, applyPersonaFilter]);

  const categoryRibbon = useMemo(() => [
    { id: 'all', labelEn: 'All Services', labelRu: 'Все услуги' },
    ...categories.map(c => {
      const sc = SERVICE_CATEGORIES.find(sc => sc.id === c.id);
      return {
        id: c.id as string,
        labelEn: sc?.nameEn || c.name,
        labelRu: sc?.nameRu || c.name,
      };
    }),
  ], [categories]);

  const handleFunctionClick = (fn: LocalizedServiceFunction) => {
    navigate(`/services/order/${fn.id}`);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', cat);
    }
    setSearchParams(newParams);
  };

  // Subtitle honestly describes what this hub covers: home/property maintenance
  // trades sourced from `HOME_SERVICE_FUNCTIONS` (homeServiceFunctions.ts).
  // The platform-wide "All apps" experience lives in AppDrawer (BottomBar
  // LayoutGrid icon / Home "Все приложения" button), not here.
  const subtitle = isRu
    ? `Сантехника · электрика · уборка · ремонт · сад. ${filteredFunctions.length} услуг.`
    : `Plumbing · electrical · cleaning · repair · garden. ${filteredFunctions.length} services.`;

  return (
    <MiniAppLayout
      title={isRu ? 'Услуги для дома' : 'Home services'}
      subtitle={subtitle}
      fallbackPath="/discover"
      categories={categoryRibbon}
      selectedCategory={selectedCategory}
      onCategoryChange={handleCategoryChange}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={isRu ? 'Поиск услуг…' : 'Search services…'}
      showHero={false}
      showFilter={false}
    >
      {/* Popular Section */}
      {selectedCategory === 'all' && !searchQuery && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">
              {isRu ? 'Популярные услуги' : 'Popular Services'}
            </h3>
          </div>
          <div className="grid gap-2">
            {popular.slice(0, 4).map((fn) => (
              <ServiceFunctionCard
                key={fn.id}
                fn={fn}
                onClick={() => handleFunctionClick(fn)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Category Header when filtered */}
      {selectedCategory !== 'all' && (
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {categories.find(c => c.id === selectedCategory)?.icon}
          </span>
          <h3 className="font-semibold">
            {categories.find(c => c.id === selectedCategory)?.name}
          </h3>
          <Badge variant="secondary" className="ml-auto">
            {filteredFunctions.length} {isRu ? 'услуг' : 'services'}
          </Badge>
        </div>
      )}

      {/* Category landing card — shown for the 9 "info" categories that
          arrive here from /discover deep links. Gives users a path even
          when the per-service grid is empty: describe the task via
          WhatsApp coordinator, response within 2 hours. */}
      {intro && (
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
          <div className="space-y-1">
            <h4 className="font-display text-[17px] font-semibold tracking-tight text-foreground">
              {isRu ? intro.titleRu : intro.titleEn}
            </h4>
            <p className="text-[13px] text-muted-foreground leading-snug">
              {isRu ? intro.descRu : intro.descEn}
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto" size="lg">
            <a
              href={whatsappLink(introCategoryLabel, language as 'ru' | 'en')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              {isRu ? 'Описать задачу в WhatsApp' : 'Describe the task on WhatsApp'}
            </a>
          </Button>
        </div>
      )}

      {filteredFunctions.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={isRu ? 'Услуги не найдены' : 'No services found'}
        />
      ) : (
        <>
          <div className="grid gap-3">
            {(selectedCategory === 'all' && !searchQuery ? filteredFunctions.slice(0, 10) : filteredFunctions).map((fn) => (
              <ServiceFunctionCard
                key={fn.id}
                fn={fn}
                onClick={() => handleFunctionClick(fn)}
              />
            ))}
          </div>

          {selectedCategory === 'all' && !searchQuery && (
            <div className="space-y-6">
              {categories.map(category => {
                const categoryFunctions = getFunctionsByCategory(category.id);
                if (categoryFunctions.length === 0) return null;

                return (
                  <div key={category.id}>
                    <button
                      onClick={() => handleCategoryChange(category.id)}
                      className="flex items-center gap-2 mb-3 w-full"
                    >
                      <span className="text-lg">{category.icon}</span>
                      <h3 className="font-semibold text-sm">{category.name}</h3>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {categoryFunctions.length}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                    </button>
                    <div className="grid gap-2">
                      {categoryFunctions.slice(0, 3).map((fn) => (
                        <ServiceFunctionCard
                          key={fn.id}
                          fn={fn}
                          onClick={() => handleFunctionClick(fn)}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <CrossSellSection currentVertical="services" />
    </MiniAppLayout>
  );
}
