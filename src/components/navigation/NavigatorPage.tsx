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
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
  Lock, Droplet, RefreshCcw, Sparkles, ClipboardList, BookOpen, Briefcase,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
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
import { cn } from '@/lib/utils';

// ─── Category color palettes (spec §04.1) ───────────────────────────────────

/** Cluster accent — semantic cluster tokens (DS 2.1, matches ClusterAppCard). */
const CAT_COLOR_DARK: Record<string, { dot: string; iconBg: string; iconFg: string }> = {
  arrive: { dot: 'bg-cluster-arrive', iconBg: 'bg-cluster-arrive', iconFg: 'text-primary-foreground' },
  live:   { dot: 'bg-cluster-live',   iconBg: 'bg-cluster-live',   iconFg: 'text-primary-foreground' },
  manage: { dot: 'bg-cluster-manage', iconBg: 'bg-cluster-manage', iconFg: 'text-primary-foreground' },
  invest: { dot: 'bg-cluster-invest', iconBg: 'bg-cluster-invest', iconFg: 'text-primary-foreground' },
  legal:  { dot: 'bg-cluster-legal',  iconBg: 'bg-cluster-legal',  iconFg: 'text-primary-foreground' },
  build:  { dot: 'bg-cluster-build',  iconBg: 'bg-cluster-build',  iconFg: 'text-primary-foreground' },
};

/** Light shell: cluster tints on card / muted surfaces. */
const CAT_COLOR_LIGHT: Record<string, { dot: string; iconBg: string; iconFg: string }> = {
  arrive: { dot: 'bg-cluster-arrive', iconBg: 'bg-cluster-arrive', iconFg: 'text-primary-foreground' },
  live:   { dot: 'bg-cluster-live',   iconBg: 'bg-cluster-live',   iconFg: 'text-primary-foreground' },
  manage: { dot: 'bg-cluster-manage', iconBg: 'bg-cluster-manage', iconFg: 'text-primary-foreground' },
  invest: { dot: 'bg-cluster-invest', iconBg: 'bg-cluster-invest', iconFg: 'text-primary-foreground' },
  legal:  { dot: 'bg-cluster-legal',  iconBg: 'bg-cluster-legal',  iconFg: 'text-primary-foreground' },
  build:  { dot: 'bg-cluster-build',  iconBg: 'bg-cluster-build',  iconFg: 'text-primary-foreground' },
};

function catColor(clusterId: string, shell: NavigatorShell) {
  const map = shell === 'light' ? CAT_COLOR_LIGHT : CAT_COLOR_DARK;
  return map[clusterId] ?? (shell === 'light' ? CAT_COLOR_LIGHT.live : CAT_COLOR_DARK.live);
}

// ─── Status badges (spec §04.2) ─────────────────────────────────────────────

type Badge = 'free' | 'partner' | 'new' | 'soon' | 'kyc' | 'vip' | 'live' | '24-7';

const BADGE_LABEL: Record<Badge, string> = {
  free: 'FREE', partner: 'PARTNER', new: 'NEW', soon: 'SOON',
  kyc: 'KYC', vip: 'VIP', live: 'LIVE', '24-7': '24/7',
};

const BADGE_CLASS_DARK: Record<Badge, string> = {
  free:    'bg-success/30 text-success-foreground',
  partner: 'bg-primary/20 text-foreground',
  new:     'bg-accent text-accent-foreground',
  soon:    'bg-muted/60 text-muted-foreground',
  kyc:     'bg-accent/25 text-accent',
  vip:     'bg-accent text-accent-foreground',
  live:    'bg-success/30 text-success-foreground',
  '24-7':  'bg-accent/25 text-accent',
};

const BADGE_CLASS_LIGHT: Record<Badge, string> = {
  free:    'bg-success/20 text-success',
  partner: 'bg-primary/15 text-foreground',
  new:     'bg-accent text-accent-foreground',
  soon:    'bg-muted text-muted-foreground',
  kyc:     'bg-accent/20 text-accent',
  vip:     'bg-accent text-accent-foreground',
  live:    'bg-success/20 text-success',
  '24-7':  'bg-accent/20 text-accent',
};

type NavigatorShell = 'light' | 'dark';

