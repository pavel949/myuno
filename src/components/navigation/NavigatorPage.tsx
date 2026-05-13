/**
 * NavigatorPage v2  —  spec 04.6 · «Карта острова для жизни. Один поток.»
 *
 * Changes from v1 per audit:
 *  - SOS strip above hero (not as first tile)
 *  - Persona toggle (Иностранец/Резидент/Инвестор/Собственник) replaces JTBD selects
 *  - Situational entry cards (JTBD scenarios) above service grid
 *  - Semantic colors per category (spec §04.1)
 *  - Status badges on every tile: FREE/PARTNER/NEW/SOON/KYC/VIP/24-7/LIVE
 *  - Featured 2×2 hero-tiles per cluster (Виза-пакет, ROI Hub) with live stats
 *  - Flat responsive grid per cluster (no sub-category labels in grid)
 *  - Search with «Сейчас ищут» popular queries
 *  - Trust strip (23+ объектов · 48+ партнёров…) above footer
 *  - text-wrap:balance + word-break:keep-all prevents mid-word breaks
 *  - Workspace clusters hidden unless user has matching role
 */
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Search, LayoutGrid, X,
  AlertTriangle, Plane, Home, TrendingUp, Stethoscope,
  MapPin, Smartphone, ArrowLeftRight, DollarSign,
  Crown, MessageCircle, Car, Zap, Anchor, Route, Waves, CalendarDays, Compass,
  Clock, Package, Bug, Hammer, Wrench, Wind, KeyRound, TreePine, Leaf,
  Warehouse, Truck, Utensils, ShoppingBag, Bandage, Palette, Dumbbell, Shield,
  Baby, GraduationCap, Search as SearchIcon, PawPrint,
  Building2, Building, Scale, HardHat, FileText, Calculator,
  Lock, Droplet, RefreshCcw, Sparkles, ClipboardList,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  isClusterVisibleToUser,
  useLiveClusterCatalog,
  getClusterHeaderLabel,
  getClusterServiceLocalizedLabel,
  type ClusterService,
  type ClusterCatalogEntry,
} from '@/lib/nav/clusterCatalog';
import { resolveNavRole } from '@/lib/nav/navigationModel';
import { isEligibleLeafService } from '@/lib/catalog/catalogMetrics';
import { APP_ROUTES } from '@/lib/config/routes';
import type { Language } from '@/i18n';

// ─── Category color palettes (spec §04.1) ───────────────────────────────────

const CAT_COLOR: Record<string, { dot: string; iconBg: string; iconFg: string }> = {
  arrive: { dot: '#5B8FCC', iconBg: 'rgba(91,143,204,0.18)',  iconFg: '#8FB6E5' },
  live:   { dot: '#B6CFE9', iconBg: 'rgba(127,167,216,0.15)', iconFg: '#B6CFE9' },
  manage: { dot: '#1F7A4C', iconBg: 'rgba(31,122,76,0.20)',   iconFg: '#6FCB99' },
  invest: { dot: '#D96B1A', iconBg: 'rgba(217,107,26,0.18)',  iconFg: '#F3924A' },
  legal:  { dot: '#0A2240', iconBg: 'rgba(10,34,64,0.50)',    iconFg: '#C8D6E8' },
  build:  { dot: '#6E5A8C', iconBg: 'rgba(110,90,140,0.25)',  iconFg: '#C9B6E2' },
};

function catColor(clusterId: string) {
  return CAT_COLOR[clusterId] ?? CAT_COLOR.live;
}

// ─── Status badges (spec §04.2) ─────────────────────────────────────────────

type Badge = 'free' | 'partner' | 'new' | 'soon' | 'kyc' | 'vip' | 'live' | '24-7';

const BADGE_LABEL: Record<Badge, string> = {
  free: 'FREE', partner: 'PARTNER', new: 'NEW', soon: 'SOON',
  kyc: 'KYC', vip: 'VIP', live: 'LIVE', '24-7': '24/7',
};

const BADGE_BG: Record<Badge, string> = {
  free:    'rgba(31,122,76,0.3)',
  partner: 'rgba(107,143,204,0.22)',
  new:     '#D96B1A',
  soon:    'rgba(255,255,255,0.12)',
  kyc:     'rgba(217,107,26,0.22)',
  vip:     '#D96B1A',
  live:    'rgba(31,122,76,0.3)',
  '24-7':  'rgba(217,107,26,0.22)',
};

const BADGE_TEXT: Record<Badge, string> = {
  free: '#4EB883', partner: '#8FB6E5', new: '#fff', soon: 'rgba(255,255,255,0.65)',
  kyc: '#D96B1A', vip: '#fff', live: '#4EB883', '24-7': '#D96B1A',
};

// ─── Icon overrides by service ID (unique icon per service, spec §04.3) ─────

