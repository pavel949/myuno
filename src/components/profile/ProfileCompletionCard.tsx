import { useMemo } from 'react';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { SectionCard } from '@/components/uno/SectionCard';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/useProfile';
import { useProfileDetails } from '@/hooks/useProfileDetails';
import { useNavigate } from 'react-router-dom';

const texts = {
  ru: {
    title: 'Заполнение профиля',
    subtitle: 'Заполненный профиль ускоряет бронирования и повышает доверие',
    complete: 'Готово',
    items: {
      name: 'Имя и фото',
      phone: 'Номер телефона',
      documents: 'Документы',
      emergency: 'Экстренный контакт',
      address: 'Адрес проживания',
    },
    allComplete: 'Отлично! Ваш профиль полностью заполнен',
  },
  en: {
    title: 'Profile Completion',
    subtitle: 'A complete profile speeds up bookings and builds trust',
    complete: 'Complete',
    items: {
      name: 'Name & Photo',
      phone: 'Phone Number',
      documents: 'Documents',
      emergency: 'Emergency Contact',
      address: 'Residential Address',
    },
    allComplete: 'Great! Your profile is complete',
  },
};

interface CompletionItem {
  key: string;
  label: string;
  completed: boolean;
  path: string;
}

export function ProfileCompletionCard() {
  const { language } = useLanguage();
  const { profile } = useProfile();
  const { details } = useProfileDetails();
  const navigate = useNavigate();
  const t = texts[language === 'th' ? 'en' : language] || texts.en;

  const completionItems: CompletionItem[] = useMemo(() => [
    {
      key: 'name',
      label: t.items.name,
      completed: !!(profile?.full_name && profile?.avatar_url),
      path: '/profile/edit',
    },
    {
      key: 'phone',
      label: t.items.phone,
      completed: !!profile?.phone,
      path: '/profile/edit',
    },
    {
      key: 'documents',
      label: t.items.documents,
      completed: false, // Would check user_documents table
      path: '/profile/documents',
    },
    {
      key: 'emergency',
      label: t.items.emergency,
      completed: !!(details?.emergency_contact_name && details?.emergency_contact_phone),
      path: '/profile/settings',
    },
    {
      key: 'address',
      label: t.items.address,
      completed: !!(details?.address_line1 && details?.city && details?.country),
      path: '/profile/settings',
    },
  ], [profile, details, t.items]);

  const completedCount = completionItems.filter(item => item.completed).length;
  const totalCount = completionItems.length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  const isComplete = completedCount === totalCount;

  if (isComplete) {
    return null; // Don't show if profile is complete
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <SectionCard className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm">{t.title}</h3>
              <span className="text-xs font-medium text-primary">{percentage}%</span>
            </div>
            <p className="text-xs text-muted-foreground">{t.subtitle}</p>
          </div>

          <Progress value={percentage} className="h-2" />

          <div className="space-y-2">
            {completionItems.map((item) => (
              <button
                key={item.key}
                onClick={() => !item.completed && navigate(item.path)}
                disabled={item.completed}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  item.completed 
                    ? 'opacity-60 cursor-default' 
                    : 'hover:bg-primary/10 cursor-pointer'
                }`}
              >
                {item.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className={`text-sm flex-1 text-left ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {item.label}
                </span>
                {!item.completed && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>
    </motion.div>
  );
}