/** Theme-adaptive chrome for Discover (navy editorial in dark; semantic surfaces in light). */
interface NavigatorAppearance {
  shell: NavigatorShell;
  root: string;
  heroEyebrow: string;
  heroTitle: string;
  heroTitleEm: string;
  heroLead: string;
  heroHint: string;
  sosHeadline: string;
  sosSub: string;
  sosCta: string;
  personaRail: string;
  personaInactive: string;
  personaActive: string;
  personaCountInactive: string;
  personaCountActive: string;
  searchIcon: string;
  searchInput: string;
  searchKbd: string;
  searchClear: string;
  popularLabel: string;
  popularLink: string;
  emptySearch: string;
  resultsLabel: string;
  sitCard: string;
  sitCardHover: string;
  sitActionHint: string;
  sitIconWrap: string;
  sitTitle: string;
  sitDesc: string;
  sitMeta: string;
  filterLink: string;
  sectionBorder: string;
  clusterTitle: string;
  clusterCount: string;
  clusterDesc: string;
  clusterAllLink: string;
  trustBar: string;
  trustStats: string;
  trustStatNum: string;
  trustCta: string;
  tile: string;
  tileLabel: string;
  tileMeta: string;
  badgeClass: Record<Badge, string>;
}

const NAV_APPEARANCE: Record<NavigatorShell, NavigatorAppearance> = {
  dark: {
    shell: 'dark',
    root: 'min-h-full -mx-4 px-4 pb-28 bg-background text-foreground',
    heroEyebrow: 'font-mono text-[10px] uppercase tracking-[0.14em] text-accent',
    heroTitle:
      'text-[28px] sm:text-[36px] lg:text-[40px] font-semibold leading-[1.12] tracking-[-0.025em] text-foreground max-w-3xl',
    heroTitleEm: 'italic font-serif text-accent font-normal',
    heroLead: 'text-[13px] sm:text-[16px] text-muted-foreground leading-[1.5] max-w-xl',
    heroHint: 'text-[11px] text-muted-foreground max-w-xl leading-snug',
    sosHeadline: 'font-semibold text-[14px] text-foreground',
    sosSub: 'text-[12px] text-muted-foreground truncate',
    sosCta:
      'shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] font-medium text-foreground px-3 py-2 rounded-none border border-border',
    personaRail: 'inline-flex gap-1 p-1 flex-wrap rounded-none border border-border bg-card w-fit max-w-full',
    personaInactive: 'bg-transparent text-muted-foreground',
    personaActive: 'bg-accent text-accent-foreground',
    personaCountInactive: 'font-mono text-[10px] opacity-50',
    personaCountActive: 'font-mono text-[10px] opacity-70',
    searchIcon: 'absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground pointer-events-none',
    searchInput:
      'w-full text-[15px] outline-none placeholder:text-muted-foreground bg-card border border-border rounded-none text-foreground caret-accent pl-[50px] pr-[60px] py-4',
    searchKbd: 'absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] px-1.5 py-[3px] rounded-none bg-muted/60 text-muted-foreground',
    searchClear: 'absolute right-14 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground',
    popularLabel: 'font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground',
    popularLink: 'text-[12px] text-foreground/80 hover:text-foreground transition-colors pb-px border-b border-dotted border-border',
    emptySearch: 'text-muted-foreground text-sm py-6 text-center',
    resultsLabel: 'font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground',
    sitCard:
      'relative flex flex-col justify-between gap-3 p-[18px] rounded-none text-left transition-all duration-150 border border-border bg-card min-h-[130px]',
    sitCardHover: 'hover:bg-muted/40 hover:border-border hover:-translate-y-px active:scale-[0.98]',
    sitActionHint:
      'text-[11px] font-medium leading-snug text-muted-foreground mt-2 max-w-[16rem]',
    sitIconWrap:
      'size-[var(--touch-target)] shrink-0 rounded-none flex items-center justify-center bg-accent/20 md:size-[30px]',
    sitTitle: 'text-[15px] font-semibold text-foreground leading-[19px] tracking-[-0.01em] mt-3.5',
    sitDesc: 'text-[12px] text-muted-foreground leading-[17px] mt-1.5',
    sitMeta: 'font-mono text-[10px] text-muted-foreground uppercase tracking-[0.06em]',
    filterLink: 'flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors',
    sectionBorder: 'flex items-end justify-between gap-3 pb-2.5 mb-4 border-b border-border',
    clusterTitle:
      'text-[18px] sm:text-[20px] font-semibold leading-none tracking-[-0.005em] text-foreground',
    clusterCount: 'font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground',
    clusterDesc: 'text-[13px] text-muted-foreground leading-snug max-w-[520px]',
    clusterAllLink:
      'shrink-0 text-[12px] text-muted-foreground hover:text-foreground transition-colors pb-px border-b border-dotted border-border',
    trustBar:
      'flex flex-wrap items-center justify-between gap-4 px-5 sm:px-6 py-[18px] rounded-none border border-border bg-card',
    trustStats: 'flex flex-wrap gap-x-8 gap-y-2 font-mono text-[11px] tracking-[0.06em] text-muted-foreground',
    trustStatNum: 'text-[18px] font-semibold text-accent',
    trustCta:
      'flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-foreground/80 hover:text-foreground transition-colors',
    tile:
      'relative flex flex-col gap-2.5 p-3.5 rounded-none text-left transition-all duration-150 border border-border bg-card min-h-[116px] hover:bg-muted/40 hover:border-border hover:-translate-y-px active:scale-[0.97] disabled:cursor-default disabled:hover:translate-y-0',
    tileLabel: 'text-[12px] font-semibold leading-tight text-foreground break-words',
    tileMeta: 'font-mono text-[9px] uppercase tracking-[0.05em] text-muted-foreground leading-tight',
    badgeClass: BADGE_CLASS_DARK,
  },
  light: {
    shell: 'light',
    root: 'min-h-full -mx-4 px-4 pb-28 bg-muted/45 text-foreground border-y border-border/50',
    heroEyebrow: 'font-mono text-[10px] uppercase tracking-[0.14em] text-accent',
    heroTitle:
      'text-[28px] sm:text-[36px] lg:text-[40px] font-semibold leading-[1.12] tracking-[-0.025em] text-foreground max-w-3xl',
    heroTitleEm: 'italic font-serif text-accent font-normal',
    heroLead: 'text-[13px] sm:text-[16px] text-muted-foreground leading-[1.5] max-w-xl',
    heroHint: 'text-[11px] text-muted-foreground max-w-xl leading-snug',
    sosHeadline: 'font-semibold text-[14px] text-foreground',
    sosSub: 'text-[12px] text-muted-foreground truncate',
    sosCta:
      'shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] font-medium text-foreground px-3 py-2 rounded-none border border-border bg-background/80',
    personaRail: 'inline-flex gap-1 p-1 flex-wrap rounded-none border border-border bg-background/90 w-fit max-w-full',
    personaInactive: 'bg-transparent text-muted-foreground',
    personaActive: 'bg-accent text-accent-foreground',
    personaCountInactive: 'font-mono text-[10px] opacity-60',
    personaCountActive: 'font-mono text-[10px] opacity-80',
    searchIcon: 'absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground pointer-events-none',
    searchInput:
      'w-full text-[15px] outline-none placeholder:text-muted-foreground bg-background border border-input rounded-none text-foreground caret-primary pl-[50px] pr-[60px] py-4',
    searchKbd:
      'absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] px-1.5 py-[3px] rounded-none bg-muted text-muted-foreground',
    searchClear: 'absolute right-14 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground',
    popularLabel: 'font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground',
    popularLink:
      'text-[12px] text-foreground/80 hover:text-foreground transition-colors pb-px border-b border-dotted border-border',
    emptySearch: 'text-muted-foreground text-sm py-6 text-center',
    resultsLabel: 'font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground',
    sitCard:
      'relative flex flex-col justify-between gap-3 p-[18px] rounded-none text-left transition-all duration-150 border border-border bg-card min-h-[130px]',
    sitCardHover: 'hover:bg-muted/60 hover:border-border hover:-translate-y-px active:scale-[0.98]',
    sitActionHint:
      'text-[11px] font-medium leading-snug text-muted-foreground mt-2 max-w-[16rem]',
    sitIconWrap:
      'size-[var(--touch-target)] shrink-0 rounded-none flex items-center justify-center bg-accent/20 md:size-[30px]',
    sitTitle: 'text-[15px] font-semibold text-foreground leading-[19px] tracking-[-0.01em] mt-3.5',
    sitDesc: 'text-[12px] text-muted-foreground leading-[17px] mt-1.5',
    sitMeta: 'font-mono text-[10px] text-muted-foreground uppercase tracking-[0.06em]',
    filterLink: 'flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors',
    sectionBorder: 'flex items-end justify-between gap-3 pb-2.5 mb-4 border-b border-border',
    clusterTitle:
      'text-[18px] sm:text-[20px] font-semibold leading-none tracking-[-0.005em] text-foreground',
    clusterCount: 'font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground',
    clusterDesc: 'text-[13px] text-muted-foreground leading-snug max-w-[520px]',
    clusterAllLink:
      'shrink-0 text-[12px] text-muted-foreground hover:text-foreground transition-colors pb-px border-b border-dotted border-border',
    trustBar:
      'flex flex-wrap items-center justify-between gap-4 px-5 sm:px-6 py-[18px] rounded-none border border-border bg-card',
    trustStats: 'flex flex-wrap gap-x-8 gap-y-2 font-mono text-[11px] tracking-[0.06em] text-muted-foreground',
    trustStatNum: 'text-[18px] font-semibold text-accent',
    trustCta:
      'flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors',
    tile:
      'relative flex flex-col gap-2.5 p-3.5 rounded-none text-left transition-all duration-150 border border-border bg-card min-h-[116px] hover:bg-muted/70 hover:border-border hover:-translate-y-px active:scale-[0.97] disabled:cursor-default disabled:hover:translate-y-0',
    tileLabel: 'text-[12px] font-semibold leading-tight text-foreground break-words',
    tileMeta: 'font-mono text-[9px] uppercase tracking-[0.05em] text-muted-foreground leading-tight',
    badgeClass: BADGE_CLASS_LIGHT,
  },
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
  'due-diligence': BookOpen,
  'business-invest': Briefcase,
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
    badge: 'live', icon: TrendingUp, path: APP_ROUTES.INVEST_DASHBOARD,
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

const BadgePill = React.memo(function BadgePill({
  badge,
  appearance,
}: {
  badge: Badge;
  appearance: NavigatorAppearance;
}) {
  return (
    <span
      className={cn(
        'absolute top-2 right-2 rounded-none px-1 py-px font-mono text-[7.5px] font-bold tracking-[0.06em]',
        appearance.badgeClass[badge],
      )}
    >
      {BADGE_LABEL[badge]}
    </span>
  );
});

function ServiceTile({
  service, clusterId, language, onNavigate, appearance,
}: {
  service: ClusterService;
  clusterId: string;
  language: Language;
  onNavigate: (p: string) => void;
  appearance: NavigatorAppearance;
}) {
  const meta = SERVICE_META[service.id ?? ''] ?? {};
  const badge = meta.badge;
  const metaText = language === 'ru' ? meta.metaRu : meta.metaEn;
  const isSoon = service.status === 'soon';
  const col = catColor(clusterId, appearance.shell);
  const Icon = ICON_BY_ID[service.id ?? ''] ?? service.icon;
  const label = getClusterServiceLocalizedLabel(service, language);

  return (
    <button
      onClick={() => !isSoon && onNavigate(service.path)}
      disabled={isSoon}
      className={cn(
        appearance.tile,
        isSoon ? 'opacity-65' : 'opacity-100',
      )}
      aria-label={label}
    >
      {badge && <BadgePill badge={badge} appearance={appearance} />}
      <div
        className={cn(
          'flex items-center justify-center shrink-0 rounded-none size-[var(--touch-target)] md:size-7',
          col.iconBg,
        )}
      >
        <Icon className={cn('size-6 shrink-0 md:size-4', col.iconFg)} />
      </div>
      <div className="flex-1 flex flex-col justify-end gap-0.5 min-w-0">
        <span
          className={cn(appearance.tileLabel)}
          style={{ wordBreak: 'keep-all', textWrap: 'balance' } as React.CSSProperties}
        >
          {label}
        </span>
        {metaText && (
          <span className={appearance.tileMeta}>{metaText}</span>
        )}
      </div>
    </button>
  );
}

function FeaturedTile({
  data,
  language,
  onNavigate,
  appearance,
}: {
  data: FeaturedTileData;
  language: Language;
  onNavigate: (p: string) => void;
  appearance: NavigatorAppearance;
}) {
  const Icon = data.icon;
  const isLight = appearance.shell === 'light';
  return (
    <button
      onClick={() => onNavigate(data.path)}
      className={cn(
        'relative col-span-2 row-span-2 flex flex-col justify-between p-[22px] rounded-none text-left transition-all duration-150',
        'min-h-[240px] border border-accent/30',
        isLight
          ? 'bg-card border-accent/35 shadow-sm hover:border-accent/50 hover:bg-muted/30'
          : 'bg-accent/15 hover:bg-accent/20 hover:border-accent/50',
        'hover:-translate-y-px active:scale-[0.98]',
      )}
    >
      <BadgePill badge={data.badge} appearance={appearance} />
      <div
        className={cn(
          'flex items-center justify-center shrink-0 rounded-none size-[var(--touch-target)] md:size-9',
          isLight ? 'bg-accent/15' : 'bg-accent/20',
        )}
      >
        <Icon
          className="size-6 md:size-[18px] text-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <h6
          className="text-[18px] leading-[23px] text-foreground"
          style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500 }}
        >
          {language === 'ru' ? data.nameRu : data.nameEn}
        </h6>
        <p className="text-[12px] leading-[17px] text-muted-foreground">
          {language === 'ru' ? data.descRu : data.descEn}
        </p>
      </div>
      <div>
        <span className="font-mono text-[22px] font-medium tracking-[-0.02em] leading-none text-foreground">
          {data.stat}
        </span>
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] mt-1 text-muted-foreground">
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
    clusterOrder: ['arrive', 'live', 'manage', 'invest', 'legal', 'build'],
    hiddenServiceIds: [],
    situationIds: ['arrived', 'renting', 'buying', 'medical'],
  },
  resident: {
    clusterOrder: ['live', 'legal', 'manage', 'arrive', 'invest', 'build'],
    hiddenServiceIds: ['tours', 'water', 'yacht', 'experience', 'event', 'event-live', 'experience-live', 'water-live'],
    situationIds: ['visa-extend', 'renting', 'banking', 'medical'],
  },
  investor: {
    clusterOrder: ['invest', 'legal', 'manage', 'build', 'arrive', 'live'],
    hiddenServiceIds: [
      'cleaning', 'laundry', 'pest-control', 'handyman', 'plumbing', 'electrical',
      'ac-repair', 'locksmith', 'gardening', 'flowers', 'storage', 'services',
      'delivery', 'market', 'beauty', 'fitness', 'babysitter', 'kids',
      'school-finder', 'education', 'pets', 'veterinary', 'community', 'wedding',
    ],
    situationIds: ['buying', 'due-diligence', 'roi', 'legal-support'],
  },
  owner: {
    clusterOrder: ['invest', 'legal', 'manage', 'live', 'arrive', 'build'],
    hiddenServiceIds: [
      'tours', 'water', 'yacht', 'experience', 'event', 'event-live', 'experience-live',
      'water-live', 'community', 'wedding', 'babysitter', 'kids',
    ],
    situationIds: ['rent-out', 'manage', 'tax', 'legal-support'],
  },
};