const ICON_BY_ID: Partial<Record<string, LucideIcon>> = {
  'sos':           AlertTriangle,
  'vip-concierge': Crown,
  'support':       MessageCircle,
  'transfer':      MapPin,
  'fast-track':    Zap,
  'vehicle':       Car,
  'sim':           Smartphone,
  'exchange':      ArrowLeftRight,
  'experience':    Compass,
  'tours':         Route,
  'water':         Waves,
  'yacht':         Anchor,
  'event':         CalendarDays,
  'cleaning':      Clock,
  'laundry':       RefreshCcw,
  'pest-control':  Bug,
  'handyman':      Hammer,
  'plumbing':      Droplet,
  'electrical':    Zap,
  'ac-repair':     Wind,
  'locksmith':     KeyRound,
  'gardening':     TreePine,
  'flowers':       Leaf,
  'storage':       Warehouse,
  'services':      Wrench,
  'restaurant':    Utensils,
  'delivery':      Truck,
  'market':        ShoppingBag,
  'medical':       Stethoscope,
  'pharmacy':      Bandage,
  'beauty':        Palette,
  'fitness':       Dumbbell,
  'insurance':     Shield,
  'babysitter':    Baby,
  'school-finder': SearchIcon,
  'education':     GraduationCap,
  'kids':          Baby,
  'pets':          PawPrint,
  'veterinary':    Stethoscope,
  'visa':          Lock,
  'legal':         Scale,
  'tax':           Calculator,
  'contract-ai':   FileText,
  'offplan':       Building2,
  'resale':        Home,
  'due-diligence': Shield,
};

// ─── Service badges + meta text by service ID ───────────────────────────────

type ServiceMeta = { badge?: Badge; metaRu?: string; metaEn?: string };

const SERVICE_META: Partial<Record<string, ServiceMeta>> = {
  'sos':           { badge: '24-7', metaRu: '· экстренно',        metaEn: '· emergency' },
  'vip-concierge': { badge: 'vip',  metaRu: 'от ฿15 000/мес',    metaEn: 'from ฿15 000/mo' },
  'support':       { badge: 'free', metaRu: 'бесплатно',          metaEn: 'free' },
  'transfer':      { badge: 'partner', metaRu: 'от ฿800',         metaEn: 'from ฿800' },
  'fast-track':    { badge: 'partner', metaRu: 'аэропорт · VIP',  metaEn: 'airport · VIP' },
  'vehicle':       { badge: 'partner', metaRu: 'долгосрочно · с правами', metaEn: 'long-term · licensed' },
  'sim':           { badge: 'partner', metaRu: 'AIS · True · DTAC', metaEn: 'AIS · True · DTAC' },
  'exchange':      { badge: 'free',   metaRu: 'USD · EUR · RUB · ฿', metaEn: 'USD · EUR · RUB · ฿' },
  'experience':    { badge: 'partner', metaRu: 'туры и активности', metaEn: 'tours & activities' },
  'tours':         { badge: 'partner' },
  'water':         { badge: 'partner', metaRu: 'водный спорт', metaEn: 'water sports' },
  'yacht':         { badge: 'partner' },
  'event':         { badge: 'partner' },
  'cleaning':      { metaRu: 'от ฿500',          metaEn: 'from ฿500' },
  'laundry':       { badge: 'partner', metaRu: 'с доставкой', metaEn: 'with delivery' },
  'pest-control':  { badge: 'partner' },
  'handyman':      { badge: 'partner' },
  'plumbing':      { metaRu: '24/7 · от ฿800',   metaEn: '24/7 · from ฿800' },
  'electrical':    { metaRu: 'от ฿700',           metaEn: 'from ฿700' },
  'ac-repair':     { metaRu: 'обслуживание',       metaEn: 'maintenance' },
  'locksmith':     { badge: 'partner' },
  'gardening':     { metaRu: 'подрядчик · разово', metaEn: 'contractor · one-off' },
  'flowers':       { badge: 'partner', metaRu: 'доставка', metaEn: 'delivery' },
  'restaurant':    { badge: 'partner' },
  'delivery':      { badge: 'partner', metaRu: 'FoodPanda · LineMan', metaEn: 'FoodPanda · LineMan' },
  'market':        { badge: 'partner' },
  'medical':       { badge: 'new',  metaRu: 'с переводом',   metaEn: 'with interpreter' },
  'pharmacy':      { badge: 'partner', metaRu: 'доставка 30 мин', metaEn: 'delivery 30 min' },
  'beauty':        { badge: 'partner' },
  'fitness':       { badge: 'partner' },
  'insurance':     { metaRu: 'Cigna · BUPA',      metaEn: 'Cigna · BUPA' },
  'babysitter':    { badge: 'partner' },
  'school-finder': { badge: 'partner', metaRu: 'RU · IB · TH', metaEn: 'RU · IB · TH' },
  'education':     { badge: 'partner' },
  'pets':          { badge: 'soon',  metaRu: 'ветка · ввоз · няня', metaEn: 'vet · import · sitter' },
  'veterinary':    { badge: 'partner' },
};

