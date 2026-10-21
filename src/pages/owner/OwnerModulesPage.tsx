import { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTeamPermissions, type ModuleKey } from '@/hooks/useTeamPermissions';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';
import {
  LayoutDashboard, Building2, CalendarDays, MessageSquare,
  Crown, ContactRound, TrendingUp, Star, Megaphone,
  ClipboardList, Tag, Radio, PackageOpen, Truck, ShieldCheck, FileText,
  DollarSign, ArrowLeftRight, BarChart3, Target, Receipt,
  Users, BookOpen, CreditCard, Zap, Settings, Calendar,
  Globe, Search, Shuffle,
  type LucideIcon,
} from 'lucide-react';
import { pickLang } from '@/lib/i18n/pickLang';

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
      { id: 'finance', path: '/mc/finance', icon: DollarSign, labelEn: 'Finance overview', labelRu: 'Обзор финансов', tint: 'bg-success/12', textColor: 'text-success', permModule: 'finance' },
      { id: 'management-terms', path: '/mc/management-terms', icon: Shuffle, labelEn: 'Management terms', labelRu: 'Условия управления', tint: 'bg-accent-coral/12', textColor: 'text-accent-coral', permModule: 'finance' },
      { id: 'transactions', path: '/mc/financials', icon: ArrowLeftRight, labelEn: 'Transactions', labelRu: 'Транзакции', tint: 'bg-accent-amber/12', textColor: 'text-accent-amber', permModule: 'finance' },
      { id: 'analytics', path: APP_ROUTES.MC_ANALYTICS, icon: TrendingUp, labelEn: 'Analytics', labelRu: 'Аналитика', tint: 'bg-success/12', textColor: 'text-success', permModule: 'reports' },
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

const THAI_MODULE_LABELS: Record<string, string> = {
  dashboard: 'ภาพรวม', properties: 'ที่พัก', calendar: 'ปฏิทิน', messages: 'ข้อความ',
  crm: 'CRM', owners: 'เจ้าของที่พัก', contacts: 'ผู้ติดต่อ', sales: 'การขาย', reviews: 'รีวิว',
  marketing: 'การตลาด', sequences: 'ลำดับการติดตาม', quotes: 'ใบเสนอราคา', tasks: 'งาน',
  rates: 'ราคา', channels: 'ช่องทางการจอง', inventory: 'วัสดุและอุปกรณ์', vendors: 'ผู้ให้บริการ',
  insurance: 'ประกันภัย', documents: 'เอกสาร', finance: 'ภาพรวมการเงิน',
  'management-terms': 'เงื่อนไขการบริหาร', transactions: 'รายการรับจ่าย', analytics: 'การวิเคราะห์',
  reports: 'รายงาน', budget: 'งบประมาณ', invoices: 'ใบแจ้งหนี้', staff: 'ทีมงาน',
  subscription: 'แผนบริการ', guide: 'คู่มือ', plan: 'แผนบริการ',
};

const MODULE_AREAS = [
  { en: 'Daily work', ru: 'Ежедневная работа', th: 'งานประจำวัน', ids: ['dashboard', 'calendar', 'tasks', 'messages'] },
  { en: 'Properties & rates', ru: 'Объекты и тарифы', th: 'ที่พักและราคา', ids: ['properties', 'rates', 'channels', 'inventory', 'vendors', 'insurance', 'documents'] },
  { en: 'Finance & sales', ru: 'Финансы и продажи', th: 'การเงินและการขาย', ids: ['finance', 'management-terms', 'transactions', 'analytics', 'reports', 'budget', 'invoices', 'crm', 'owners', 'contacts', 'sales', 'reviews', 'marketing', 'sequences', 'quotes'] },
  { en: 'Team & settings', ru: 'Команда и настройки', th: 'ทีมงานและการตั้งค่า', ids: ['staff', 'subscription', 'plan', 'guide'] },
];

export default function OwnerModulesPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { canAccess } = useTeamPermissions();
  const [query, setQuery] = useState('');
  const searchId = useId();
  const label = (m: AppModule) => pickLang(language, { en: m.labelEn, ru: m.labelRu, th: THAI_MODULE_LABELS[m.id] });
  const visible = MODULE_GROUPS.flatMap(group => group.modules).filter(m =>
    (!m.permModule || canAccess(m.permModule, 'view')) && label(m).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  return <div className="mx-auto w-full min-w-0 max-w-5xl space-y-6 px-4 py-6 pb-24 md:px-6">
    <header>
      <h1 className="font-display text-h2 text-foreground">{pickLang(language, {en:'All tools', ru:'Все инструменты', th:'เครื่องมือทั้งหมด'})}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{pickLang(language, {en:'Choose the job you need to do.', ru:'Выберите задачу, которую нужно выполнить.', th:'เลือกงานที่ต้องการทำ'})}</p>
    </header>
    <label htmlFor={searchId} className="flex min-h-11 items-center gap-3 border border-border bg-card px-3">
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="sr-only">{pickLang(language, {en:'Find a tool', ru:'Найти инструмент', th:'ค้นหาเครื่องมือ'})}</span>
      <input id={searchId} aria-label={pickLang(language, {en: 'Find a tool', ru: 'Найти инструмент', th: 'ค้นหาเครื่องมือ'})} className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-hidden focus-visible:ring-2 focus-visible:ring-ring" value={query} onChange={event => setQuery(event.target.value)} placeholder={pickLang(language, {en:'Search tools', ru:'Поиск по инструментам', th:'ค้นหาเครื่องมือ'})} />
    </label>
    {visible.length === 0 && <p role="status" className="py-6 text-sm text-muted-foreground">{pickLang(language, {en:'No matching tools available.', ru:'Доступные инструменты не найдены.', th:'ไม่พบเครื่องมือที่ใช้งานได้'})}</p>}
    {MODULE_AREAS.map((area, index) => {
      const modules = visible.filter(m => area.ids.includes(m.id));
      if (!modules.length) return null;
      return <details key={`${area.en}:${Boolean(query.trim())}`} open={query.trim() ? true : index === 0} className="border border-border bg-card">
        <summary className="min-h-12 cursor-pointer px-4 py-4 font-medium text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">{pickLang(language, area)} <span className="ml-2 text-xs text-muted-foreground">{modules.length}</span></summary>
        <div className="grid gap-px border-t border-border bg-border sm:grid-cols-2">
          {modules.map(mod => <button type="button" key={mod.id} onClick={() => navigate(mod.path)} className="flex min-h-16 min-w-0 items-center gap-3 bg-card p-4 text-left text-sm text-foreground hover:bg-muted focus-visible:z-10 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
            <mod.icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0 break-words">{label(mod)}</span>
          </button>)}
        </div>
      </details>;
    })}
  </div>;
}
