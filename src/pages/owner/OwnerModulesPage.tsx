import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTeamPermissions, type ModuleKey } from '@/hooks/useTeamPermissions';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Building2, CalendarDays, MessageSquare,
  Crown, ContactRound, TrendingUp, Star, Megaphone,
  ClipboardList, Tag, Radio, PackageOpen, Truck, ShieldCheck, FileText,
  DollarSign, ArrowLeftRight, BarChart3, Target, Receipt,
  Users, BookOpen, CreditCard, Zap, Settings, Calendar,
  Globe, Search, Shuffle,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AppModule {
  id: string;
  path: string;
  icon: LucideIcon;
  labelEn: string;
  labelRu: string;
  tint: string;
  textColor: string;
  permModule?: ModuleKey;
}

interface ModuleGroup {
  titleEn: string;
  titleRu: string;
  modules: AppModule[];
}

const MODULE_GROUPS: ModuleGroup[] = [
  {
    titleEn: 'Main',
    titleRu: 'Главное',
    modules: [
      { id: 'dashboard', path: '/mc', icon: LayoutDashboard, labelEn: 'Dashboard', labelRu: 'Обзор', tint: 'bg-primary/12', textColor: 'text-primary' },
      { id: 'properties', path: '/mc/properties', icon: Building2, labelEn: 'Properties', labelRu: 'Объекты', tint: 'bg-success/12', textColor: 'text-success', permModule: 'properties' },
      { id: 'calendar', path: '/mc/calendar', icon: CalendarDays, labelEn: 'Calendar', labelRu: 'Календарь', tint: 'bg-info/12', textColor: 'text-info', permModule: 'bookings' },
      { id: 'messages', path: '/mc/messages', icon: MessageSquare, labelEn: 'Messages', labelRu: 'Сообщения', tint: 'bg-accent-purple/12', textColor: 'text-accent-purple' },
    ],
  },
  {
    titleEn: 'CRM & Sales',
    titleRu: 'CRM и продажи',
    modules: [
      { id: 'crm', path: '/mc/crm-dashboard', icon: BarChart3, labelEn: 'CRM', labelRu: 'CRM', tint: 'bg-primary/12', textColor: 'text-primary', permModule: 'crm' },
      { id: 'owners', path: '/mc/owners', icon: Crown, labelEn: 'Owners', labelRu: 'Собственники', tint: 'bg-accent-amber/12', textColor: 'text-accent-amber', permModule: 'crm' },
      { id: 'contacts', path: '/mc/contacts', icon: ContactRound, labelEn: 'Contacts', labelRu: 'Контакты', tint: 'bg-info/12', textColor: 'text-info', permModule: 'crm' },
      { id: 'sales', path: '/mc/sales', icon: TrendingUp, labelEn: 'Sales', labelRu: 'Продажи', tint: 'bg-success/12', textColor: 'text-success', permModule: 'crm' },
      { id: 'reviews', path: '/mc/reviews-management', icon: Star, labelEn: 'Reviews', labelRu: 'Отзывы', tint: 'bg-warning/12', textColor: 'text-warning', permModule: 'crm' },
      { id: 'marketing', path: '/mc/marketing', icon: Megaphone, labelEn: 'Marketing', labelRu: 'Маркетинг', tint: 'bg-accent-coral/12', textColor: 'text-accent-coral', permModule: 'crm' },
      { id: 'sequences', path: '/mc/sequences', icon: Zap, labelEn: 'Sequences', labelRu: 'Цепочки', tint: 'bg-warning/12', textColor: 'text-warning', permModule: 'crm' },
      { id: 'quotes', path: '/mc/quotes', icon: FileText, labelEn: 'Quotes', labelRu: 'КП', tint: 'bg-muted', textColor: 'text-muted-foreground', permModule: 'crm' },
    ],
  },
  {
    titleEn: 'Operations',
    titleRu: 'Операции',
    modules: [
      { id: 'tasks', path: '/mc/tasks', icon: ClipboardList, labelEn: 'Tasks', labelRu: 'Задачи', tint: 'bg-warning/12', textColor: 'text-warning', permModule: 'tasks' },
      { id: 'rates', path: '/mc/rates', icon: Tag, labelEn: 'Rates', labelRu: 'Тарифы', tint: 'bg-accent-purple/12', textColor: 'text-accent-purple', permModule: 'finance' },
      { id: 'channels', path: '/mc/channels', icon: Radio, labelEn: 'Channels', labelRu: 'Каналы', tint: 'bg-accent-cyan/12', textColor: 'text-accent-cyan' },
      { id: 'inventory', path: '/mc/inventory', icon: PackageOpen, labelEn: 'Inventory', labelRu: 'Инвентарь', tint: 'bg-accent-amber/12', textColor: 'text-accent-amber', permModule: 'properties' },
      { id: 'vendors', path: '/mc/vendors', icon: Truck, labelEn: 'Vendors', labelRu: 'Поставщики', tint: 'bg-info/12', textColor: 'text-info', permModule: 'properties' },
      { id: 'insurance', path: '/mc/insurance', icon: ShieldCheck, labelEn: 'Insurance', labelRu: 'Страховки', tint: 'bg-success/12', textColor: 'text-success' },
      { id: 'documents', path: '/mc/documents', icon: FileText, labelEn: 'Documents', labelRu: 'Документы', tint: 'bg-muted', textColor: 'text-muted-foreground' },
    ],
  },
  {
    titleEn: 'Finance',
    titleRu: 'Финансы',
    modules: [
      { id: 'finance', path: '/mc/finance', icon: DollarSign, labelEn: 'Overview', labelRu: 'Обзор', tint: 'bg-success/12', textColor: 'text-success', permModule: 'finance' },
      { id: 'management-terms', path: '/mc/management-terms', icon: Shuffle, labelEn: 'Payouts', labelRu: 'Выплаты', tint: 'bg-accent-coral/12', textColor: 'text-accent-coral', permModule: 'finance' },
      { id: 'transactions', path: '/mc/financials', icon: ArrowLeftRight, labelEn: 'Transactions', labelRu: 'Транзакции', tint: 'bg-accent-amber/12', textColor: 'text-accent-amber', permModule: 'finance' },
      { id: 'reports', path: '/mc/reports', icon: BarChart3, labelEn: 'Reports', labelRu: 'Отчёты', tint: 'bg-primary/12', textColor: 'text-primary', permModule: 'reports' },
      { id: 'budget', path: '/mc/budget', icon: Target, labelEn: 'Budget', labelRu: 'Бюджет', tint: 'bg-accent-purple/12', textColor: 'text-accent-purple', permModule: 'finance' },
      { id: 'invoices', path: '/mc/invoices', icon: Receipt, labelEn: 'Invoices', labelRu: 'Инвойсы', tint: 'bg-accent-cyan/12', textColor: 'text-accent-cyan', permModule: 'finance' },
    ],
  },
  {
    titleEn: 'Team & Settings',
    titleRu: 'Команда',
    modules: [
      { id: 'staff', path: '/mc/staff', icon: Users, labelEn: 'Staff', labelRu: 'Сотрудники', tint: 'bg-info/12', textColor: 'text-info', permModule: 'staff' },
      { id: 'subscription', path: '/mc/subscription', icon: CreditCard, labelEn: 'Plan', labelRu: 'Подписка', tint: 'bg-accent-amber/12', textColor: 'text-accent-amber' },
      { id: 'guide', path: '/owner/guide', icon: BookOpen, labelEn: 'Guide', labelRu: 'Руководство', tint: 'bg-muted', textColor: 'text-muted-foreground' },
    ],
  },
];

