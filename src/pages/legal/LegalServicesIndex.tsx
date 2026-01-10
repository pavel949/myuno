import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Scale,
  FileText,
  Calculator,
  Building2,
  Briefcase,
  Globe,
  Shield,
  Users,
  Star,
  Clock,
  MapPin,
  CheckCircle2,
  Languages,
  Award
} from "lucide-react";
import { triggerRipple } from "@/hooks/useRipple";

const LegalServicesIndex = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: "legal", icon: Scale, name: language === "ru" ? "Юридические" : "Legal", color: "from-blue-600 to-indigo-600" },
    { id: "accounting", icon: Calculator, name: language === "ru" ? "Бухгалтерия" : "Accounting", color: "from-emerald-500 to-green-600" },
    { id: "audit", icon: FileText, name: language === "ru" ? "Аудит" : "Audit", color: "from-purple-500 to-violet-600" },
    { id: "tax", icon: Building2, name: language === "ru" ? "Налоги" : "Tax", color: "from-amber-500 to-orange-600" },
    { id: "business", icon: Briefcase, name: language === "ru" ? "Бизнес" : "Business", color: "from-slate-600 to-zinc-700" },
    { id: "visa", icon: Globe, name: language === "ru" ? "Визы" : "Visa", color: "from-cyan-500 to-blue-500" },
    { id: "insurance", icon: Shield, name: language === "ru" ? "Страхование" : "Insurance", color: "from-rose-500 to-red-600" },
    { id: "hr", icon: Users, name: language === "ru" ? "HR/Кадры" : "HR", color: "from-pink-500 to-fuchsia-600" },
  ];

  const providers = [
    {
      id: "legal-1",
      name: language === "ru" ? "Phuket Legal Partners" : "Phuket Legal Partners",
      category: "legal",
      rating: 4.9,
      reviews: 87,
      experience: language === "ru" ? "15 лет на Пхукете" : "15 years in Phuket",
      price: 5000,
      currency: "฿",
      priceUnit: language === "ru" ? "/консультация" : "/consultation",
      location: language === "ru" ? "Патонг" : "Patong",
      available: true,
      verified: true,
      languages: ["EN", "TH", "RU"],
      image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=200&h=200&fit=crop",
      services: language === "ru" 
        ? ["Регистрация компании", "Недвижимость", "Визовые вопросы", "Трудовое право"]
        : ["Company registration", "Real estate", "Visa matters", "Employment law"],
    },
    {
      id: "legal-2",
      name: language === "ru" ? "Thai Tax Experts" : "Thai Tax Experts",
      category: "tax",
      rating: 4.8,
      reviews: 156,
      experience: language === "ru" ? "Команда CPA" : "CPA team",
      price: 3000,
      currency: "฿",
      priceUnit: language === "ru" ? "/час" : "/hour",
      location: language === "ru" ? "Пхукет Таун" : "Phuket Town",
      available: true,
      verified: true,
      languages: ["EN", "TH", "RU", "CN"],
      image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=200&h=200&fit=crop",
      services: language === "ru"
        ? ["Налоговое планирование", "Подача деклараций", "Международные налоги"]
        : ["Tax planning", "Tax filing", "International taxes"],
    },
    {
      id: "legal-3",
      name: language === "ru" ? "Siam Accounting" : "Siam Accounting",
      category: "accounting",
      rating: 4.7,
      reviews: 203,
      experience: language === "ru" ? "10+ лет опыта" : "10+ years experience",
      price: 8000,
      currency: "฿",
      priceUnit: language === "ru" ? "/месяц" : "/month",
      location: language === "ru" ? "Раваи" : "Rawai",
      available: true,
      verified: true,
      languages: ["EN", "TH"],
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=200&fit=crop",
      services: language === "ru"
        ? ["Ведение бухгалтерии", "Финансовая отчётность", "Расчёт зарплат"]
        : ["Bookkeeping", "Financial statements", "Payroll"],
    },
    {
      id: "legal-4",
      name: language === "ru" ? "Visa Solutions Thailand" : "Visa Solutions Thailand",
      category: "visa",
      rating: 4.9,
      reviews: 312,
      experience: language === "ru" ? "Специалисты по визам" : "Visa specialists",
      price: 15000,
      currency: "฿",
      priceUnit: language === "ru" ? "/заявка" : "/application",
      location: language === "ru" ? "Ката" : "Kata",
      available: true,
      verified: true,
      languages: ["EN", "RU", "DE", "FR"],
      image: "https://images.unsplash.com/photo-1569974507005-6dc61f97fb5c?w=200&h=200&fit=crop",
      services: language === "ru"
        ? ["Рабочие визы", "Бизнес-визы", "Retirement виза", "Elite виза"]
        : ["Work permits", "Business visa", "Retirement visa", "Elite visa"],
    },
    {
      id: "legal-5",
      name: language === "ru" ? "Audit Pro Thailand" : "Audit Pro Thailand",
      category: "audit",
      rating: 4.8,
      reviews: 67,
      experience: language === "ru" ? "Big 4 опыт" : "Big 4 experience",
      price: 25000,
      currency: "฿",
      priceUnit: language === "ru" ? "/проект" : "/project",
      location: language === "ru" ? "Пхукет Таун" : "Phuket Town",
      available: false,
      verified: true,
      languages: ["EN", "TH"],
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&h=200&fit=crop",
      services: language === "ru"
        ? ["Финансовый аудит", "Due diligence", "Внутренний контроль"]
        : ["Financial audit", "Due diligence", "Internal controls"],
    },
    {
      id: "legal-6",
      name: language === "ru" ? "Business Setup Phuket" : "Business Setup Phuket",
      category: "business",
      rating: 4.6,
      reviews: 145,
      experience: language === "ru" ? "500+ компаний" : "500+ companies",
      price: 35000,
      currency: "฿",
      priceUnit: language === "ru" ? "/регистрация" : "/registration",
      location: language === "ru" ? "Весь Пхукет" : "All Phuket",
      available: true,
      verified: true,
      languages: ["EN", "RU", "TH"],
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      services: language === "ru"
        ? ["Регистрация ООО", "BOI лицензии", "Юридический адрес"]
        : ["Ltd registration", "BOI licenses", "Virtual office"],
    },
    {
      id: "legal-7",
      name: language === "ru" ? "Phuket Insurance Broker" : "Phuket Insurance Broker",
      category: "insurance",
      rating: 4.7,
      reviews: 89,
      experience: language === "ru" ? "Все виды страхования" : "All insurance types",
      price: 0,
      currency: "฿",
      priceUnit: language === "ru" ? "бесплатно" : "free quote",
      location: language === "ru" ? "Онлайн" : "Online",
      available: true,
      verified: true,
      languages: ["EN", "RU", "TH", "DE"],
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=200&h=200&fit=crop",
      services: language === "ru"
        ? ["Медстраховка", "Страхование бизнеса", "Авто", "Недвижимость"]
        : ["Health insurance", "Business insurance", "Auto", "Property"],
    },
    {
      id: "legal-8",
      name: language === "ru" ? "HR Thailand Solutions" : "HR Thailand Solutions",
      category: "hr",
      rating: 4.5,
      reviews: 56,
      experience: language === "ru" ? "Кадровый аутсорсинг" : "HR outsourcing",
      price: 5000,
      currency: "฿",
      priceUnit: language === "ru" ? "/сотрудник" : "/employee",
      location: language === "ru" ? "Пхукет Таун" : "Phuket Town",
      available: true,
      verified: false,
      languages: ["EN", "TH"],
      image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=200&h=200&fit=crop",
      services: language === "ru"
        ? ["Подбор персонала", "Оформление сотрудников", "Кадровый учёт"]
        : ["Recruitment", "Employee onboarding", "HR administration"],
    },
  ];

  const filteredProviders = providers.filter((provider) => {
    const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.services.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || provider.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout title={language === "ru" ? "Бизнес-услуги" : "Business Services"} showBottomNav={false}>
      <div className="p-4 space-y-6 pb-24">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">
                {language === "ru" ? "Профессиональные услуги" : "Professional Services"}
              </span>
            </div>
            <h1 className="text-xl font-bold mb-1">
              {language === "ru" ? "Юридические и бизнес-услуги" : "Legal & Business Services"}
            </h1>
            <p className="text-sm opacity-80">
              {language === "ru" 
                ? "Проверенные специалисты для вашего бизнеса в Таиланде" 
                : "Verified professionals for your business in Thailand"}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder={language === "ru" ? "Найти услугу или компанию..." : "Find service or company..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-xl bg-card border-border"
          />
        </div>

        {/* Categories */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {language === "ru" ? "Категории услуг" : "Service Categories"}
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={(e) => {
                    triggerRipple(e);
                    setSelectedCategory(isSelected ? null : category.id);
                  }}
                  className={`relative overflow-hidden flex flex-col items-center p-3 rounded-xl transition-all active:scale-95 ${
                    isSelected 
                      ? `bg-gradient-to-br ${category.color} text-white shadow-lg` 
                      : "bg-card border border-border hover:border-primary/50"
                  }`}
                >
                  <Icon className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium text-center leading-tight truncate w-full">
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Available Providers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">
              {language === "ru" ? "Компании и специалисты" : "Companies & Specialists"}
            </h2>
            <span className="text-sm text-muted-foreground">
              {filteredProviders.length} {language === "ru" ? "найдено" : "found"}
            </span>
          </div>
          
          <div className="space-y-3">
            {filteredProviders.map((provider) => (
              <div
                key={provider.id}
                onClick={(e) => {
                  triggerRipple(e);
                  navigate(`/legal/provider/${provider.id}`);
                }}
                className="relative overflow-hidden bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-all active:scale-[0.98]"
              >
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <img
                      src={provider.image}
                      alt={provider.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    {provider.available && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-card flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{provider.name}</h3>
                        {provider.verified && (
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{provider.rating}</span>
                        <span>({provider.reviews})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{provider.experience}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{provider.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Languages className="w-3 h-3 text-muted-foreground" />
                        <div className="flex gap-0.5">
                          {provider.languages.slice(0, 3).map((lang) => (
                            <span key={lang} className="text-[10px] bg-muted px-1 rounded">
                              {lang}
                            </span>
                          ))}
                          {provider.languages.length > 3 && (
                            <span className="text-[10px] bg-muted px-1 rounded">
                              +{provider.languages.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {provider.services.slice(0, 2).map((service, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                      {provider.services.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{provider.services.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <Badge variant={provider.available ? "default" : "secondary"}>
                    {provider.available 
                      ? (language === "ru" ? "Доступен" : "Available")
                      : (language === "ru" ? "Занят" : "Busy")
                    }
                  </Badge>
                  <span className="text-lg font-bold text-primary">
                    {provider.price > 0 ? `${provider.currency}${provider.price.toLocaleString()}` : ''}{provider.priceUnit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Info */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold mb-3">
            {language === "ru" ? "Почему мы?" : "Why Choose Us?"}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Shield, text: language === "ru" ? "Проверенные компании" : "Verified companies" },
              { icon: Languages, text: language === "ru" ? "Мультиязычная поддержка" : "Multilingual support" },
              { icon: Award, text: language === "ru" ? "Лицензированные специалисты" : "Licensed professionals" },
              { icon: Globe, text: language === "ru" ? "Опыт работы с иностранцами" : "Expat experience" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default LegalServicesIndex;