// ─── Cluster featured tiles (editorial, per spec mockup) ────────────────────

interface FeaturedTileData {
  nameRu: string; nameEn: string;
  descRu: string; descEn: string;
  stat: string;
  statLabelRu: string; statLabelEn: string;
  badge: Badge;
  icon: LucideIcon;
  path: string;
}

const CLUSTER_FEATURED: Partial<Record<string, FeaturedTileData>> = {
  arrive: {
    nameRu: 'Виза-пакет', nameEn: 'Visa Pack',
    descRu: 'DTV / Elite / SMART — оценка кандидатуры за 24 часа.',
    descEn: 'DTV / Elite / SMART — candidate assessment in 24 hours.',
    stat: '47',
    statLabelRu: 'заявок сегодня · 100% одобрено',
    statLabelEn: 'applications today · 100% approved',
    badge: 'new', icon: Lock, path: APP_ROUTES.LEGAL_CLUSTER,
  },
  invest: {
    nameRu: 'ROI Hub', nameEn: 'ROI Hub',
    descRu: 'Реальный ROI по 23 ЖК Пхукета. Усреднено 7.4% за 2025.',
    descEn: 'Real ROI data for 23 Phuket projects. Average 7.4% in 2025.',
    stat: '7.4%',
    statLabelRu: 'средний ROI · обновлено вчера',
    statLabelEn: 'average ROI · updated yesterday',
    badge: 'live', icon: TrendingUp, path: APP_ROUTES.INVEST,
  },
};

// ─── Situational entry cards (spec §05 «Добавить в v2») ─────────────────────

const SITUATIONS = [
  {
    id: 'arrived',
    icon: Plane,
    titleRu: 'Только приехал', titleEn: 'Just arrived',
    stepsRu: 'Аэропорт → SIM → банк → жильё. 4 шага, 3 часа.',
    stepsEn: 'Airport → SIM → bank → housing. 4 steps, 3 hours.',
    svcRu: '14 СЕРВИСОВ', svcEn: '14 SERVICES',
    timeRu: '90 МИН', timeEn: '90 MIN',
    filterId: 'arrive',
  },
  {
    id: 'renting',
    icon: Home,
    titleRu: 'Снимаю жильё', titleEn: 'Renting a place',
    stepsRu: 'Поиск, ContractAI, депозит, въезд, уборка.',
    stepsEn: 'Search, ContractAI, deposit, move-in, cleaning.',
    svcRu: '9 СЕРВИСОВ', svcEn: '9 SERVICES',
    timeRu: '7 ДНЕЙ', timeEn: '7 DAYS',
    filterId: 'live',
  },
  {
    id: 'buying',
    icon: TrendingUp,
    titleRu: 'Покупаю квартиру', titleEn: 'Buying a unit',
    stepsRu: 'Due Diligence → ROI → договор → перевод.',
    stepsEn: 'Due Diligence → ROI → contract → transfer.',
    svcRu: '11 СЕРВИСОВ', svcEn: '11 SERVICES',
    timeRu: '~30 ДНЕЙ', timeEn: '~30 DAYS',
    filterId: 'invest',
  },
  {
    id: 'medical',
    icon: Stethoscope,
    titleRu: 'Нужен врач сейчас', titleEn: 'Need a doctor now',
    stepsRu: 'Симптомы → клиника → перевод → страховка.',
    stepsEn: 'Symptoms → clinic → interpreter → insurance.',
    svcRu: '5 СЕРВИСОВ', svcEn: '5 SERVICES',
    timeRu: '30 МИН', timeEn: '30 MIN',
    filterId: 'live',
  },
  {
    id: 'visa-extend',
    icon: FileText,
    titleRu: 'Продлить визу', titleEn: 'Extend visa',
    stepsRu: 'DTV → Border run → Elite. Проверим лучший сценарий.',
    stepsEn: 'DTV → Border run → Elite. We validate the best path.',
    svcRu: '8 СЕРВИСОВ', svcEn: '8 SERVICES',
    timeRu: '48 ЧАСОВ', timeEn: '48 HOURS',
    filterId: 'legal',
  },
  {
    id: 'banking',
    icon: Building,
    titleRu: 'Открыть банк', titleEn: 'Open bank account',
    stepsRu: 'Bangkok Bank, KBank, SCB + документы и перевод.',
    stepsEn: 'Bangkok Bank, KBank, SCB + docs and translation.',
    svcRu: '6 СЕРВИСОВ', svcEn: '6 SERVICES',
    timeRu: '1 ДЕНЬ', timeEn: '1 DAY',
    filterId: 'legal',
  },
  {
    id: 'due-diligence',
    icon: ClipboardList,
    titleRu: 'Due Diligence', titleEn: 'Due Diligence',
    stepsRu: 'Проверка объекта → отчёт → решение по сделке.',
    stepsEn: 'Asset check → report → transaction decision.',
    svcRu: '7 СЕРВИСОВ', svcEn: '7 SERVICES',
    timeRu: '72 ЧАСА', timeEn: '72 HOURS',
    filterId: 'invest',
  },
  {
    id: 'roi',
    icon: DollarSign,
    titleRu: 'ROI анализ', titleEn: 'ROI analysis',
    stepsRu: '23 ЖК, сравнение доходности, калькулятор стратегии.',
    stepsEn: '23 projects, yield comparison, strategy calculator.',
    svcRu: '9 СЕРВИСОВ', svcEn: '9 SERVICES',
    timeRu: '30 МИН', timeEn: '30 MIN',
    filterId: 'invest',
  },
  {
    id: 'legal-support',
    icon: Scale,
    titleRu: 'Юр. сопровождение', titleEn: 'Legal support',
    stepsRu: 'Договор, налоги, структура владения и защита рисков.',
    stepsEn: 'Contract, taxes, ownership structure and risk protection.',
    svcRu: '10 СЕРВИСОВ', svcEn: '10 SERVICES',
    timeRu: '3 ДНЯ', timeEn: '3 DAYS',
    filterId: 'legal',
  },
  {
    id: 'rent-out',
    icon: Home,
    titleRu: 'Сдать в аренду', titleEn: 'Rent out property',
    stepsRu: 'УК, каналы продаж, pricing, запуск и контроль заявок.',
    stepsEn: 'Management, channels, pricing, launch and lead tracking.',
    svcRu: '8 СЕРВИСОВ', svcEn: '8 SERVICES',
    timeRu: '5 ДНЕЙ', timeEn: '5 DAYS',
    filterId: 'invest',
  },
  {
    id: 'manage',
    icon: Building2,
    titleRu: 'Управление объектом', titleEn: 'Asset management',
    stepsRu: 'PMS, уборка, обслуживание, отчёты и KPI.',
    stepsEn: 'PMS, cleaning, maintenance, reports and KPI.',
    svcRu: '12 СЕРВИСОВ', svcEn: '12 SERVICES',
    timeRu: 'ONGOING', timeEn: 'ONGOING',
    filterId: 'invest',
  },
  {
    id: 'tax',
    icon: Calculator,
    titleRu: 'Налоги', titleEn: 'Taxes',
    stepsRu: 'Тайская структура, REMIT rule, планирование выплат.',
    stepsEn: 'Thai structure, REMIT rule, payout planning.',
    svcRu: '7 СЕРВИСОВ', svcEn: '7 SERVICES',
    timeRu: '2 ДНЯ', timeEn: '2 DAYS',
    filterId: 'legal',
  },
] as const;

