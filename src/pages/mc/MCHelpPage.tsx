import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Helmet } from 'react-helmet-async';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Search, HelpCircle, Shield, LayoutDashboard, Building2, Users, CreditCard,
  CalendarDays, DollarSign, BarChart3, ClipboardList, MessageSquare, BookOpen,
  Lock, Globe, Database, RefreshCw, Send, Bot, User, Loader2, Sparkles,
  ChevronRight, FileText, Zap, Star, Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-support-chat`;

// ═══════════════════════════════════════════
// HELP CONTENT DATA
// ═══════════════════════════════════════════

interface FAQItem {
  q: { en: string; ru: string };
  a: { en: string; ru: string };
}

interface FeatureSection {
  id: string;
  icon: React.ElementType;
  title: { en: string; ru: string };
  description: { en: string; ru: string };
  features: { en: string; ru: string }[];
}

const FAQ_ITEMS: FAQItem[] = [
  {
    q: { en: 'MC CRM vs Capital — where do I work deals?', ru: 'MC CRM и Capital — где что вести?' },
    a: {
      en: 'Use MC (/mc/…) for day-to-day operations: rentals, property management, owners, and service-related pipeline. Use Capital (/capital/…) for off-plan, viewing requests, mandates, and the investor pipeline. The same person can exist in both; open the banner on a contact card to jump between pipelines.',
      ru: 'MC (/mc/…) — повседневные операции: аренда, управление объектами, собственники и сервисная воронка. Capital (/capital/…) — newbuild, запросы на показы, мандаты и инвестиционный пайплайн. Один человек может быть в обеих CRM — на карточке контакта откройте баннер, чтобы перейти в другую воронку.',
    },
  },
  {
    q: { en: 'How do I add a new property?', ru: 'Как добавить новый объект?' },
    a: { en: 'Go to Properties → click "Add Property". Fill in the details, upload photos, and save. Once saved, activate the property slot in the Subscription section to enable PMS features (calendar, bookings, finances).', ru: 'Перейдите в Объекты → нажмите «Добавить объект». Заполните информацию, загрузите фото и сохраните. После сохранения активируйте слот объекта в разделе Подписка, чтобы включить PMS-функции (календарь, бронирования, финансы).' },
  },
  {
    q: { en: 'How does the subscription work?', ru: 'Как работает подписка?' },
    a: { en: 'You pay $25/month per active property slot. Choose a plan (Basic, Starter, Professional, Enterprise) or set a custom quantity. Pay online via Stripe or contact us on WhatsApp for offline payment. You can activate/deactivate properties at any time — billing adjusts automatically.', ru: 'Вы платите $25/мес за каждый активный слот объекта. Выберите план (Базовый, Стартовый, Профессиональный, Корпоративный) или укажите своё количество. Оплата онлайн через Stripe или оффлайн через WhatsApp. Вы можете включать/отключать объекты в любой момент — стоимость пересчитывается автоматически.' },
  },
  {
    q: { en: 'Can I invite team members?', ru: 'Могу ли я пригласить сотрудников?' },
    a: { en: 'Yes! Go to Staff & Access → Invite. Enter their email and select a role (Admin, Manager, Staff, Cleaner, Maintenance). They will receive an email with login credentials. You can configure module-level permissions for each team member.', ru: 'Да! Перейдите в Сотрудники → Пригласить. Введите email и выберите роль (Администратор, Менеджер, Сотрудник, Уборщик, Техник). Им придёт письмо с данными для входа. Вы можете настроить доступ к модулям для каждого сотрудника.' },
  },
  {
    q: { en: 'How do I manage bookings?', ru: 'Как управлять бронированиями?' },
    a: { en: 'Use the Calendar module to view all bookings across properties. You can create manual bookings, sync with external channels (Airbnb, Booking.com) via Channel Manager, and manage check-in/check-out operations.', ru: 'Используйте модуль Календарь для просмотра всех бронирований по объектам. Вы можете создавать бронирования вручную, синхронизировать с внешними каналами (Airbnb, Booking.com) через Менеджер каналов и управлять заселением/выселением.' },
  },
  {
    q: { en: 'Can I export my data?', ru: 'Могу ли я экспортировать данные?' },
    a: { en: 'Yes. Go to Settings → Data tab. You can export Properties, CRM contacts, Financial data, and Reports in JSON or CSV format. You can also set up automated weekly or monthly backups.', ru: 'Да. Перейдите в Настройки → вкладка Данные. Можно экспортировать Объекты, CRM-контакты, Финансовые данные и Отчёты в формате JSON или CSV. Также можно настроить автоматический бэкап еженедельно или ежемесячно.' },
  },
  {
    q: { en: 'What happens if I deactivate a property?', ru: 'Что произойдёт при деактивации объекта?' },
    a: { en: 'The property data is preserved, but PMS features (calendar, bookings, finances, tasks) become unavailable. You stop paying for that slot. You can reactivate at any time.', ru: 'Данные объекта сохраняются, но PMS-функции (календарь, бронирования, финансы, задачи) станут недоступны. Оплата за этот слот прекращается. Вы можете активировать объект снова в любой момент.' },
  },
  {
    q: { en: 'How do owner reports work?', ru: 'Как работают отчёты для собственников?' },
    a: { en: 'The Finance → Reports section generates monthly statements for property owners showing income, expenses, occupancy rate, and net profit. Reports can be sent automatically to owners via email.', ru: 'Раздел Финансы → Отчёты формирует ежемесячные выписки для собственников с доходами, расходами, загрузкой и чистой прибылью. Отчёты можно отправлять автоматически собственникам по email.' },
  },
  {
    q: { en: 'How do I connect to Airbnb / Booking.com?', ru: 'Как подключить Airbnb / Booking.com?' },
    a: { en: 'Go to Operations → Channel Manager. Add an iCal link from your Airbnb/Booking.com listing. The calendar syncs automatically every few hours to prevent double bookings.', ru: 'Перейдите в Операции → Менеджер каналов. Добавьте iCal-ссылку от вашего объявления на Airbnb/Booking.com. Календарь синхронизируется автоматически каждые несколько часов для предотвращения двойных бронирований.' },
  },
  {
    q: { en: 'Can I customize financial categories?', ru: 'Могу ли я настроить категории расходов?' },
    a: { en: 'Yes. Go to Settings → Finance tab. You can show/hide 22+ default expense/income categories and create custom ones specific to your business.', ru: 'Да. Перейдите в Настройки → вкладка Финансы. Можно показать/скрыть 22+ стандартных категорий расходов/доходов и создать свои, специфичные для вашего бизнеса.' },
  },
  {
    q: { en: 'What is the CRM module for?', ru: 'Для чего нужен модуль CRM?' },
    a: { en: 'The CRM helps you manage leads, contacts, and sales pipeline. Track potential property owners, send emails, create quotes, manage deals through customizable stages, and automate follow-ups.', ru: 'CRM помогает управлять лидами, контактами и воронкой продаж. Отслеживайте потенциальных собственников, отправляйте email, создавайте коммерческие предложения, ведите сделки по настраиваемым этапам и автоматизируйте напоминания.' },
  },
];

const FEATURE_SECTIONS: FeatureSection[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: { en: 'Dashboard', ru: 'Панель управления' },
    description: { en: 'Central overview of your management company operations', ru: 'Центральный обзор операций вашей управляющей компании' },
    features: [
      { en: 'Real-time KPIs: occupancy, revenue, upcoming check-ins', ru: 'KPI в реальном времени: загрузка, доход, предстоящие заселения' },
      { en: 'Quick action buttons for common tasks', ru: 'Кнопки быстрых действий для частых задач' },
      { en: 'Activity feed with recent events', ru: 'Лента активности с последними событиями' },
      { en: 'Portfolio overview across all properties', ru: 'Обзор портфолио по всем объектам' },
    ],
  },
  {
    id: 'properties',
    icon: Building2,
    title: { en: 'Properties', ru: 'Объекты' },
    description: { en: 'Full property lifecycle management', ru: 'Полное управление жизненным циклом объектов' },
    features: [
      { en: 'Add unlimited properties with rich media (photos, descriptions, amenities)', ru: 'Добавление неограниченного количества объектов с медиа (фото, описания, удобства)' },
      { en: 'Property grouping by complexes', ru: 'Группировка объектов по комплексам' },
      { en: 'Inventory tracking (furniture, appliances, documents)', ru: 'Учёт инвентаря (мебель, техника, документы)' },
      { en: 'Utility meter readings and billing', ru: 'Показания счётчиков и выставление счетов' },
      { en: 'Property guidebooks for guests', ru: 'Гайдбуки объектов для гостей' },
    ],
  },
  {
    id: 'calendar',
    icon: CalendarDays,
    title: { en: 'Calendar & Bookings', ru: 'Календарь и бронирования' },
    description: { en: 'Unified booking management across all channels', ru: 'Единое управление бронированиями по всем каналам' },
    features: [
      { en: 'Multi-property calendar view (month/week/day)', ru: 'Календарь нескольких объектов (месяц/неделя/день)' },
      { en: 'iCal sync with Airbnb, Booking.com, and other OTAs', ru: 'iCal-синхронизация с Airbnb, Booking.com и другими OTA' },
      { en: 'Manual booking creation with guest details', ru: 'Создание бронирований вручную с данными гостей' },
      { en: 'Check-in / check-out operations with photo reports', ru: 'Операции заселения/выселения с фотоотчётами' },
      { en: 'Deposit management and damage reporting', ru: 'Управление залогами и отчёты о повреждениях' },
    ],
  },
  {
    id: 'crm',
    icon: Users,
    title: { en: 'CRM & Sales', ru: 'CRM и продажи' },
    description: {
      en: 'Lead management in MC. For newbuild and investor deals, switch to Capital — see FAQ «MC CRM vs Capital».',
      ru: 'Управление лидами в MC. Сделки по newbuild и инвестициям — в Capital; см. FAQ «MC CRM и Capital».',
    },
    features: [
      { en: 'Contact database with segmentation and tags', ru: 'База контактов с сегментацией и тегами' },
      { en: 'Customizable sales pipelines with drag-and-drop stages', ru: 'Настраиваемые воронки продаж с перетаскиванием этапов' },
      { en: 'Email campaigns and sequences', ru: 'Email-рассылки и автоматические цепочки' },
      { en: 'Web forms for lead capture', ru: 'Веб-формы для сбора лидов' },
      { en: 'Quote/proposal generation', ru: 'Генерация коммерческих предложений' },
      { en: 'Duplicate detection and contact merging', ru: 'Обнаружение дубликатов и объединение контактов' },
    ],
  },
  {
    id: 'finance',
    icon: DollarSign,
    title: { en: 'Finance', ru: 'Финансы' },
    description: { en: 'Revenue tracking, expense management, and reporting', ru: 'Учёт доходов, управление расходами и отчётность' },
    features: [
      { en: 'Income and expense tracking per property', ru: 'Учёт доходов и расходов по каждому объекту' },
      { en: 'Monthly owner financial statements', ru: 'Ежемесячные финансовые отчёты для собственников' },
      { en: 'Budget planning and variance analysis', ru: 'Планирование бюджета и анализ отклонений' },
      { en: 'Invoice generation and payment tracking', ru: 'Генерация счетов и отслеживание оплат' },
      { en: 'Multi-currency support (THB, USD, EUR, RUB)', ru: 'Мультивалютная поддержка (THB, USD, EUR, RUB)' },
      { en: 'Customizable financial categories', ru: 'Настраиваемые финансовые категории' },
    ],
  },
  {
    id: 'tasks',
    icon: ClipboardList,
    title: { en: 'Tasks & Operations', ru: 'Задачи и операции' },
    description: { en: 'Task management for your team', ru: 'Управление задачами для вашей команды' },
    features: [
      { en: 'Create and assign tasks to team members', ru: 'Создание и назначение задач сотрудникам' },
      { en: 'Task templates for recurring operations', ru: 'Шаблоны задач для повторяющихся операций' },
      { en: 'Priority levels and due dates', ru: 'Уровни приоритета и сроки выполнения' },
      { en: 'Kanban board and list views', ru: 'Канбан-доска и список задач' },
      { en: 'Vendor coordination for maintenance', ru: 'Координация поставщиков для обслуживания' },
    ],
  },
  {
    id: 'team',
    icon: Users,
    title: { en: 'Team Management', ru: 'Управление командой' },
    description: { en: 'Staff hierarchy and access control', ru: 'Иерархия сотрудников и контроль доступа' },
    features: [
      { en: 'Role-based access: Director → Admin → Manager → Staff', ru: 'Ролевой доступ: Директор → Администратор → Менеджер → Сотрудник' },
      { en: 'Module-level permissions (CRM, Finance, Bookings, etc.)', ru: 'Права на уровне модулей (CRM, Финансы, Бронирования и т.д.)' },
      { en: 'Property assignment per team member', ru: 'Назначение объектов каждому сотруднику' },
      { en: 'Email invitations with auto-generated credentials', ru: 'Email-приглашения с автоматически сгенерированными учётными данными' },
      { en: 'Activity audit trail', ru: 'Журнал аудита действий' },
    ],
  },
  {
    id: 'reports',
    icon: BarChart3,
    title: { en: 'Reports & Analytics', ru: 'Отчёты и аналитика' },
    description: { en: 'Data-driven insights for your business', ru: 'Аналитика для принятия решений' },
    features: [
      { en: 'Occupancy rate analytics', ru: 'Аналитика загрузки объектов' },
      { en: 'Revenue trends and forecasting', ru: 'Тренды дохода и прогнозирование' },
      { en: 'Owner monthly statements with auto-send', ru: 'Ежемесячные отчёты собственникам с авторассылкой' },
      { en: 'Export to PDF and Excel', ru: 'Экспорт в PDF и Excel' },
      { en: 'Comparative analysis across properties', ru: 'Сравнительный анализ между объектами' },
    ],
  },
];

interface SecurityItem {
  icon: React.ElementType;
  title: { en: string; ru: string };
  description: { en: string; ru: string };
}

const SECURITY_ITEMS: SecurityItem[] = [
  {
    icon: Lock,
    title: { en: 'Data Encryption', ru: 'Шифрование данных' },
    description: { en: 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Your financial data, guest information, and business documents are fully protected.', ru: 'Все данные зашифрованы при передаче (TLS 1.3) и при хранении (AES-256). Ваши финансовые данные, информация о гостях и бизнес-документы полностью защищены.' },
  },
  {
    icon: Shield,
    title: { en: 'Role-Based Access Control', ru: 'Ролевой контроль доступа' },
    description: { en: 'Each team member gets access only to the modules they need. Directors see everything, managers see their properties, staff sees only their tasks. Permissions are enforced at database level.', ru: 'Каждый сотрудник получает доступ только к нужным модулям. Директоры видят всё, менеджеры — свои объекты, сотрудники — только свои задачи. Права применяются на уровне базы данных.' },
  },
  {
    icon: Database,
    title: { en: 'Data Backup & Recovery', ru: 'Бэкап и восстановление данных' },
    description: { en: 'Automatic daily backups with 30-day retention. You can also manually export all your data (properties, CRM, finances) at any time via Settings → Data.', ru: 'Автоматические ежедневные бэкапы с хранением 30 дней. Вы также можете вручную экспортировать все данные (объекты, CRM, финансы) в любой момент через Настройки → Данные.' },
  },
  {
    icon: Globe,
    title: { en: 'GDPR & Privacy Compliance', ru: 'Соответствие GDPR и конфиденциальность' },
    description: { en: 'Guest personal data is handled in accordance with GDPR principles. Data minimization, right to deletion, and consent management are built into the platform.', ru: 'Персональные данные гостей обрабатываются в соответствии с принципами GDPR. Минимизация данных, право на удаление и управление согласиями встроены в платформу.' },
  },
  {
    icon: RefreshCw,
    title: { en: '99.9% Uptime SLA', ru: 'SLA доступности 99.9%' },
    description: { en: 'Our infrastructure runs on enterprise-grade cloud servers with automatic failover. Your data is replicated across multiple availability zones.', ru: 'Наша инфраструктура работает на корпоративных облачных серверах с автоматическим переключением. Ваши данные реплицируются в нескольких зонах доступности.' },
  },
  {
    icon: FileText,
    title: { en: 'Audit Logging', ru: 'Журнал аудита' },
    description: { en: 'All critical actions (login, data changes, financial operations, team changes) are logged with timestamps and user IDs for full transparency and accountability.', ru: 'Все критические действия (вход, изменения данных, финансовые операции, изменения команды) логируются с метками времени и ID пользователей для полной прозрачности.' },
  },
];

// ═══════════════════════════════════════════
// AI ASSISTANT COMPONENT (inline)
// ═══════════════════════════════════════════

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function HelpAIAssistant({ isRu }: { isRu: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const streamChat = async (msgs: ChatMessage[]) => {
    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: isRu
            ? 'Ты — помощник по использованию PMS-системы myUNO для управляющих компаний. Отвечай на вопросы о функционале системы, подписках, настройках, CRM, финансах, календаре, управлении командой. Отвечай кратко и по делу на русском языке.'
            : 'You are a help assistant for the myUNO PMS system for property management companies. Answer questions about system features, subscriptions, settings, CRM, finance, calendar, team management. Be concise and helpful.' },
          ...msgs,
        ],
      }),
    });
    if (!resp.ok || !resp.body) throw new Error('Stream failed');

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let assistantContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });
      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') return;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
              }
              return [...prev, { role: 'assistant', content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    try {
      await streamChat(newMessages);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: isRu ? 'Ошибка. Попробуйте позже.' : 'Error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQs = isRu
    ? ['Как добавить объект?', 'Как пригласить сотрудника?', 'Как работает подписка?', 'Как экспортировать данные?']
    : ['How to add a property?', 'How to invite a team member?', 'How does subscription work?', 'How to export data?'];

  return (
    <Card className="h-[500px] flex flex-col">
      <div className="p-4 border-b flex items-center gap-3 bg-primary/5">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">{isRu ? 'AI Помощник PMS' : 'PMS AI Assistant'}</p>
          <p className="text-xs text-muted-foreground">{isRu ? 'Спросите о любой функции системы' : 'Ask about any system feature'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <Bot className="h-10 w-10 mx-auto mb-3 text-primary/40" />
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Задайте вопрос о системе' : 'Ask a question about the system'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickQs.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  className="text-left p-2.5 rounded-none bg-muted/50 hover:bg-muted text-xs transition-colors"
                >
                  <ChevronRight className="h-3 w-3 inline mr-1 text-primary" />
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0', msg.role === 'user' ? 'bg-primary' : 'bg-primary/10')}>
                  {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-primary-foreground" /> : <Bot className="w-3.5 h-3.5 text-primary" />}
                </div>
                <div className={cn('rounded-none px-3 py-2 max-w-[85%] text-sm', msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-none' : 'bg-muted rounded-none')}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="rounded-none bg-muted px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={isRu ? 'Спросите о системе...' : 'Ask about the system...'}
            disabled={isLoading}
            className="flex-1 h-9"
          />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon" className="h-9 w-9">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════
// MAIN HELP PAGE
// ═══════════════════════════════════════════

export default function MCHelpPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [search, setSearch] = useState('');

  const filteredFAQ = FAQ_ITEMS.filter(item => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.q.en.toLowerCase().includes(q) ||
      item.q.ru.toLowerCase().includes(q) ||
      item.a.en.toLowerCase().includes(q) ||
      item.a.ru.toLowerCase().includes(q)
    );
  });

  const filteredFeatures = FEATURE_SECTIONS.filter(section => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      section.title.en.toLowerCase().includes(q) ||
      section.title.ru.toLowerCase().includes(q) ||
      section.features.some(f => f.en.toLowerCase().includes(q) || f.ru.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <Helmet>
        <title>{isRu ? 'Справочник — PMS' : 'Help Center — PMS'}</title>
      </Helmet>

      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" />
              {isRu ? 'Справочник системы' : 'Help Center'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Руководство, FAQ и AI-помощник по работе с PMS' : 'Guide, FAQ, and AI assistant for PMS'}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isRu ? 'Поиск по справочнику...' : 'Search help...'}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="faq">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="faq" className="gap-1.5 text-xs">
              <HelpCircle className="h-3.5 w-3.5" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-1.5 text-xs">
              <Zap className="h-3.5 w-3.5" />
              {isRu ? 'Функционал' : 'Features'}
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5 text-xs">
              <Shield className="h-3.5 w-3.5" />
              {isRu ? 'Безопасность' : 'Security'}
            </TabsTrigger>
            <TabsTrigger value="assistant" className="gap-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              {isRu ? 'AI Помощник' : 'AI Assistant'}
            </TabsTrigger>
          </TabsList>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Accordion type="multiple" className="w-full">
                  {filteredFAQ.map((item, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="border-b last:border-0">
                      <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline text-left">
                        {isRu ? item.q.ru : item.q.en}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">
                        {isRu ? item.a.ru : item.a.en}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                  {filteredFAQ.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      {isRu ? 'Ничего не найдено' : 'No results found'}
                    </div>
                  )}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="mt-4">
            <Accordion type="multiple" className="space-y-2">
              {filteredFeatures.map(section => {
                const Icon = section.icon;
                return (
                  <AccordionItem key={section.id} value={section.id} className="border rounded-none bg-card px-0">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-8 h-8 rounded-none bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{isRu ? section.title.ru : section.title.en}</p>
                          <p className="text-xs text-muted-foreground">{isRu ? section.description.ru : section.description.en}</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <ul className="space-y-2 ml-11">
                        {section.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Star className="h-3.5 w-3.5 text-primary/60 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{isRu ? f.ru : f.en}</span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SECURITY_ITEMS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-none bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold mb-1">{isRu ? item.title.ru : item.title.en}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{isRu ? item.description.ru : item.description.en}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Separator className="my-6" />

            {/* Contact support */}
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="flex flex-col sm:flex-row items-center gap-4 py-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm font-medium">{isRu ? 'Остались вопросы?' : 'Still have questions?'}</p>
                  <p className="text-xs text-muted-foreground">
                    {isRu ? 'Свяжитесь с нашей командой поддержки' : 'Contact our support team'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="gap-2 shrink-0"
                  onClick={() => window.open('https://wa.me/66922407355', '_blank')}
                >
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="assistant" className="mt-4">
            <HelpAIAssistant isRu={isRu} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
