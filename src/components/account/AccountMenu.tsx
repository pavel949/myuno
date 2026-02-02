import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  Settings,
  FileText,
  Bell,
  HelpCircle,
  Shield,
  CreditCard,
  ChevronRight,
} from 'lucide-react';

interface MenuItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  labelEn: string;
  labelRu: string;
}

const MENU_ITEMS: MenuItem[] = [
  { path: '/profile/settings', icon: Settings, labelEn: 'Settings', labelRu: 'Настройки' },
  { path: '/profile/documents', icon: FileText, labelEn: 'Documents', labelRu: 'Документы' },
  { path: '/profile', icon: Shield, labelEn: 'Security', labelRu: 'Безопасность' },
  { path: '/notifications', icon: Bell, labelEn: 'Notifications', labelRu: 'Уведомления' },
  { path: '/wallet', icon: CreditCard, labelEn: 'Payment Methods', labelRu: 'Способы оплаты' },
  { path: '/support', icon: HelpCircle, labelEn: 'Help & Support', labelRu: 'Помощь' },
];

export function AccountMenu() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <Card>
      <CardContent className="p-2">
        <div className="space-y-0.5">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
                  "hover:bg-muted/50 transition-colors active:scale-[0.99] text-left"
                )}
              >
                <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 text-sm font-medium">
                  {isRu ? item.labelRu : item.labelEn}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