const POPULAR = {
  ru: ['визу', 'врача', 'доставку еды', 'SIM', 'долгосрочную аренду'],
  en: ['visa', 'doctor', 'food delivery', 'SIM', 'long-term rental'],
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const BadgePill = React.memo(function BadgePill({ badge }: { badge: Badge }) {
  return (
    <span
      className="absolute top-2 right-2 rounded-none px-1 py-px font-mono text-[7.5px] font-bold tracking-[0.06em]"
      style={{ background: BADGE_BG[badge], color: BADGE_TEXT[badge] }}
    >
      {BADGE_LABEL[badge]}
    </span>
  );
});

function ServiceTile({
  service, clusterId, language, onNavigate,
}: {
  service: ClusterService; clusterId: string; language: Language; onNavigate: (p: string) => void;
}) {
  const meta = SERVICE_META[service.id ?? ''] ?? {};
  const badge = meta.badge;
  const metaText = language === 'ru' ? meta.metaRu : meta.metaEn;
  const isSoon = service.status === 'soon';
  const col = catColor(clusterId);
  const Icon = ICON_BY_ID[service.id ?? ''] ?? service.icon;
  const label = getClusterServiceLocalizedLabel(service, language);

  return (
    <button
      onClick={() => !isSoon && onNavigate(service.path)}
      disabled={isSoon}
      className="relative flex flex-col gap-2.5 p-3.5 rounded-[10px] text-left transition-all duration-150 hover:bg-white/[0.06] hover:border-white/20 hover:-translate-y-px active:scale-[0.97] disabled:cursor-default disabled:hover:translate-y-0"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        minHeight: '116px',
        opacity: isSoon ? 0.65 : 1,
      }}
      aria-label={label}
    >
      {badge && <BadgePill badge={badge} />}
      <div
        className="flex items-center justify-center w-7 h-7 rounded-[7px] shrink-0"
        style={{ background: col.iconBg }}
      >
        <Icon className="w-4 h-4 shrink-0" style={{ color: col.iconFg }} />
      </div>
      <div className="flex-1 flex flex-col justify-end gap-0.5 min-w-0">
        <span
          className="text-[12px] font-semibold leading-tight text-[#F5F4F0] break-words"
          style={{ wordBreak: 'keep-all', textWrap: 'balance' } as React.CSSProperties}
        >
          {label}
        </span>
        {metaText && (
          <span className="font-mono text-[9px] uppercase tracking-[0.05em] text-white/40 leading-tight">
            {metaText}
          </span>
        )}
      </div>
    </button>
  );
}

