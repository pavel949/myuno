import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { Baby, GraduationCap, Stethoscope, Compass, Users, Utensils, Shield, ArrowRight } from 'lucide-react';
import { tokenColor } from '@/lib/utils/hslAlpha';

const CATEGORIES = [
  { icon: GraduationCap, labelEn: 'International Schools', labelRu: 'Международные школы', descEn: 'British, American, IB curriculum', descRu: 'Британская, американская, IB программа', path: '/education', color: 'accent-amber' },
  { icon: Baby, labelEn: 'Kindergartens', labelRu: 'Детские сады', descEn: 'Bilingual & Montessori', descRu: 'Двуязычные и Монтессори', path: '/education?type=kindergarten', color: 'accent-purple' },
  { icon: Stethoscope, labelEn: 'Pediatricians', labelRu: 'Педиатры', descEn: 'English & Russian-speaking', descRu: 'Англо- и русскоговорящие', path: '/medical?specialty=pediatric', color: 'destructive' },
  { icon: Users, labelEn: 'Nannies & Babysitters', labelRu: 'Няни и бебиситтеры', descEn: 'Verified & experienced', descRu: 'Проверенные и опытные', path: '/babysitter', color: 'accent-purple' },
  { icon: Compass, labelEn: 'Kids Activities', labelRu: 'Активности для детей', descEn: 'Swimming, art, sports', descRu: 'Плавание, творчество, спорт', path: '/experiences?tag=family', color: 'accent-cyan' },
  { icon: Utensils, labelEn: 'Family Restaurants', labelRu: 'Семейные рестораны', descEn: 'Kids menus & play areas', descRu: 'Детское меню и игровые зоны', path: '/restaurants?tag=family', color: 'cluster-arrive' },
  { icon: Shield, labelEn: 'Family Insurance', labelRu: 'Семейная страховка', descEn: 'Health & travel coverage', descRu: 'Медицинская и тревел-страховка', path: '/insurance?type=family', color: 'cluster-live' },
];

export default function KidsLandingPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();

  return (
    <LandingLayout
      icon={Baby}
      title={t ? 'Пхукет для детей' : 'Phuket for Kids'}
      subtitle={t ? 'Школы, врачи, активности — всё для семьи на острове' : 'Schools, doctors, activities — everything for families on the island'}
      gradient="from-amber-500 via-orange-500 to-pink-500"
    >
      <div className="px-4 py-8 max-w-lg mx-auto space-y-3">
        {CATEGORIES.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <button key={i} onClick={() => navigate(cat.path)} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card text-left transition-all hover:[box-shadow:var(--shadow-elevation-2)] active:scale-[0.98]">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: tokenColor(cat.color, 0.15) }}>
                <Icon className="w-5 h-5" style={{ color: tokenColor(cat.color) }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground">{t ? cat.labelRu : cat.labelEn}</h3>
                <p className="text-xs text-muted-foreground">{t ? cat.descRu : cat.descEn}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </LandingLayout>
  );
}
