import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import useEmblaCarousel from 'embla-carousel-react';

// Image imports — unified editorial style
import yachtImg from '@/assets/solutions/yacht.jpg';
import massageImg from '@/assets/solutions/massage.jpg';
import islandsImg from '@/assets/solutions/islands.jpg';
import transferImg from '@/assets/solutions/transfer.jpg';
import pediatrImg from '@/assets/solutions/pediatr.jpg';
import campImg from '@/assets/solutions/camp.jpg';
import visaImg from '@/assets/solutions/visa.jpg';
import plumberImg from '@/assets/solutions/plumber.jpg';
import flowersImg from '@/assets/solutions/flowers.jpg';
import bikeImg from '@/assets/solutions/bike.jpg';
import housingImg from '@/assets/solutions/housing.jpg';
import restaurantImg from '@/assets/solutions/restaurant.jpg';
import electricianImg from '@/assets/solutions/electrician.jpg';
import risksImg from '@/assets/solutions/risks.jpg';
import roiImg from '@/assets/solutions/roi.jpg';
import cleaningImg from '@/assets/solutions/cleaning.jpg';
import poolImg from '@/assets/solutions/pool.jpg';
import pmImg from '@/assets/solutions/pm.jpg';
import renovationImg from '@/assets/solutions/renovation.jpg';
import legalImg from '@/assets/solutions/legal.jpg';
import rentalMgmtImg from '@/assets/solutions/rental-mgmt.jpg';
import propertyTourImg from '@/assets/solutions/property-tour.jpg';

interface QuickSolution {
  id: string;
  image: string;
  labelRu: string;
  labelEn: string;
  path: string;
  personas: string[];
}

const SOLUTIONS: QuickSolution[] = [
  // Tourist
  { id: 'yacht', image: yachtImg, labelRu: 'Закат на яхте', labelEn: 'Sunset yacht cruise', path: '/yachts', personas: ['tourist'] },
  { id: 'massage', image: massageImg, labelRu: 'Тайский массаж', labelEn: 'Thai massage nearby', path: '/beauty', personas: ['tourist'] },
  { id: 'islands', image: islandsImg, labelRu: 'Экскурсия на острова', labelEn: 'Island tour', path: '/experiences', personas: ['tourist'] },
  { id: 'transfer-t', image: transferImg, labelRu: 'Трансфер из аэропорта', labelEn: 'Airport transfer', path: '/transport/airport-transfer', personas: ['tourist'] },

  // Resident
  { id: 'pediatr', image: pediatrImg, labelRu: 'Педиатр на дом', labelEn: 'Pediatrician house call', path: '/medical', personas: ['resident'] },
  { id: 'camp', image: campImg, labelRu: 'Английский лагерь', labelEn: 'English camp for kids', path: '/education', personas: ['resident'] },
  { id: 'visa', image: visaImg, labelRu: 'Продлить визу', labelEn: 'Extend visa', path: '/legal', personas: ['resident'] },
  { id: 'plumber-r', image: plumberImg, labelRu: 'Вызвать сантехника', labelEn: 'Call a plumber', path: '/services', personas: ['resident'] },

  // Investor
  { id: 'risks', image: risksImg, labelRu: 'Риски новостроек', labelEn: 'Off-plan risks report', path: '/property/invest', personas: ['investor'] },
  { id: 'roi', image: roiImg, labelRu: 'Сравнить доходность', labelEn: 'Compare ROI', path: '/property/offplan', personas: ['investor'] },
  { id: 'legal-check', image: legalImg, labelRu: 'Юридическая проверка', labelEn: 'Legal check', path: '/legal', personas: ['investor'] },
  { id: 'rental-mgmt', image: rentalMgmtImg, labelRu: 'Управление арендой', labelEn: 'Rental management', path: '/owner', personas: ['investor'] },

  // Owner
  { id: 'cleaning', image: cleaningImg, labelRu: 'Клининг сегодня', labelEn: 'Cleaning today', path: '/cleaning', personas: ['property_owner'] },
  { id: 'pool', image: poolImg, labelRu: 'Обслуживание бассейна', labelEn: 'Pool maintenance', path: '/services', personas: ['property_owner'] },
  { id: 'pm', image: pmImg, labelRu: 'Управляющая компания', labelEn: 'Property management', path: '/owner', personas: ['property_owner'] },
  { id: 'renovation', image: renovationImg, labelRu: 'Ремонт и отделка', labelEn: 'Renovation', path: '/services', personas: ['property_owner'] },

  // Universal
  { id: 'property-tour', image: propertyTourImg, labelRu: 'Бесплатный тур', labelEn: 'Free property tour', path: '/property/consultation?type=property_tour', personas: ['all'] },
  { id: 'flowers', image: flowersImg, labelRu: 'Заказать цветы', labelEn: 'Order flowers', path: '/flowers', personas: ['all'] },
  { id: 'bike', image: bikeImg, labelRu: 'Арендовать байк', labelEn: 'Rent a scooter', path: '/transport', personas: ['all'] },
  { id: 'housing', image: housingImg, labelRu: 'Найти жильё на месяц', labelEn: 'Find monthly rental', path: '/property', personas: ['all'] },
  { id: 'restaurant', image: restaurantImg, labelRu: 'Забронировать ресторан', labelEn: 'Book a restaurant', path: '/restaurants', personas: ['all'] },
  { id: 'electrician', image: electricianImg, labelRu: 'Вызвать электрика', labelEn: 'Call an electrician', path: '/services', personas: ['all'] },
];

export function QuickSolutionsGallery() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { personas } = useUserPersonas();
  const isRu = language === 'ru';

  const [emblaRef] = useEmblaCarousel(
    { loop: false, align: 'start', skipSnaps: false, slidesToScroll: 2 }
  );

  const activePersonas = useMemo(() => {
    if (personas.length === 0) return ['tourist' as string];
    return personas as string[];
  }, [personas]);

  const solutions = useMemo(() => {
    // Collect items matching ANY of the selected personas
    const personaItems = SOLUTIONS.filter(s => 
      activePersonas.some(p => s.personas.includes(p))
    );
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
  }, [activePersonas]);

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <h2 className="text-base font-bold text-foreground">
          {isRu ? 'Чем помочь?' : 'How can we help?'}
        </h2>
      </div>

      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3">
          {solutions.map((s) => (
            <button
              key={s.id}
              onClick={() => navigate(s.path)}
              className="shrink-0 min-w-0 basis-[180px] lg:basis-[210px] group text-left"
            >
              {/* Photo */}
              <div className="aspect-[4/3] rounded-xl overflow-hidden mb-2 transition-transform duration-200 group-active:scale-[0.97]">
                <img
                  src={s.image}
                  alt={isRu ? s.labelRu : s.labelEn}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              {/* Label */}
              <p className="text-[12px] font-medium text-foreground leading-tight line-clamp-2 mb-0.5">
                {isRu ? s.labelRu : s.labelEn}
              </p>
              <div className="flex items-center gap-0.5 text-muted-foreground">
                <span className="text-[11px]">{isRu ? 'Подробнее' : 'Learn more'}</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