function FeaturedTile({
  data, language, onNavigate,
}: {
  data: FeaturedTileData; language: Language; onNavigate: (p: string) => void;
}) {
  const Icon = data.icon;
  return (
    <button
      onClick={() => onNavigate(data.path)}
      className="relative col-span-2 row-span-2 flex flex-col justify-between p-[22px] rounded-[10px] text-left transition-all duration-150 hover:-translate-y-px active:scale-[0.98]"
      style={{
        background: 'linear-gradient(135deg, rgba(217,107,26,0.18), rgba(217,107,26,0.04))',
        border: '1px solid rgba(217,107,26,0.3)',
        minHeight: '240px',
      }}
    >
      <BadgePill badge={data.badge} />
      <div
        className="flex items-center justify-center w-9 h-9 rounded-[8px]"
        style={{ background: 'rgba(217,107,26,0.2)' }}
      >
        <Icon className="w-[18px] h-[18px]" style={{ color: '#F3924A' }} />
      </div>
      <div className="flex flex-col gap-1">
        <h6
          className="text-[18px] leading-[23px] text-white"
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 500 }}
        >
          {language === 'ru' ? data.nameRu : data.nameEn}
        </h6>
        <p className="text-[12px] text-white/60 leading-[17px]">
          {language === 'ru' ? data.descRu : data.descEn}
        </p>
      </div>
      <div>
        <span className="font-mono text-[22px] font-medium text-white tracking-[-0.02em] leading-none">
          {data.stat}
        </span>
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/45 mt-1">
          {language === 'ru' ? data.statLabelRu : data.statLabelEn}
        </p>
      </div>
    </button>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

type PersonaId = 'foreigner' | 'resident' | 'investor' | 'owner';

const PERSONA_CONFIG: Record<
  PersonaId,
  { clusterOrder: string[]; hiddenServiceIds: string[]; situationIds: string[] }
> = {
  foreigner: {
    clusterOrder: ['arrive', 'live', 'invest', 'legal', 'build'],
    hiddenServiceIds: [],
    situationIds: ['arrived', 'renting', 'buying', 'medical'],
  },
  resident: {
    clusterOrder: ['live', 'legal', 'arrive', 'invest', 'build'],
    hiddenServiceIds: ['tours', 'water', 'yacht', 'experience', 'event', 'event-live', 'experience-live', 'water-live'],
    situationIds: ['visa-extend', 'renting', 'banking', 'medical'],
  },
  investor: {
    clusterOrder: ['invest', 'legal', 'build', 'arrive', 'live'],
    hiddenServiceIds: [
      'cleaning', 'laundry', 'pest-control', 'handyman', 'plumbing', 'electrical',
      'ac-repair', 'locksmith', 'gardening', 'flowers', 'storage', 'services',
      'delivery', 'market', 'beauty', 'fitness', 'babysitter', 'kids',
      'school-finder', 'education', 'pets', 'veterinary', 'community', 'wedding',
    ],
    situationIds: ['buying', 'due-diligence', 'roi', 'legal-support'],
  },
  owner: {
    clusterOrder: ['invest', 'legal', 'live', 'arrive', 'build'],
    hiddenServiceIds: [
      'tours', 'water', 'yacht', 'experience', 'event', 'event-live', 'experience-live',
      'water-live', 'community', 'wedding', 'babysitter', 'kids',
    ],
    situationIds: ['rent-out', 'manage', 'tax', 'legal-support'],
  },
};

