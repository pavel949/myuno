import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles, Sailboat, Heart, Stethoscope, GraduationCap, FileText, Flower2, Wrench, Bike, Home, Car, Waves, ShieldAlert, BarChart3, UtensilsCrossed, Zap, Building2, PaintBucket, type LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { cn } from '@/lib/utils';
import useEmblaCarousel from 'embla-carousel-react';

interface QuickSolution {
  id: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  labelRu: string;
  labelEn: string;
  path: string;
  personas: string[];
}

const SOLUTIONS: QuickSolution[] = [
  // Tourist
  { id: 'yacht', icon: Sailboat, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', labelRu: 'Закат на яхте', labelEn: 'Sunset yacht cruise', path: '/yachts', personas: ['tourist'] },
  { id: 'massage', icon: Heart, iconBg: 'bg-pink-100', iconColor: 'text-pink-600', labelRu: 'Тайский массаж рядом', labelEn: 'Thai massage nearby', path: '/beauty', personas: ['tourist'] },
  { id: 'islands', icon: Waves, iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600', labelRu: 'Экскурсия на острова', labelEn: 'Island tour', path: '/experiences', personas: ['tourist'] },
  { id: 'transfer-t', icon: Car, iconBg: 'bg-sky-100', iconColor: 'text-sky-600', labelRu: 'Трансфер из аэропорта', labelEn: 'Airport transfer', path: '/transport/airport-transfer', personas: ['tourist'] },

  // Resident
  { id: 'pediatr', icon: Stethoscope, iconBg: 'bg-rose-100', iconColor: 'text-rose-600', labelRu: 'Педиатр на дом', labelEn: 'Pediatrician house call', path: '/medical', personas: ['resident'] },
  { id: 'camp', icon: GraduationCap, iconBg: 'bg-violet-100', iconColor: 'text-violet-600', labelRu: 'Английский лагерь для ребёнка', labelEn: 'English camp for kids', path: '/education', personas: ['resident'] },
  { id: 'visa', icon: FileText, iconBg: 'bg-slate-100', iconColor: 'text-slate-600', labelRu: 'Продлить визу', labelEn: 'Extend visa', path: '/legal', personas: ['resident'] },
  { id: 'plumber-r', icon: Wrench, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', labelRu: 'Вызвать сантехника', labelEn: 'Call a plumber', path: '/services', personas: ['resident'] },

  // Investor
  { id: 'risks', icon: ShieldAlert, iconBg: 'bg-orange-100', iconColor: 'text-orange-600', labelRu: 'Риски новостроек', labelEn: 'Off-plan risks report', path: '/invest', personas: ['investor'] },
  { id: 'roi', icon: BarChart3, iconBg: 'bg-purple-100', iconColor: 'text-purple-600', labelRu: 'Сравнить доходность', labelEn: 'Compare ROI', path: '/offplan', personas: ['investor'] },
  { id: 'legal-check', icon: FileText, iconBg: 'bg-slate-100', iconColor: 'text-slate-600', labelRu: 'Юридическая проверка', labelEn: 'Legal check', path: '/legal', personas: ['investor'] },
  { id: 'rental-mgmt', icon: Building2, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', labelRu: 'Управление арендой', labelEn: 'Rental management', path: '/owner', personas: ['investor'] },

  // Owner
  { id: 'cleaning', icon: Sparkles, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', labelRu: 'Клининг сегодня', labelEn: 'Cleaning today', path: '/cleaning', personas: ['property_owner'] },
  { id: 'pool', icon: Waves, iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600', labelRu: 'Обслуживание бассейна', labelEn: 'Pool maintenance', path: '/services', personas: ['property_owner'] },
  { id: 'pm', icon: Building2, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', labelRu: 'Управляющая компания', labelEn: 'Property management', path: '/owner', personas: ['property_owner'] },
  { id: 'renovation', icon: PaintBucket, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', labelRu: 'Ремонт и отделка', labelEn: 'Renovation', path: '/services', personas: ['property_owner'] },

  // Universal
  { id: 'flowers', icon: Flower2, iconBg: 'bg-pink-100', iconColor: 'text-pink-600', labelRu: 'Заказать цветы', labelEn: 'Order flowers', path: '/flowers', personas: ['all'] },
  { id: 'bike', icon: Bike, iconBg: 'bg-green-100', iconColor: 'text-green-600', labelRu: 'Арендовать байк', labelEn: 'Rent a scooter', path: '/transport', personas: ['all'] },
  { id: 'housing', icon: Home, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', labelRu: 'Найти жильё на месяц', labelEn: 'Find monthly rental', path: '/property', personas: ['all'] },
  { id: 'restaurant', icon: UtensilsCrossed, iconBg: 'bg-orange-100', iconColor: 'text-orange-600', labelRu: 'Забронировать ресторан', labelEn: 'Book a restaurant', path: '/restaurants', personas: ['all'] },
  { id: 'electrician', icon: Zap, iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600', labelRu: 'Вызвать электрика', labelEn: 'Call an electrician', path: '/services', personas: ['all'] },
];

export function QuickSolutionsGallery() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { personas } = useUserPersonas();
  const isRu = language === 'ru';

  const [emblaRef] = useEmblaCarousel(
    { loop: false, align: 'start', skipSnaps: false, slidesToScroll: 2 }
  );

  const activePersona = useMemo(() => {
    if (personas.includes('property_owner')) return 'property_owner';
    if (personas.includes('investor')) return 'investor';
    if (personas.includes('resident')) return 'resident';
    return 'tourist';
  }, [personas]);

  const solutions = useMemo(() => {
    const personaItems = SOLUTIONS.filter(s => s.personas.includes(activePersona));
    const universalItems = SOLUTIONS.filter(s => s.personas.includes('all'));
    const seen = new Set<string>();
    const result: QuickSolution[] = [];
    for (const item of [...personaItems, ...universalItems]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        result.push(item);
      }
      if (result.length >= 10) break;
    }
    return result;
  }, [activePersona]);

  return (
    <section className="space-y-4">
      {/* Header — same style as ProductSection */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground">
          {isRu ? 'Чем помочь?' : 'How can we help?'}
        </h2>
      </div>

      {/* Carousel — same structure as ProductSection */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3">
          {solutions.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => navigate(s.path)}
                className="shrink-0 min-w-0 basis-[170px] lg:basis-[200px] group text-left"
              >
                {/* Icon area — same aspect ratio as product image */}
                <div className={cn(
                  "aspect-square rounded-2xl flex items-center justify-center mb-3 transition-transform duration-200 group-active:scale-[0.97]",
                  s.iconBg
                )}>
                  <Icon className={cn("w-12 h-12", s.iconColor)} strokeWidth={1.5} />
                </div>
                {/* Label */}
                <p className="text-sm font-medium text-foreground leading-tight line-clamp-2 mb-1">
                  {isRu ? s.labelRu : s.labelEn}
                </p>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span className="text-xs">{isRu ? 'Подробнее' : 'Learn more'}</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
