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
}

const QUICK_LINKS: QuickLink[] = [
  { path: '/wallet', icon: Wallet, labelEn: 'Wallet', labelRu: 'Кошелёк' },
  { path: '/favorites', icon: Heart, labelEn: 'Favorites', labelRu: 'Избранное' },
  { path: '/profile/documents', icon: FileText, labelEn: 'Documents', labelRu: 'Документы' },
  { path: '/history', icon: History, labelEn: 'History', labelRu: 'История' },
  { path: '/notifications', icon: Bell, labelEn: 'Notifications', labelRu: 'Уведомления' },
  { path: '/profile/settings', icon: Settings, labelEn: 'Settings', labelRu: 'Настройки' },
  { path: '/support', icon: HelpCircle, labelEn: 'Support', labelRu: 'Поддержка' },
  { path: '/profile', icon: Shield, labelEn: 'Security', labelRu: 'Безопасность' },
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
                <div className="p-2 rounded-xl bg-primary/8">
                  <Icon className="h-4 w-4 text-primary" />
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