export default function NavigatorPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { personas } = useUserPersonas();

  const [activePersona, setActivePersona] = useState<PersonaId>('foreigner');
  const [query, setQuery] = useState('');
  const [activeCluster, setActiveCluster] = useState<string | null>(null);

  useEffect(() => {
    setActiveCluster(null);
  }, [activePersona]);

  const role = useMemo(
    () =>
      resolveNavRole({
        activeRole: (user?.user_metadata as { role?: string } | undefined)?.role ?? null,
        pathname: location.pathname,
      }),
    [user, location.pathname],
  );

  const { catalog: liveCatalog } = useLiveClusterCatalog();

  const audienceClusters: ClusterCatalogEntry[] = useMemo(
    () =>
      liveCatalog.filter(
        (c) =>
          isClusterVisibleToUser(c, { personas, role }) &&
          c.services.filter(isEligibleLeafService).length > 0,
      ),
    [liveCatalog, personas, role],
  );

  const personaServiceCounts = useMemo(() => {
    const calc = (persona: PersonaId) => {
      const cfg = PERSONA_CONFIG[persona];
      return audienceClusters
        .filter((c) => cfg.clusterOrder.includes(c.id))
        .flatMap((c) =>
          c.services.filter(
            (s) => isEligibleLeafService(s) && !cfg.hiddenServiceIds.includes(s.id ?? ''),
          ),
        )
        .length;
    };

    return {
      foreigner: calc('foreigner'),
      resident: calc('resident'),
      investor: calc('investor'),
      owner: calc('owner'),
    };
  }, [audienceClusters]);

  const totalServices = personaServiceCounts[activePersona] ?? 0;

  const personaTabs = useMemo(() => [
    { id: 'foreigner' as PersonaId, labelRu: 'Иностранец', labelEn: 'Foreigner', count: personaServiceCounts.foreigner },
    { id: 'resident'  as PersonaId, labelRu: 'Резидент',   labelEn: 'Resident',  count: personaServiceCounts.resident },
    { id: 'investor'  as PersonaId, labelRu: 'Инвестор',   labelEn: 'Investor',  count: personaServiceCounts.investor },
    { id: 'owner'     as PersonaId, labelRu: 'Собственник', labelEn: 'Owner',    count: personaServiceCounts.owner },
  ], [personaServiceCounts]);

  const personaClusters = useMemo(() => {
    const cfg = PERSONA_CONFIG[activePersona];
    return audienceClusters
      .filter((c) => cfg.clusterOrder.includes(c.id))
      .sort((a, b) => cfg.clusterOrder.indexOf(a.id) - cfg.clusterOrder.indexOf(b.id))
      .map((c) => ({
        ...c,
        services: c.services.filter(
          (s) => isEligibleLeafService(s) && !cfg.hiddenServiceIds.includes(s.id ?? ''),
        ),
      }))
      .filter((c) => c.services.length > 0);
  }, [audienceClusters, activePersona]);

  const clusterFromUrl = searchParams.get('cluster');
  useEffect(() => {
    if (!clusterFromUrl) return;
    const match = personaClusters.find((c) => c.id === clusterFromUrl);
    if (match) setActiveCluster(clusterFromUrl);
  }, [clusterFromUrl, personaClusters]);

  const visibleClusters = useMemo(() => {
    if (activeCluster) {
      const filtered = personaClusters.filter((c) => c.id === activeCluster);
      if (filtered.length > 0) return filtered;
    }
    return personaClusters;
  }, [personaClusters, activeCluster]);

  const allEligible = useMemo(
    () =>
      personaClusters.flatMap((c) =>
        c.services.map((s) => ({
          ...s,
          clusterId: c.id,
          clusterLabelRu: c.labelRu,
          clusterLabelEn: c.labelEn,
        })),
      ),
    [personaClusters],
  );

  const activeSituations = useMemo(
    () => SITUATIONS.filter((s) => PERSONA_CONFIG[activePersona].situationIds.includes(s.id)),
    [activePersona],
  );

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return allEligible.filter((s) => {
      const label = getClusterServiceLocalizedLabel(s, language).toLowerCase();
      const cluster = isRu ? s.clusterLabelRu.toLowerCase() : s.clusterLabelEn.toLowerCase();
      return label.includes(q) || cluster.includes(q);
    });
  }, [query, allEligible, language, isRu]);

  const { data: stats } = useQuery({
    queryKey: ['navigator-v2-stats'],
    queryFn: async () => {
      const [props, provs] = await Promise.all([
        supabase.from('properties').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('providers').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);
      return { properties: props.count ?? 23, providers: provs.count ?? 48 };
    },
    staleTime: 15 * 60 * 1000,
    placeholderData: { properties: 23, providers: 48 },
  });

  return (
    <AppLayout>
      <div
        className="min-h-full -mx-4 px-4 pb-28"
        style={{ background: '#0A2240', color: '#E8ECF2' }}
      >
        <div className="max-w-[1280px] mx-auto py-6 space-y-6">

          {/* ── Hero ──────────────────────────────────────── */}
          <div className="space-y-3">
            <p
              className="font-mono text-[10px] uppercase tracking-[0.14em]"
              style={{ color: 'rgba(217,107,26,0.9)' }}
            >
              {isRu ? 'PHUKET EDITION · LIVE' : 'PHUKET EDITION · LIVE'}
            </p>
            <h1
              className="text-[28px] sm:text-[36px] lg:text-[40px] font-semibold leading-[1.12] tracking-[-0.025em] text-white max-w-3xl"
            >
              {isRu ? (
                <>
                  Карта острова{' '}
                  <em style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#D96B1A', fontWeight: 400 }}>
                    для жизни
                  </em>
                  . Один поток.
                </>
              ) : (
                <>
                  Island map{' '}
                  <em style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#D96B1A', fontWeight: 400 }}>
                    for life
                  </em>
                  . One stream.
                </>
              )}
            </h1>
            <p className="text-[13px] sm:text-[16px] text-white/65 leading-[1.5] max-w-xl">
              {isRu
                ? `${totalServices} сервисов, ${stats?.providers ?? 48}+ проверенных партнёров. Найдите своё за 30 секунд — или нажмите ситуацию ниже.`
                : `${totalServices} services, ${stats?.providers ?? 48}+ verified partners. Find yours in 30 seconds — or tap your situation below.`}
            </p>
          </div>

          {/* ── SOS strip ─────────────────────────────────────── */}
          <button
            onClick={() => navigate(APP_ROUTES.SOS)}
            className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3 text-left rounded-[10px] transition-opacity hover:opacity-95 active:scale-[0.99]"
            style={{
              background: 'linear-gradient(180deg, rgba(180,35,24,0.15), rgba(180,35,24,0.06))',
              border: '1px solid rgba(180,35,24,0.45)',
            }}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
                style={{ background: '#E45F50', boxShadow: '0 0 0 4px rgba(228,95,80,0.25)' }}
              />
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 min-w-0">
                <span className="font-semibold text-[14px] text-white">
                  {isRu ? 'SOS · 24/7 на русском' : 'SOS · 24/7 in English'}
                </span>
                <span className="text-[12px] text-white/65 truncate">
                  {isRu
                    ? 'врач · авария · полиция · ввоз питомца — одно касание'
                    : 'doctor · accident · police · pet import — one tap'}
                </span>
              </div>
            </div>
            <span
              className="shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] font-medium text-white px-3 py-2 rounded-[6px]"
              style={{ border: '1px solid rgba(255,255,255,0.4)' }}
            >
              {isRu ? 'Вызвать →' : 'Call →'}
            </span>
          </button>

          {/* ── Persona toggle ──────────────────────────── */}
          <div
            className="inline-flex gap-1 p-1 flex-wrap"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              width: 'fit-content',
              maxWidth: '100%',
            }}
          >
            {personaTabs.map((tab) => {
              const active = activePersona === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePersona(tab.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-[13px] font-medium leading-none tracking-[-0.005em] transition-all duration-150"
                  style={
                    active
                      ? { background: '#D96B1A', color: '#fff' }
                      : { background: 'transparent', color: 'rgba(255,255,255,0.6)' }
                  }
                >
                  {isRu ? tab.labelRu : tab.labelEn}
                  <span
                    className="font-mono text-[10px]"
                    style={{ opacity: active ? 0.7 : 0.5 }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Search ──────────────────────────────────── */}
          <div className="space-y-2.5 max-w-[720px]">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/50 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isRu ? 'Найти сервис, партнёра или ситуацию…' : 'Find service, partner or situation…'}
                className="w-full text-[15px] outline-none placeholder:text-white/45"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '14px',
                  color: '#F5F4F0',
                  caretColor: '#D96B1A',
                  padding: '16px 60px 16px 50px',
                }}
              />
              <kbd
                className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] px-1.5 py-[3px] rounded-[3px]"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
              >
                ⌘K
              </kbd>
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-14 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {!query && (
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">
                  {isRu ? 'СЕЙЧАС ИЩУТ' : 'POPULAR'}
                </span>
                {(isRu ? POPULAR.ru : POPULAR.en).map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="text-[12px] text-white/75 hover:text-white transition-colors pb-px"
                    style={{ borderBottom: '1px dotted rgba(255,255,255,0.3)' }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Search results ──────────────────────────── */}
          {searchResults !== null && (
            <div>
              {searchResults.length === 0 ? (
                <div className="py-6 text-center space-y-3">
                  <p className="text-white/45 text-sm">
                    {isRu ? 'Ничего не найдено в навигаторе' : 'Nothing matched in the navigator'}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/search?q=${encodeURIComponent(query.trim())}`)}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] bg-white/10 hover:bg-white/15 text-white transition"
                  >
                    {isRu ? 'Искать в каталоге →' : 'Search the catalogue →'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
                    {searchResults.length} {isRu ? 'РЕЗУЛЬТАТОВ' : 'RESULTS'}
                  </p>
                  <div
                    className="grid gap-2"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}
                  >
                    {searchResults.map((s) => (
                      <ServiceTile
                        key={`sr-${s.path}`}
                        service={s}
                        clusterId={s.clusterId}
                        language={language}
                        onNavigate={navigate}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {searchResults === null && (
            <>
              {/* ── Situational cards ─────────────────────── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {activeSituations.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveCluster(s.filterId)}
                      className="relative flex flex-col justify-between gap-3 p-[18px] rounded-[12px] text-left transition-all duration-150 hover:bg-white/[0.06] hover:border-white/20 hover:-translate-y-px active:scale-[0.98]"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        minHeight: '130px',
                      }}
                    >
                      <span className="absolute top-[18px] right-[18px] text-base text-white/40">→</span>
                      <div>
                        <div
                          className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center"
                          style={{ background: 'rgba(217,107,26,0.18)' }}
                        >
                          <Icon className="w-4 h-4" style={{ color: '#D96B1A' }} />
                        </div>
                        <h6 className="text-[15px] font-semibold text-white leading-[19px] tracking-[-0.01em] mt-3.5">
                          {isRu ? s.titleRu : s.titleEn}
                        </h6>
                        <p className="text-[12px] text-white/55 leading-[17px] mt-1.5">
                          {isRu ? s.stepsRu : s.stepsEn}
                        </p>
                      </div>
                      <div className="font-mono text-[10px] text-white/40 uppercase tracking-[0.06em]">
                        {isRu ? `${s.svcRu} · ${s.timeRu}` : `${s.svcEn} · ${s.timeEn}`}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Cluster filter pills */}
              {activeCluster && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveCluster(null)}
                    className="flex items-center gap-1 text-[11px] text-white/50 hover:text-white/80 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    {isRu ? 'Все разделы' : 'All sections'}
                  </button>
                </div>
              )}

              {/* ── Cluster sections ──────────────────────── */}
              <div className="space-y-10">
                {visibleClusters.map((cluster) => {
                  const col = catColor(cluster.id);
                  const eligible = cluster.services.filter(isEligibleLeafService);
                  const featured = CLUSTER_FEATURED[cluster.id];
                  const hasFeature = !!featured;

                  return (
                    <section key={cluster.id} className="pt-2">
                      {/* Section header */}
                      <div
                        className="flex items-end justify-between gap-3 pb-2.5 mb-4"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-baseline gap-3.5 flex-wrap">
                            <span
                              className="w-2.5 h-2.5 rounded-[2px] inline-block translate-y-px shrink-0"
                              style={{ background: col.dot }}
                            />
                            <h2
                              className="text-[18px] sm:text-[20px] font-semibold leading-none tracking-[-0.005em] text-white"
                              style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
                            >
                              {getClusterHeaderLabel(cluster, language)}
                            </h2>
                            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-white/40">
                              {eligible.length} {isRu ? 'СЕРВИСОВ' : 'SERVICES'}
                            </span>
                          </div>
                          <p className="text-[13px] text-white/55 leading-snug max-w-[520px]">
                            {language === 'ru' ? cluster.valueRu : cluster.valueEn}
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveCluster(activeCluster === cluster.id ? null : cluster.id)}
                          className="shrink-0 text-[12px] text-white/60 hover:text-white/85 transition-colors pb-px"
                          style={{ borderBottom: '1px dotted rgba(255,255,255,0.3)' }}
                        >
                          {isRu ? `Все ${eligible.length} →` : `All ${eligible.length} →`}
                        </button>
                      </div>

                      {/* Service grid — responsive columns, fixed row height */}
                      <div
                        className="grid gap-2"
                        style={{
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gridAutoRows: '132px',
                        }}
                      >
                        <style>{`
                          @media (min-width:640px)  { .nav-v2-grid-${cluster.id} { grid-template-columns: repeat(4,1fr) !important; } }
                          @media (min-width:1024px) { .nav-v2-grid-${cluster.id} { grid-template-columns: repeat(5,1fr) !important; } }
                          @media (min-width:1280px) { .nav-v2-grid-${cluster.id} { grid-template-columns: repeat(6,1fr) !important; } }
                        `}</style>
                        {/* Apply responsive class via wrapper trick */}
                        <div
                          className={`nav-v2-grid-${cluster.id} grid gap-2`}
                          style={{
                            gridColumn: '1 / -1',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gridAutoRows: '132px',
                          }}
                        >
                          {hasFeature && (
                            <FeaturedTile
                              data={featured!}
                              language={language}
                              onNavigate={navigate}
                            />
                          )}
                          {eligible.map((svc) => (
                            <ServiceTile
                              key={`${cluster.id}-${svc.path}`}
                              service={svc}
                              clusterId={cluster.id}
                              language={language}
                              onNavigate={navigate}
                            />
                          ))}
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>

              {/* ── Trust strip ───────────────────────────── */}
              <div
                className="flex flex-wrap items-center justify-between gap-4 px-5 sm:px-6 py-[18px] rounded-[10px]"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex flex-wrap gap-x-8 gap-y-2 font-mono text-[11px] tracking-[0.06em] text-white/60">
                  {[
                    { num: `${stats?.properties ?? 23}+`, labelRu: 'ОБЪЕКТОВ',   labelEn: 'PROPERTIES' },
                    { num: `${stats?.providers ?? 48}+`,  labelRu: 'ПАРТНЁРОВ',  labelEn: 'PARTNERS' },
                    { num: '24/7',                        labelRu: 'ПОДДЕРЖКА',  labelEn: 'SUPPORT' },
                    { num: '100%',                        labelRu: 'ПРОВЕРЕНО',  labelEn: 'VERIFIED' },
                  ].map((t) => (
                    <span key={t.num + t.labelEn} className="flex items-baseline gap-1.5">
                      <b className="text-[18px] font-semibold" style={{ color: '#D96B1A' }}>
                        {t.num}
                      </b>
                      <span>{isRu ? t.labelRu : t.labelEn}</span>
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('navigator:open-apps-drawer'))}
                  className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-white/70 hover:text-white transition-colors"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  {isRu ? 'Все сервисы →' : 'All services →'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
