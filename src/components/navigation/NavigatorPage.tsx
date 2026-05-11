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
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, LayoutGrid, X, ArrowRight,
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
  live:   { dot: '#4EB883', iconBg: 'rgba(31,122,76,0.18)',   iconFg: '#4EB883' },
  manage: { dot: '#1F7A4C', iconBg: 'rgba(31,122,76,0.18)',   iconFg: '#4EB883' },
  invest: { dot: '#D96B1A', iconBg: 'rgba(217,107,26,0.18)', iconFg: '#D96B1A' },
  legal:  { dot: '#8FB6E5', iconBg: 'rgba(107,143,204,0.18)', iconFg: '#9BB5D9' },
  build:  { dot: '#B09FCC', iconBg: 'rgba(110,90,140,0.18)', iconFg: '#C0B2DC' },
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
      className="relative flex flex-col gap-2 p-3 rounded-[10px] text-left transition-all duration-150 active:scale-[0.97] disabled:cursor-default"
      style={{
        background: '#14202E',
        border: '1px solid rgba(255,255,255,0.07)',
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
      className="relative col-span-2 row-span-2 flex flex-col justify-between p-4 rounded-[10px] text-left transition-all duration-150 active:scale-[0.98]"
      style={{
        background: 'linear-gradient(145deg, #0A2240 0%, #143055 100%)',
        backgroundImage: 'radial-gradient(circle at 85% 10%, rgba(217,107,26,0.35) 0%, transparent 55%), linear-gradient(145deg, #0A2240, #143055)',
        border: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      <BadgePill badge={data.badge} />
      <div
        className="flex items-center justify-center w-8 h-8 rounded-[8px]"
        style={{ background: 'rgba(217,107,26,0.2)' }}
      >
        <Icon className="w-4.5 h-4.5" style={{ color: '#D96B1A' }} />
      </div>
      <div className="flex flex-col gap-1.5">
        <h6
          className="text-[17px] font-bold leading-tight text-white"
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
        >
          {language === 'ru' ? data.nameRu : data.nameEn}
        </h6>
        <p className="text-[11px] text-white/65 leading-snug">
          {language === 'ru' ? data.descRu : data.descEn}
        </p>
        <div className="mt-1">
          <span className="font-mono text-[28px] font-bold text-white leading-none">{data.stat}</span>
          <p className="font-mono text-[8.5px] uppercase tracking-[0.07em] text-white/40 mt-1">
            {language === 'ru' ? data.statLabelRu : data.statLabelEn}
          </p>
        </div>
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
        style={{ background: '#0B1320', color: '#F5F4F0' }}
      >

        {/* ── SOS strip ─────────────────────────────────────── */}
        <button
          onClick={() => navigate(APP_ROUTES.SOS)}
          className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-opacity hover:opacity-90"
          style={{ background: 'rgba(180,35,24,0.15)', borderBottom: '1px solid rgba(180,35,24,0.25)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-2 h-2 rounded-full shrink-0 animate-pulse"
              style={{ background: '#B42318' }}
            />
            <span className="font-semibold text-[13px]" style={{ color: '#F5A5A0' }}>
              {isRu ? 'SOS · 24/7 на русском' : 'SOS · 24/7 in English'}
            </span>
            <span className="font-mono text-[10px] text-white/45 hidden sm:inline truncate">
              {isRu
                ? 'врач · авария · полиция · ввоз питомца — одно касание'
                : 'doctor · accident · police · pet import — one tap'}
            </span>
          </div>
          <span
            className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] font-bold px-3 py-1.5 rounded-none"
            style={{ background: '#B42318', color: '#fff' }}
          >
            {isRu ? 'ВЫЗВАТЬ →' : 'CALL →'}
          </span>
        </button>

        <div className="max-w-[1280px] mx-auto py-6 space-y-6">

          {/* ── Hero ──────────────────────────────────────── */}
          <div className="space-y-2">
            <p
              className="font-mono text-[10px] uppercase tracking-[0.14em]"
              style={{ color: '#D96B1A' }}
            >
              {isRu ? 'PHUKET EDITION · LIVE' : 'PHUKET EDITION · LIVE'}
            </p>
            <h1
              className="text-[28px] sm:text-[36px] font-bold leading-[1.1] tracking-[-0.02em]"
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
            <p className="text-[13px] sm:text-[15px] text-white/60 leading-relaxed max-w-lg">
              {isRu
                ? `${totalServices} сервисов, ${stats?.providers ?? 48}+ проверенных партнёров. Найдите своё за 30 секунд — или нажмите ситуацию ниже.`
                : `${totalServices} services, ${stats?.providers ?? 48}+ verified partners. Find yours in 30 seconds — or tap your situation below.`}
            </p>
          </div>

          {/* ── Persona toggle ──────────────────────────── */}
          <div className="flex gap-1.5 flex-wrap">
            {personaTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePersona(tab.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium transition-all duration-150"
                style={
                  activePersona === tab.id
                    ? { background: '#D96B1A', color: '#fff' }
                    : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {isRu ? tab.labelRu : tab.labelEn}
                <span
                  className="font-mono text-[10px]"
                  style={{ color: activePersona === tab.id ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)' }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* ── Search ──────────────────────────────────── */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isRu ? 'Найти сервис, партнёра или ситуацию…' : 'Find service, partner or situation…'}
                className="w-full h-11 pl-10 pr-10 rounded-none text-[14px] bg-transparent outline-none"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#F5F4F0',
                  caretColor: '#D96B1A',
                }}
              />
              <kbd
                className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] px-1.5 py-0.5 rounded-none"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                ⌘K
              </kbd>
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {!query && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
                  {isRu ? 'СЕЙЧАС ИЩУТ' : 'POPULAR'}
                </span>
                {(isRu ? POPULAR.ru : POPULAR.en).map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="text-[12px] font-medium text-white/55 hover:text-white/85 transition-colors underline decoration-white/20 underline-offset-2"
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
                <p className="text-white/45 text-sm py-6 text-center">
                  {isRu ? 'Ничего не найдено' : 'No results found'}
                </p>
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
                      className="flex flex-col gap-2.5 p-4 rounded-[10px] text-left transition-all duration-150 hover:border-white/15 active:scale-[0.98]"
                      style={{ background: '#14202E', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="w-7 h-7 rounded-[7px] flex items-center justify-center"
                          style={{ background: 'rgba(217,107,26,0.18)' }}
                        >
                          <Icon className="w-4 h-4" style={{ color: '#D96B1A' }} />
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-white/25" />
                      </div>
                      <div>
                        <h6 className="text-[13px] font-semibold text-white leading-tight">
                          {isRu ? s.titleRu : s.titleEn}
                        </h6>
                        <p className="text-[10.5px] text-white/45 leading-snug mt-1">
                          {isRu ? s.stepsRu : s.stepsEn}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-auto">
                        <span className="font-mono text-[8.5px] text-white/30 uppercase tracking-[0.08em]">
                          {isRu ? s.svcRu : s.svcEn}
                        </span>
                        <span className="text-white/20">·</span>
                        <span className="font-mono text-[8.5px] text-white/30 uppercase tracking-[0.08em]">
                          {isRu ? s.timeRu : s.timeEn}
                        </span>
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
                    <section key={cluster.id}>
                      {/* Section header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-none shrink-0"
                              style={{ background: col.dot }}
                            />
                            <h2
                              className="text-[18px] sm:text-[20px] font-bold leading-none"
                              style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
                            >
                              {getClusterHeaderLabel(cluster, language)}
                            </h2>
                            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/35">
                              {eligible.length} {isRu ? 'СЕРВИСОВ' : 'SERVICES'}
                            </span>
                          </div>
                          <p className="text-[12px] text-white/45 ml-5 leading-snug max-w-md">
                            {language === 'ru' ? cluster.valueRu : cluster.valueEn}
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveCluster(activeCluster === cluster.id ? null : cluster.id)}
                          className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors"
                          style={{ color: '#D96B1A' }}
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
                className="flex flex-wrap items-center justify-between gap-4 py-4 px-0"
                style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex flex-wrap gap-6">
                  {[
                    { num: `${stats?.properties ?? 23}+`, labelRu: 'ОБЪЕКТОВ',   labelEn: 'PROPERTIES' },
                    { num: `${stats?.providers ?? 48}+`,  labelRu: 'ПАРТНЁРОВ',  labelEn: 'PARTNERS' },
                    { num: '24/7',                        labelRu: 'ПОДДЕРЖКА',  labelEn: 'SUPPORT' },
                    { num: '100%',                        labelRu: 'ПРОВЕРЕНО',  labelEn: 'VERIFIED' },
                  ].map((t) => (
                    <div key={t.num + t.labelEn} className="flex items-baseline gap-1.5">
                      <span className="font-mono text-[20px] font-bold" style={{ color: '#D96B1A' }}>
                        {t.num}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-white/35">
                        {isRu ? t.labelRu : t.labelEn}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('navigator:open-apps-drawer'))}
                  className="flex items-center gap-1.5 text-[12px] font-medium transition-opacity hover:opacity-80"
                  style={{ color: '#D96B1A' }}
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
