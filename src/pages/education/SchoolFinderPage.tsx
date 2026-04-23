/**
 * SchoolFinderPage — Filter schools by age/language/budget/district
 * Bible cluster: EDUCATION → lead-gen for education providers
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Search, MapPin, Globe, Users, DollarSign, Filter, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SEOHead } from '@/components/seo';
import { cn } from '@/lib/utils';

interface School {
  id: string;
  nameEn: string;
  nameRu: string;
  type: 'international' | 'bilingual' | 'thai' | 'russian';
  ageFrom: number;
  ageTo: number;
  languages: string[];
  district: string;
  annualFeeTHB: number;
  rating: number;
  students: number;
  curriculum: string;
  features: string[];
  featuresRu: string[];
}

const SCHOOLS: School[] = [
  {
    id: '1', nameEn: 'British International School Phuket', nameRu: 'Британская международная школа Пхукет',
    type: 'international', ageFrom: 2, ageTo: 18, languages: ['English'], district: 'Kathu',
    annualFeeTHB: 450000, rating: 4.8, students: 600, curriculum: 'British (IGCSE/A-Levels)',
    features: ['Swimming pool', 'Sports academy', 'IB programme available'],
    featuresRu: ['Бассейн', 'Спортивная академия', 'Программа IB'],
  },
  {
    id: '2', nameEn: 'HeadStart International School', nameRu: 'HeadStart международная школа',
    type: 'international', ageFrom: 2, ageTo: 18, languages: ['English', 'Thai'], district: 'Chalong',
    annualFeeTHB: 280000, rating: 4.5, students: 450, curriculum: 'British (Cambridge)',
    features: ['Small class sizes', 'After-school clubs', 'Bus service'],
    featuresRu: ['Маленькие классы', 'Кружки после уроков', 'Школьный автобус'],
  },
  {
    id: '3', nameEn: 'Kajonkiet International School', nameRu: 'Kajonkiet международная школа',
    type: 'bilingual', ageFrom: 3, ageTo: 18, languages: ['English', 'Thai'], district: 'Phuket Town',
    annualFeeTHB: 180000, rating: 4.3, students: 800, curriculum: 'Thai + English',
    features: ['Largest campus', 'Science labs', 'Thai culture programme'],
    featuresRu: ['Самый большой кампус', 'Научные лаборатории', 'Программа тайской культуры'],
  },
  {
    id: '4', nameEn: 'UWC Thailand', nameRu: 'UWC Таиланд',
    type: 'international', ageFrom: 2, ageTo: 18, languages: ['English'], district: 'Thalang',
    annualFeeTHB: 850000, rating: 4.9, students: 400, curriculum: 'IB (PYP/MYP/DP)',
    features: ['IB World School', 'Scholarships available', 'Eco-campus'],
    featuresRu: ['Школа IB мирового уровня', 'Стипендии', 'Эко-кампус'],
  },
  {
    id: '5', nameEn: 'Phuket Russian School', nameRu: 'Русская школа Пхукет',
    type: 'russian', ageFrom: 6, ageTo: 17, languages: ['Russian', 'English', 'Thai'], district: 'Rawai',
    annualFeeTHB: 120000, rating: 4.2, students: 150, curriculum: 'Russian Federal Standard',
    features: ['Russian curriculum', 'GIA/EGE preparation', 'Small classes'],
    featuresRu: ['Российская программа', 'Подготовка к ОГЭ/ЕГЭ', 'Маленькие классы'],
  },
  {
    id: '6', nameEn: 'QSI International School', nameRu: 'QSI международная школа',
    type: 'international', ageFrom: 3, ageTo: 18, languages: ['English'], district: 'Chalong',
    annualFeeTHB: 350000, rating: 4.6, students: 250, curriculum: 'American',
    features: ['US accredited', 'AP courses', 'Community service'],
    featuresRu: ['Аккредитация США', 'Курсы AP', 'Общественная работа'],
  },
];

const AGE_RANGES = [
  { id: 'all', labelEn: 'Any age', labelRu: 'Любой возраст' },
  { id: '2-5', labelEn: '2–5 (Pre-K)', labelRu: '2–5 (Детсад)' },
  { id: '6-11', labelEn: '6–11 (Primary)', labelRu: '6–11 (Начальная)' },
  { id: '12-18', labelEn: '12–18 (Secondary)', labelRu: '12–18 (Средняя)' },
];

const LANGUAGE_OPTIONS = [
  { id: 'all', labelEn: 'Any language', labelRu: 'Любой язык' },
  { id: 'English', labelEn: 'English', labelRu: 'Английский' },
  { id: 'Russian', labelEn: 'Russian', labelRu: 'Русский' },
  { id: 'Thai', labelEn: 'Thai', labelRu: 'Тайский' },
];

const BUDGET_OPTIONS = [
  { id: 'all', labelEn: 'Any budget', labelRu: 'Любой бюджет' },
  { id: 'low', labelEn: 'Under ฿200K/year', labelRu: 'До ฿200К/год' },
  { id: 'mid', labelEn: '฿200K–500K/year', labelRu: '฿200К–500К/год' },
  { id: 'high', labelEn: 'Over ฿500K/year', labelRu: 'Более ฿500К/год' },
];

export default function SchoolFinderPage() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const [ageRange, setAgeRange] = useState('all');
  const [lang, setLang] = useState('all');
  const [budget, setBudget] = useState('all');

  const filtered = useMemo(() => {
    return SCHOOLS.filter(school => {
      // Age filter
      if (ageRange !== 'all') {
        const [min, max] = ageRange.split('-').map(Number);
        if (school.ageTo < min || school.ageFrom > max) return false;
      }
      // Language filter
      if (lang !== 'all' && !school.languages.includes(lang)) return false;
      // Budget filter
      if (budget === 'low' && school.annualFeeTHB >= 200000) return false;
      if (budget === 'mid' && (school.annualFeeTHB < 200000 || school.annualFeeTHB > 500000)) return false;
      if (budget === 'high' && school.annualFeeTHB <= 500000) return false;
      return true;
    });
  }, [ageRange, lang, budget]);

  const typeLabels: Record<string, { en: string; ru: string }> = {
    international: { en: 'International', ru: 'Международная' },
    bilingual: { en: 'Bilingual', ru: 'Двуязычная' },
    thai: { en: 'Thai', ru: 'Тайская' },
    russian: { en: 'Russian', ru: 'Русская' },
  };

  return (
    <AppLayout showHeader={false} showBottomNav>
      <SEOHead
        title={isRu ? 'Подбор школы на Пхукете' : 'School Finder Phuket'}
        description={isRu ? 'Найдите идеальную школу: фильтр по возрасту, языку и бюджету' : 'Find the perfect school: filter by age, language and budget'}
      />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <BackButton fallbackPath="/education" />
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold truncate">{isRu ? 'Подбор школы' : 'School Finder'}</h1>
            <p className="text-xs text-muted-foreground">
              {filtered.length} {isRu ? 'школ' : 'schools'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-3 gap-2">
          <Select value={ageRange} onValueChange={setAgeRange}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AGE_RANGES.map(a => (
                <SelectItem key={a.id} value={a.id}>{isRu ? a.labelRu : a.labelEn}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map(l => (
                <SelectItem key={l.id} value={l.id}>{isRu ? l.labelRu : l.labelEn}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={budget} onValueChange={setBudget}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BUDGET_OPTIONS.map(b => (
                <SelectItem key={b.id} value={b.id}>{isRu ? b.labelRu : b.labelEn}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">{isRu ? 'Школы не найдены' : 'No schools found'}</p>
            <p className="text-sm text-muted-foreground">{isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting filters'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(school => (
              <Card key={school.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {isRu ? typeLabels[school.type].ru : typeLabels[school.type].en}
                        </Badge>
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                          <Star className="w-3 h-3 fill-warning text-warning" />
                          {school.rating}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm leading-tight">
                        {isRu ? school.nameRu : school.nameEn}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{school.district}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />{isRu ? `${school.ageFrom}–${school.ageTo} лет` : `Ages ${school.ageFrom}–${school.ageTo}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />{school.languages.join(', ')}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {(isRu ? school.featuresRu : school.features).slice(0, 3).map((f, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] font-normal">{f}</Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <div>
                      <p className="text-[10px] text-muted-foreground">{isRu ? 'от / год' : 'from / year'}</p>
                      <p className="text-sm font-bold">{formatPrice(school.annualFeeTHB)}</p>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate('/education')}>
                      {isRu ? 'Подробнее' : 'Details'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
