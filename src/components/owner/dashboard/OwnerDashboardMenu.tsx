import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  Download,
  Sparkles,
  BarChart3,
  MessageCircle,
  ChevronRight,
  HelpCircle,
  BookOpen,
  FileText,
} from 'lucide-react';

interface MenuItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  labelEn: string;
  labelRu: string;
}

const MENU_ITEMS: MenuItem[] = [
  { path: '/owner/channels', icon: Download, labelEn: 'Channel Manager', labelRu: 'Менеджер каналов' },
  { path: '/owner/service-request?type=cleaning', icon: Sparkles, labelEn: 'Request Cleaning', labelRu: 'Заказать уборку' },
  { path: '/owner/reports', icon: BarChart3, labelEn: 'Reports', labelRu: 'Отчёты' },
  { path: '/owner/management-terms', icon: FileText, labelEn: 'Management Terms', labelRu: 'Условия управления' },
  { path: '/owner/messages', icon: MessageCircle, labelEn: 'Messages', labelRu: 'Сообщения' },
  { path: '/owner/guide', icon: BookOpen, labelEn: 'Owner Guide', labelRu: 'Материалы для хозяев' },
  { path: '/support', icon: HelpCircle, labelEn: 'Help', labelRu: 'Помощь' },
];

export function OwnerDashboardMenu() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <nav>
      {MENU_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-4 py-4 text-left hover:opacity-70 transition-opacity active:scale-[0.99]"
          >
            <Icon className="h-5 w-5 text-foreground/70 flex-shrink-0" />
            <span className="flex-1 text-[15px] font-medium">{isRu ? item.labelRu : item.labelEn}</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
          </button>
        );
      })}
    </nav>
  );
}
