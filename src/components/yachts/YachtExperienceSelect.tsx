import React from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export interface YachtExperience {
  id: string;
  icon: string;
  labelEn: string;
  labelRu: string;
  descEn: string;
  descRu: string;
  price: number; // Additional price in THB
  popular?: boolean;
}

export const YACHT_EXPERIENCES: YachtExperience[] = [
  {
    id: 'sunset-dinner',
    icon: '🌅',
    labelEn: 'Sunset Dinner',
    labelRu: 'Ужин на закате',
    descEn: 'Romantic dinner with sea view',
    descRu: 'Романтический ужин с видом на море',
    price: 8000,
    popular: true,
  },
  {
    id: 'fishing',
    icon: '🎣',
    labelEn: 'Fishing Trip',
    labelRu: 'Рыбалка',
    descEn: 'Deep sea fishing with equipment',
    descRu: 'Морская рыбалка со снаряжением',
    price: 5000,
  },
  {
    id: 'water-toys',
    icon: '🎢',
    labelEn: 'Water Toys',
    labelRu: 'Водные игрушки',
    descEn: 'Banana, tube, wakeboard & more',
    descRu: 'Банан, ватрушка, вейкборд и др.',
    price: 6000,
    popular: true,
  },
  {
    id: 'jet-ski',
    icon: '🏍️',
    labelEn: 'Jet Ski',
    labelRu: 'Гидроскутер',
    descEn: '1 hour jet ski rental',
    descRu: 'Аренда гидроцикла на 1 час',
    price: 4000,
  },
  {
    id: 'corporate',
    icon: '💼',
    labelEn: 'Corporate Event',
    labelRu: 'Корпоратив',
    descEn: 'Team building & business events',
    descRu: 'Тимбилдинг и деловые мероприятия',
    price: 15000,
  },
  {
    id: 'birthday',
    icon: '🎂',
    labelEn: 'Birthday Party',
    labelRu: 'День рождения',
    descEn: 'Cake, decorations & celebration',
    descRu: 'Торт, декор и праздник',
    price: 10000,
    popular: true,
  },
  {
    id: 'romantic',
    icon: '🥂',
    labelEn: 'Romantic Date',
    labelRu: 'Романтическое свидание',
    descEn: 'Champagne, flowers & private setup',
    descRu: 'Шампанское, цветы и приватная обстановка',
    price: 12000,
  },
  {
    id: 'snorkeling',
    icon: '🤿',
    labelEn: 'Snorkeling Adventure',
    labelRu: 'Снорклинг-приключение',
    descEn: 'Equipment & guide to best spots',
    descRu: 'Снаряжение и гид к лучшим местам',
    price: 3000,
  },
  {
    id: 'photoshoot',
    icon: '📸',
    labelEn: 'Photo Session',
    labelRu: 'Фотосессия',
    descEn: 'Professional photographer onboard',
    descRu: 'Профессиональный фотограф на борту',
    price: 8000,
  },
  {
    id: 'yoga',
    icon: '🧘',
    labelEn: 'Yacht Yoga',
    labelRu: 'Йога на воде',
    descEn: 'Sunrise yoga with instructor',
    descRu: 'Йога на рассвете с инструктором',
    price: 5000,
  },
  {
    id: 'family',
    icon: '👨‍👩‍👧‍👦',
    labelEn: 'Family Cruise',
    labelRu: 'Семейный круиз',
    descEn: 'Kid-friendly activities & menu',
    descRu: 'Детские развлечения и меню',
    price: 4000,
  },
  {
    id: 'karaoke',
    icon: '🎤',
    labelEn: 'Karaoke Party',
    labelRu: 'Караоке-вечеринка',
    descEn: 'Professional sound system & songs',
    descRu: 'Проф. звук и большой выбор песен',
    price: 5000,
  },
  {
    id: 'bachelor',
    icon: '🍾',
    labelEn: 'Bachelor/Bachelorette',
    labelRu: 'Мальчишник/Девичник',
    descEn: 'Special party package',
    descRu: 'Специальный праздничный пакет',
    price: 15000,
  },
];

interface YachtExperienceSelectProps {
  selected: string[];
  onChange: (ids: string[]) => void;
  className?: string;
}

export function YachtExperienceSelect({ selected, onChange, className }: YachtExperienceSelectProps) {
  const { language } = useLanguage();

  const toggleExperience = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const getTotal = () => {
    return selected.reduce((sum, id) => {
      const exp = YACHT_EXPERIENCES.find(e => e.id === id);
      return sum + (exp?.price || 0);
    }, 0);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          {language === 'ru' ? 'Выберите впечатления' : 'Choose Experiences'}
        </h3>
        {selected.length > 0 && (
          <span className="text-sm text-primary font-medium">
            +฿{getTotal().toLocaleString()}
          </span>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {language === 'ru' 
          ? 'Добавьте особые опции для незабываемого путешествия' 
          : 'Add special options for an unforgettable journey'}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {YACHT_EXPERIENCES.map((exp) => {
          const isSelected = selected.includes(exp.id);
          return (
            <button
              key={exp.id}
              onClick={() => toggleExperience(exp.id)}
              className={cn(
                "relative p-3 rounded-xl border text-left transition-all",
                isSelected 
                  ? "border-primary bg-primary/5 ring-1 ring-primary" 
                  : "border-border hover:border-primary/30 hover:bg-muted/50"
              )}
            >
              {exp.popular && (
                <span className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-medium">
                  {language === 'ru' ? 'ТОП' : 'HOT'}
                </span>
              )}
              
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}

              <span className="text-2xl mb-2 block">{exp.icon}</span>
              <p className="font-medium text-sm line-clamp-1">
                {language === 'ru' ? exp.labelRu : exp.labelEn}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {language === 'ru' ? exp.descRu : exp.descEn}
              </p>
              <p className="text-sm font-semibold text-primary mt-2">
                +฿{exp.price.toLocaleString()}
              </p>
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {language === 'ru' ? 'Выбрано опций:' : 'Selected:'} {selected.length}
            </span>
            <span className="font-semibold text-primary">
              +฿{getTotal().toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Quick filter chips for experiences on index page
interface ExperienceFilterChipsProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function ExperienceFilterChips({ selected, onChange }: ExperienceFilterChipsProps) {
  const { language } = useLanguage();

  const toggleExperience = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
      {YACHT_EXPERIENCES.map((exp) => {
        const isSelected = selected.includes(exp.id);
        return (
          <button
            key={exp.id}
            onClick={() => toggleExperience(exp.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-full border whitespace-nowrap text-sm transition-all",
              isSelected 
                ? "border-primary bg-primary text-primary-foreground" 
                : "border-border bg-card hover:border-primary/30"
            )}
          >
            <span>{exp.icon}</span>
            <span>{language === 'ru' ? exp.labelRu : exp.labelEn}</span>
          </button>
        );
      })}
    </div>
  );
}
