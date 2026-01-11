import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Scale, FileText, Calculator, Building2, Briefcase, Globe, Shield, Users, Star, Clock, MapPin, CheckCircle2, Languages, Award } from "lucide-react";
import { MiniAppLayout, ItemCard, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from "@/components/miniapp";
import { FilterValues, legalFilterConfig } from "@/components/filters";
import { Badge } from "@/components/ui/badge";

const categories: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'legal', labelEn: 'Legal', labelRu: 'Юридические', icon: '⚖️' },
  { id: 'accounting', labelEn: 'Accounting', labelRu: 'Бухгалтерия', icon: '📊' },
  { id: 'tax', labelEn: 'Tax', labelRu: 'Налоги', icon: '💰' },
  { id: 'visa', labelEn: 'Visa', labelRu: 'Визы', icon: '🛂' },
  { id: 'business', labelEn: 'Business', labelRu: 'Бизнес', icon: '🏢' },
  { id: 'insurance', labelEn: 'Insurance', labelRu: 'Страхование', icon: '🛡️' },
  { id: 'hr', labelEn: 'HR', labelRu: 'Кадры', icon: '👥' },
];

const providers = [
  {
    id: "legal-1",
    name: "Phuket Legal Partners",
    category: "legal",
    rating: 4.9,
    reviews: 87,
    experience: { en: "15 years in Phuket", ru: "15 лет на Пхукете" },
    price: 5000,
    priceUnit: { en: "/consultation", ru: "/консультация" },
    location: { en: "Patong", ru: "Патонг" },
    available: true,
    verified: true,
    languages: ["EN", "TH", "RU"],
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=200",
    services: { 
      en: ["Company registration", "Real estate", "Visa matters", "Employment law"],
      ru: ["Регистрация компании", "Недвижимость", "Визовые вопросы", "Трудовое право"]
    },
  },
  {
    id: "legal-2",
    name: "Thai Tax Experts",
    category: "tax",
    rating: 4.8,
    reviews: 156,
    experience: { en: "CPA team", ru: "Команда CPA" },
    price: 3000,
    priceUnit: { en: "/hour", ru: "/час" },
    location: { en: "Phuket Town", ru: "Пхукет Таун" },
    available: true,
    verified: true,
    languages: ["EN", "TH", "RU", "CN"],
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=200",
    services: {
      en: ["Tax planning", "Tax filing", "International taxes"],
      ru: ["Налоговое планирование", "Подача деклараций", "Международные налоги"]
    },
  },
  {
    id: "legal-3",
    name: "Siam Accounting",
    category: "accounting",
    rating: 4.7,
    reviews: 203,
    experience: { en: "10+ years experience", ru: "10+ лет опыта" },
    price: 8000,
    priceUnit: { en: "/month", ru: "/месяц" },
    location: { en: "Rawai", ru: "Раваи" },
    available: true,
    verified: true,
    languages: ["EN", "TH"],
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200",
    services: {
      en: ["Bookkeeping", "Financial statements", "Payroll"],
      ru: ["Ведение бухгалтерии", "Финансовая отчётность", "Расчёт зарплат"]
    },
  },
  {
    id: "legal-4",
    name: "Visa Solutions Thailand",
    category: "visa",
    rating: 4.9,
    reviews: 312,
    experience: { en: "Visa specialists", ru: "Специалисты по визам" },
    price: 15000,
    priceUnit: { en: "/application", ru: "/заявка" },
    location: { en: "Kata", ru: "Ката" },
    available: true,
    verified: true,
    languages: ["EN", "RU", "DE", "FR"],
    image: "https://images.unsplash.com/photo-1569974507005-6dc61f97fb5c?w=200",
    services: {
      en: ["Work permits", "Business visa", "Retirement visa", "Elite visa"],
      ru: ["Рабочие визы", "Бизнес-визы", "Retirement виза", "Elite виза"]
    },
  },
  {
    id: "legal-5",
    name: "Business Setup Phuket",
    category: "business",
    rating: 4.6,
    reviews: 145,
    experience: { en: "500+ companies", ru: "500+ компаний" },
    price: 35000,
    priceUnit: { en: "/registration", ru: "/регистрация" },
    location: { en: "All Phuket", ru: "Весь Пхукет" },
    available: true,
    verified: true,
    languages: ["EN", "RU", "TH"],
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    services: {
      en: ["Ltd registration", "BOI licenses", "Virtual office"],
      ru: ["Регистрация ООО", "BOI лицензии", "Юридический адрес"]
    },
  },
  {
    id: "legal-6",
    name: "Phuket Insurance Broker",
    category: "insurance",
    rating: 4.7,
    reviews: 89,
    experience: { en: "All insurance types", ru: "Все виды страхования" },
    price: 0,
    priceUnit: { en: "free quote", ru: "бесплатно" },
    location: { en: "Online", ru: "Онлайн" },
    available: true,
    verified: true,
    languages: ["EN", "RU", "TH", "DE"],
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=200",
    services: {
      en: ["Health insurance", "Business insurance", "Auto", "Property"],
      ru: ["Медстраховка", "Страхование бизнеса", "Авто", "Недвижимость"]
    },
  },
];

