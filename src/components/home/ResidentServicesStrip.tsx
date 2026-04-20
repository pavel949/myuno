import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Heart, FileText, Car } from 'lucide-react';

const SERVICES = [
  {
    icon: Sparkles,
    labelEn: 'Cleaning',
    labelRu: 'Уборка',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    href: '/cleaning',
  },
  {
    icon: Heart,
    labelEn: 'Medical',
    labelRu: 'Медицина',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    href: '/medical',
  },
  {
    icon: FileText,
    labelEn: 'Visa / Legal',
    labelRu: 'Виза / Юрист',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    href: '/legal',
  },
  {
    icon: Car,
    labelEn: 'Transport',
    labelRu: 'Транспорт',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    href: '/transport',
  },
];

export function ResidentServicesStrip() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  return (
    <div className="px-4 space-y-3">
      <h2 className="text-base font-semibold">
        {isRu ? 'Сервисы для резидентов' : 'Resident Services'}
      </h2>

      <div className="grid grid-cols-4 gap-2">
        {SERVICES.map(({ icon: Icon, labelEn, labelRu, color, bg, href }) => (
          <Card
            key={href}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(href)}
          >
            <CardContent className="p-3 flex flex-col items-center gap-1.5 text-center">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-[11px] font-medium leading-tight">
                {isRu ? labelRu : labelEn}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