const CRM_MORE_MODULE_IDS = new Set(['sequences', 'quotes']);

export default function OwnerModulesPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { canAccess } = useTeamPermissions();
  const [crmMoreOpen, setCrmMoreOpen] = useState(false);

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 space-y-7 max-w-lg md:max-w-[1536px] mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          {isRu ? 'Все модули' : 'All Modules'}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isRu ? 'Быстрый доступ ко всем инструментам' : 'Quick access to all tools'}
        </p>
      </div>

      {MODULE_GROUPS.map((group, gi) => {
        const visibleModules = group.modules.filter(m => {
          if (!m.permModule) return true;
          return canAccess(m.permModule, 'view');
        });
        if (visibleModules.length === 0) return null;

        const isCrmGroup = group.titleEn === 'CRM & Sales';
        const primaryModules = isCrmGroup
          ? visibleModules.filter((m) => !CRM_MORE_MODULE_IDS.has(m.id))
          : visibleModules;
        const secondaryModules = isCrmGroup
          ? visibleModules.filter((m) => CRM_MORE_MODULE_IDS.has(m.id))
          : [];

        return (
          <motion.div
            key={group.titleEn}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: gi * 0.05 }}
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              {isRu ? group.titleRu : group.titleEn}
            </p>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {primaryModules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => navigate(mod.path)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-none transition-all hover:bg-muted/50 group"
                  >
                    <div className={cn(
                      'w-12 h-12 rounded-none flex items-center justify-center',
                      'shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]',
                      'transition-transform ',
                      mod.tint,
                    )}>
                      <Icon className={cn('h-6 w-6', mod.textColor)} strokeWidth={2} />
                    </div>
                    <span className="text-[11px] font-medium text-center leading-tight text-foreground/80 line-clamp-2">
                      {isRu ? mod.labelRu : mod.labelEn}
                    </span>
                  </button>
                );
              })}
              {isCrmGroup && secondaryModules.length > 0 && crmMoreOpen
                ? secondaryModules.map((mod) => {
                    const Icon = mod.icon;
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => navigate(mod.path)}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-none transition-all hover:bg-muted/50 group"
                      >
                        <div className={cn(
                          'w-12 h-12 rounded-none flex items-center justify-center',
                          'shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]',
                          'transition-transform ',
                          mod.tint,
                        )}>
                          <Icon className={cn('h-6 w-6', mod.textColor)} strokeWidth={2} />
                        </div>
                        <span className="text-[11px] font-medium text-center leading-tight text-foreground/80 line-clamp-2">
                          {isRu ? mod.labelRu : mod.labelEn}
                        </span>
                      </button>
                    );
                  })
                : null}
            </div>
            {isCrmGroup && secondaryModules.length > 0 && (
              <button
                type="button"
                onClick={() => setCrmMoreOpen((o) => !o)}
                className="mt-2 w-full text-center text-xs font-medium text-muted-foreground hover:text-foreground py-2 rounded-none border border-dashed border-muted-foreground/30 bg-muted/20"
              >
                {crmMoreOpen
                  ? (isRu ? 'Свернуть' : 'Show less')
                  : (isRu ? `Ещё (${secondaryModules.length})` : `More (${secondaryModules.length})`)}
              </button>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