/** Short labels for situation cards + aria (filter targets surface cluster ids). */
const NAV_CLUSTER_FILTER_LABEL: Record<string, { ru: string; en: string }> = {
  arrive: { ru: 'Прибытие', en: 'Arrive' },
  live: { ru: 'Жизнь на острове', en: 'Live' },
  manage: { ru: 'Управление', en: 'Manage' },
  invest: { ru: 'Инвестиции', en: 'Invest' },
  legal: { ru: 'Право и документы', en: 'Legal' },
  build: { ru: 'Стройка', en: 'Build' },
};

export default function NavigatorPage() {
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();
  const appearance = NAV_APPEARANCE[resolvedTheme === 'dark' ? 'dark' : 'light'];
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { personas } = useUserPersonas();

  const [activePersona, setActivePersona] = useState<PersonaId>('foreigner');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const prevPersonaRef = useRef<PersonaId>(activePersona);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => window.clearTimeout(t);
  }, [query]);

  // Deep-link from Welcome / marketing: prefill search when `q` is present (Gosuslugi-style chips).
  useEffect(() => {
    const raw = new URLSearchParams(location.search).get('q');
    if (raw == null || raw === '') return;
    let decoded = raw;
    try {
      decoded = decodeURIComponent(raw.replace(/\+/g, ' '));
    } catch {
      decoded = raw.replace(/\+/g, ' ');
    }
    setQuery(decoded);
  }, [location.search]);

  useEffect(() => {
    if (prevPersonaRef.current === activePersona) return;
    prevPersonaRef.current = activePersona;
    setActiveCluster(null);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('cluster');
        return next;
      },
      { replace: true },
    );
  }, [activePersona, setSearchParams]);

  const setClusterFilter = useCallback(
    (next: string | null) => {
      setActiveCluster(next);
      setSearchParams(
        (prev) => {
          const out = new URLSearchParams(prev);
          if (next) out.set('cluster', next);
          else out.delete('cluster');
          return out;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

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
    { id: 'foreigner' as PersonaId, labelRu: 'Турист', labelEn: 'Tourist', count: personaServiceCounts.foreigner },
    { id: 'resident'  as PersonaId, labelRu: 'Резидент', labelEn: 'Resident', count: personaServiceCounts.resident },
    { id: 'investor'  as PersonaId, labelRu: 'Инвестор', labelEn: 'Investor', count: personaServiceCounts.investor },
    { id: 'owner'     as PersonaId, labelRu: 'Собственник', labelEn: 'Owner', count: personaServiceCounts.owner },
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

  // Cluster the role can see, but the active persona has emptied via hiddenServiceIds.
  // Drives an empty-state UI instead of silently stripping the URL param.
  const personaEmptyClusterId = useMemo(() => {
    if (!clusterFromUrl) return null;
    const roleVisible = audienceClusters.some((c) => c.id === clusterFromUrl);
    if (!roleVisible) return null;
    const inPersona = personaClusters.some((c) => c.id === clusterFromUrl);
    return inPersona ? null : clusterFromUrl;
  }, [clusterFromUrl, audienceClusters, personaClusters]);

  useEffect(() => {
    if (!clusterFromUrl) {
      if (activeCluster !== null) {
        setActiveCluster(null);
      }
      return;
    }
    if (audienceClusters.length === 0) return;

    const match = personaClusters.find((c) => c.id === clusterFromUrl);
    if (match) {
      if (activeCluster !== clusterFromUrl) {
        setActiveCluster(clusterFromUrl);
      }
      return;
    }
    if (personaEmptyClusterId) {
      if (activeCluster !== null) {
        setActiveCluster(null);
      }
      return;
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('cluster');
        return next;
      },
      { replace: true },
    );
    setActiveCluster(null);
  }, [clusterFromUrl, audienceClusters, personaClusters, personaEmptyClusterId, activeCluster, setSearchParams]);

  useEffect(() => {
    if (debouncedQuery || !activeCluster) return;
    const el = document.getElementById(`navigator-cluster-${activeCluster}`);
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [activeCluster, debouncedQuery]);

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
    const q = debouncedQuery.toLowerCase();
    if (!q) return null;
    return allEligible.filter((s) => {
      const label = (getClusterServiceLocalizedLabel(s, language) ?? '').toLowerCase();
      const clusterRaw = isRu ? s.clusterLabelRu : s.clusterLabelEn;
      const cluster = String(clusterRaw ?? '').toLowerCase();
      const idMatch = (s.id ?? '').toLowerCase().includes(q);
      const jtbdMatch = (s.jtbdClusters ?? []).some((j) =>
        String(j ?? '').toLowerCase().includes(q),
      );
      const personaMatch = (s.personaTags ?? []).some((p) =>
        String(p ?? '').toLowerCase().includes(q),
      );
      return (
        label.includes(q) ||
        cluster.includes(q) ||
        idMatch ||
        jtbdMatch ||
        personaMatch
      );
    });
  }, [debouncedQuery, allEligible, language, isRu]);

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
      <div className={appearance.root}>
        <div className="max-w-[1280px] mx-auto py-6 space-y-6">

          {/* ── Hero ──────────────────────────────────────── */}
          <div className="space-y-3">
            <p className={appearance.heroEyebrow}>
              {isRu ? 'PHUKET EDITION · LIVE' : 'PHUKET EDITION · LIVE'}
            </p>
            <h1 className={appearance.heroTitle}>
              {isRu ? (
                <>
                  Карта острова{' '}
                  <em
                    className={appearance.heroTitleEm}
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    для жизни
                  </em>
                  . Один поток.
                </>
              ) : (
                <>
                  Island map{' '}
                  <em
                    className={appearance.heroTitleEm}
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    for life
                  </em>
                  . One stream.
                </>
              )}
            </h1>
            <p className={appearance.heroLead}>
              {isRu
                ? `В этом виде — ${totalServices} сервисов; партнёров на платформе — ${stats?.providers ?? 48}+. Найдите по поиску или начните с карточки ситуации ниже.`
                : `${totalServices} services in this view; ${stats?.providers ?? 48}+ partners on the platform. Search or start from a situation card below.`}
            </p>
            <p className={appearance.heroHint}>
              {isRu
                ? 'Цифра на вкладке — сколько сервисов доступно для выбранной роли; смените роль, чтобы увидеть другой набор.'
                : 'Each tab shows how many services match that persona; switch tabs to see a different set.'}
            </p>
          </div>

          {/* ── SOS strip ─────────────────────────────────────── */}
          <button
            type="button"
            aria-label={
              isRu
                ? 'SOS: экстренная помощь 24/7 — врач, авария, полиция, ввоз питомца'
                : 'SOS: 24/7 emergency help — doctor, accident, police, pet import'
            }
            onClick={() => navigate(APP_ROUTES.SOS)}
            className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3 text-left rounded-none transition-opacity hover:opacity-95 active:scale-[0.99] border border-destructive/45 bg-destructive/10"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse bg-destructive shadow-[0_0_0_4px_hsl(var(--destructive)/0.25)]" />
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 min-w-0">
                <span className={appearance.sosHeadline}>
                  {isRu ? 'SOS · 24/7 на русском' : 'SOS · 24/7 in English'}
                </span>
                <span className={appearance.sosSub}>
                  {isRu
                    ? 'врач · авария · полиция · ввоз питомца — одно касание'
                    : 'doctor · accident · police · pet import — one tap'}
                </span>
              </div>
            </div>
            <span className={appearance.sosCta}>
              {isRu ? 'Вызвать →' : 'Call →'}
            </span>
          </button>

          {/* ── Persona toggle ──────────────────────────── */}
          <div className={appearance.personaRail}>
            {personaTabs.map((tab) => {
              const active = activePersona === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  title={
                    isRu
                      ? `${tab.count} сервисов в фильтре «${tab.labelRu}»`
                      : `${tab.count} services in the “${tab.labelEn}” filter`
                  }
                  onClick={() => setActivePersona(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-none text-[13px] font-medium leading-none tracking-[-0.005em] transition-all duration-150',
                    active ? appearance.personaActive : appearance.personaInactive,
                  )}
                >
                  {isRu ? tab.labelRu : tab.labelEn}
                  <span
                    className={cn(
                      active ? appearance.personaCountActive : appearance.personaCountInactive,
                    )}
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
              <Search className={appearance.searchIcon} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isRu ? 'Найти сервис, партнёра или ситуацию…' : 'Find service, partner or situation…'}
                className={appearance.searchInput}
                autoComplete="off"
              />
              <kbd className={appearance.searchKbd}>
                ⌘K
              </kbd>
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className={appearance.searchClear}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {!query && (
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className={appearance.popularLabel}>
                  {isRu ? 'СЕЙЧАС ИЩУТ' : 'POPULAR'}
                </span>
                {(isRu ? POPULAR.ru : POPULAR.en).map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className={appearance.popularLink}
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
                  <p className={appearance.emptySearch}>
                    {isRu ? 'Ничего не найдено в навигаторе' : 'Nothing matched in the navigator'}
                  </p>
                  <p className={cn(appearance.heroHint, 'max-w-md mx-auto')}>
                    {isRu
                      ? 'Попробуйте другое слово, запрос из «Сейчас ищут» выше или пролистайте разделы ниже без поиска.'
                      : 'Try another word, a “Popular” suggestion above, or browse the sections below without search.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/search?q=${encodeURIComponent(query.trim())}`)}
                    className="inline-flex items-center gap-2 rounded-none px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] bg-muted/60 hover:bg-muted/80 text-foreground transition"
                  >
                    {isRu ? 'Искать в каталоге →' : 'Search the catalogue →'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className={appearance.resultsLabel}>
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
                        appearance={appearance}
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
                  const sectionLbl = NAV_CLUSTER_FILTER_LABEL[s.filterId] ?? {
                    ru: s.filterId,
                    en: s.filterId,
                  };
                  const sectionName = isRu ? sectionLbl.ru : sectionLbl.en;
                  const actionHint = isRu
                    ? `Показать раздел «${sectionName}»`
                    : `Show “${sectionName}” section`;
                  const aria = isRu
                    ? `${actionHint}. Фильтр каталога, не переход в сервис.`
                    : `${actionHint}. Catalog filter; does not open a service.`;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-label={aria}
                      onClick={() => setClusterFilter(s.filterId)}
                      className={cn(appearance.sitCard, appearance.sitCardHover)}
                    >
                      <div>
                        <div className={appearance.sitIconWrap}>
                          <Icon className="size-6 text-orange md:size-4" />
                        </div>
                        <h6 className={appearance.sitTitle}>
                          {isRu ? s.titleRu : s.titleEn}
                        </h6>
                        <p className={appearance.sitDesc}>
                          {isRu ? s.stepsRu : s.stepsEn}
                        </p>
                      </div>
                      <p className={appearance.sitActionHint}>{actionHint}</p>
                      <div className={appearance.sitMeta}>
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
                    type="button"
                    onClick={() => setClusterFilter(null)}
                    className={appearance.filterLink}
                  >
                    <X className="w-3 h-3" />
                    {isRu ? 'Все разделы' : 'All sections'}
                  </button>
                </div>
              )}

              {/* Persona-empty cluster notice: deep-link arrived for a section
                  the active persona has no services in. */}
              {personaEmptyClusterId && (() => {
                const target = audienceClusters.find((c) => c.id === personaEmptyClusterId);
                const label = target
                  ? (isRu ? target.labelRu : target.labelEn)
                  : personaEmptyClusterId;
                return (
                  <div className="border border-border bg-card p-6 space-y-3">
                    <p className={appearance.emptySearch}>
                      {isRu
                        ? `Раздел «${label}» недоступен для выбранного профиля.`
                        : `The “${label}” section is unavailable for the selected profile.`}
                    </p>
                    <p className={cn(appearance.heroHint, 'max-w-md')}>
                      {isRu
                        ? 'Переключите профиль на вкладках выше или вернитесь ко всем разделам — ниже показано то, что подходит вам сейчас.'
                        : 'Switch the profile via the tabs above or return to all sections — what fits your current profile is shown below.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setClusterFilter(null)}
                      className={appearance.filterLink}
                    >
                      <X className="w-3 h-3" />
                      {isRu ? 'Все разделы' : 'All sections'}
                    </button>
                  </div>
                );
              })()}

              {/* ── Cluster sections ──────────────────────── */}
              <div className="space-y-10">
                {visibleClusters.map((cluster) => {
                  const col = catColor(cluster.id, appearance.shell);
                  const eligible = cluster.services.filter(isEligibleLeafService);
                  const featured = CLUSTER_FEATURED[cluster.id];
                  const hasFeature = !!featured;

                  return (
                    <section
                      key={cluster.id}
                      id={`navigator-cluster-${cluster.id}`}
                      className="scroll-mt-[72px] pt-2"
                    >
                      {/* Section header */}
                      <div className={appearance.sectionBorder}>
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-baseline gap-3.5 flex-wrap">
                            <span
                              className={cn('w-2.5 h-2.5 rounded-none inline-block translate-y-px shrink-0', col.dot)}
                            />
                            <h2
                              className={appearance.clusterTitle}
                              style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
                            >
                              {getClusterHeaderLabel(cluster, language)}
                            </h2>
                            <span className={appearance.clusterCount}>
                              {eligible.length} {isRu ? 'СЕРВИСОВ' : 'SERVICES'}
                            </span>
                          </div>
                          <p className={appearance.clusterDesc}>
                            {language === 'ru' ? cluster.valueRu : cluster.valueEn}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setClusterFilter(activeCluster === cluster.id ? null : cluster.id)
                          }
                          className={appearance.clusterAllLink}
                        >
                          {isRu ? `Все ${eligible.length} →` : `All ${eligible.length} →`}
                        </button>
                      </div>

                      {/* Service grid — single container (nested grid + inline <style> broke layout in some engines) */}
                      <div className="grid grid-cols-3 gap-2 auto-rows-[132px] sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {hasFeature && (
                          <FeaturedTile
                            data={featured!}
                            language={language}
                            onNavigate={navigate}
                            appearance={appearance}
                          />
                        )}
                        {eligible.map((svc, idx) => (
                          <ServiceTile
                            key={`${cluster.id}-${svc.id ?? svc.path}-${idx}`}
                            service={svc}
                            clusterId={cluster.id}
                            language={language}
                            onNavigate={navigate}
                            appearance={appearance}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>

              {/* ── Trust strip ───────────────────────────── */}
              <div className={appearance.trustBar}>
                <div className={appearance.trustStats}>
                  {[
                    { num: `${stats?.properties ?? 23}+`, labelRu: 'ОБЪЕКТОВ',   labelEn: 'PROPERTIES' },
                    { num: `${stats?.providers ?? 48}+`,  labelRu: 'ПАРТНЁРОВ',  labelEn: 'PARTNERS' },
                    { num: '24/7',                        labelRu: 'ПОДДЕРЖКА',  labelEn: 'SUPPORT' },
                    { num: '100%',                        labelRu: 'ПРОВЕРЕНО',  labelEn: 'VERIFIED' },
                  ].map((t) => (
                    <span key={t.num + t.labelEn} className="flex items-baseline gap-1.5">
                      <b className={appearance.trustStatNum}>
                        {t.num}
                      </b>
                      <span>{isRu ? t.labelRu : t.labelEn}</span>
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('navigator:open-apps-drawer'))}
                  className={appearance.trustCta}
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
