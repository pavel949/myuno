import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Wallet,
  Heart,
  FileText,
  History,
  Settings,
  Bell,
  HelpCircle,
  Shield,
} from 'lucide-react';

interface QuickLink {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  labelEn: string;
  labelRu: string;
  color: string;
  bgColor: string;
}

const QUICK_LINKS: QuickLink[] = [
  {
    path: '/wallet',
    icon: Wallet,
    labelEn: 'Wallet',
    labelRu: 'Кошелёк',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  {
    path: '/favorites',
    icon: Heart,
    labelEn: 'Favorites',
    labelRu: 'Избранное',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
  },
  {
    path: '/profile/documents',
    icon: FileText,
    labelEn: 'Documents',
    labelRu: 'Документы',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    path: '/history',
    icon: History,
    labelEn: 'History',
    labelRu: 'История',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  {
    path: '/notifications',
    icon: Bell,
    labelEn: 'Notifications',
    labelRu: 'Уведомления',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  {
    path: '/profile/settings',
    icon: Settings,
    labelEn: 'Settings',
    labelRu: 'Настройки',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  {
    path: '/support',
    icon: HelpCircle,
    labelEn: 'Support',
    labelRu: 'Поддержка',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  {
    path: '/profile',
    icon: Shield,
    labelEn: 'Security',
    labelRu: 'Безопасность',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
];

export function AccountQuickLinks() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  return (
    <Card>
      <CardContent className="p-3">
        <div className="grid grid-cols-4 gap-2">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted/50 transition-colors active:scale-95"
              >
                <div className={cn("p-2 rounded-xl", link.bgColor)}>
                  <Icon className={cn("h-4 w-4", link.color)} />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight">
                  {isRussian ? link.labelRu : link.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