export default function LegalServicesIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(filterValues).forEach(([key, value]) => {
      if (key === 'priceLevel' && value) count++;
      else if (Array.isArray(value)) count += value.length;
      else if (value) count++;
    });
    return count;
  }, [filterValues]);

  const filteredProviders = useMemo(() => {
    return providers.filter((provider) => {
      const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.services[language === 'ru' ? 'ru' : 'en'].some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || provider.category === selectedCategory;
      
      // Category filter
      const cats = filterValues.category as string[] | undefined;
      if (cats?.length && !cats.includes(provider.category)) return false;
      
      // Languages filter
      const langs = filterValues.languages as string[] | undefined;
      if (langs?.length) {
        const provLangs = provider.languages.map(l => l.toLowerCase());
        if (!langs.some(l => provLangs.includes(l.substring(0, 2)))) return false;
      }
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, filterValues, language]);

  const quickItems: QuickGridItem[] = [
    { icon: '⚖️', label: language === 'ru' ? 'Юрист' : 'Legal', onClick: () => setSelectedCategory('legal') },
    { icon: '🛂', label: language === 'ru' ? 'Визы' : 'Visa', onClick: () => setSelectedCategory('visa') },
    { icon: '💰', label: language === 'ru' ? 'Налоги' : 'Tax', onClick: () => setSelectedCategory('tax') },
    { icon: '🏢', label: language === 'ru' ? 'Бизнес' : 'Business', onClick: () => setSelectedCategory('business') },
  ];

  return (
    <MiniAppLayout
      title={language === "ru" ? "Бизнес-услуги" : "Business Services"}
      subtitle={language === "ru" ? `${filteredProviders.length} компаний` : `${filteredProviders.length} providers`}
      heroIcon={Award}
      heroTitle={language === "ru" ? "Юридические и бизнес-услуги" : "Legal & Business Services"}
      heroSubtitle={language === "ru" ? "Проверенные специалисты для вашего бизнеса в Таиланде" : "Verified professionals for your business in Thailand"}
      heroGradientFrom="from-blue-600/20"
      heroGradientVia="via-indigo-600/20"
      heroGradientTo="to-purple-700/20"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === "ru" ? "Найти услугу или компанию..." : "Find service or company..."}
      categories={categories}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      filterConfig={legalFilterConfig}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      filterActiveCount={activeFilterCount}
      isEmpty={filteredProviders.length === 0}
      emptyIcon={Scale}
      emptyText={language === "ru" ? "Компании не найдены" : "No providers found"}
    >
      <MiniAppQuickGrid items={quickItems} columns={4} className="mb-6" />

      <div className="space-y-4">
        {filteredProviders.map((provider) => (
          <ItemCard
            key={provider.id}
            image={provider.image}
            title={provider.name}
            subtitle={language === 'ru' ? provider.experience.ru : provider.experience.en}
            rating={provider.rating}
            reviewCount={provider.reviews}
            location={language === 'ru' ? provider.location.ru : provider.location.en}
            price={provider.price > 0 ? provider.price : undefined}
            priceUnit={language === 'ru' ? provider.priceUnit.ru : provider.priceUnit.en}
            currency={provider.price > 0 ? "฿" : ""}
            isVerified={provider.verified}
            badge={!provider.available 
              ? { text: language === 'ru' ? 'Занят' : 'Busy', className: 'bg-muted text-muted-foreground' }
              : undefined
            }
            tags={(language === 'ru' ? provider.services.ru : provider.services.en).slice(0, 2)}
            onClick={() => navigate(`/legal/provider/${provider.id}`)}
          />
        ))}
      </div>
    </MiniAppLayout>
  );
}