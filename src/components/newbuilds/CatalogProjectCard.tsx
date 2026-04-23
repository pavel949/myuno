/**
 * CatalogProjectCard — Rich reference-style project card
 * Rating badge, BUY/WATCH/AVOID, risk tier, yield, tags, Inquiry+WhatsApp
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Phone, ExternalLink, Bed, Waves, Building, Users, Target, Star, MapPin } from 'lucide-react';
import type { OffplanProject } from '@/hooks/useOffplanProjects';
import type { OffplanCatalogFacet, RecLabel } from '@/lib/offplan/types';
import { APP_ROUTES } from '@/lib/config/routes';

const THB_USD_RATE = 35;

const REC_COLORS: Record<RecLabel, { bg: string; text: string; border: string }> = {
  BUY:   { bg: 'hsl(var(--rec-buy) / 0.15)',   text: 'hsl(var(--rec-buy))',   border: 'hsl(var(--rec-buy) / 0.4)' },
  WATCH: { bg: 'hsl(var(--rec-watch) / 0.15)', text: 'hsl(var(--rec-watch))', border: 'hsl(var(--rec-watch) / 0.4)' },
  AVOID: { bg: 'hsl(var(--rec-avoid) / 0.15)', text: 'hsl(var(--rec-avoid))', border: 'hsl(var(--rec-avoid) / 0.4)' },
};

const BEACH_LABELS: Record<string, string> = { bf: 'Beachfront', '500': '< 500m', '1k': '< 1km', inl: 'Inland' };
const OWN_LABELS: Record<string, string> = { fh: 'Freehold', lh: 'Leasehold', both: 'FH + LH' };
const MGMT_LABELS: Record<string, string> = { hotel: 'Hotel-managed', self: 'Self-managed', optional: 'Optional' };
const FOCUS_LABELS: Record<string, string> = { inv: 'Investment', life: 'Lifestyle', mixed: 'Mixed' };

function formatPrice(thb: number | null): string {
  if (!thb) return '—';
  if (thb >= 1e6) return `฿${(thb / 1e6).toFixed(1)}M`;
  if (thb >= 1e3) return `฿${(thb / 1e3).toFixed(0)}K`;
  return `฿${thb}`;
}

function formatUsd(thb: number | null): string {
  if (!thb) return '';
  const usd = thb / THB_USD_RATE;
  if (usd >= 1e6) return `$${(usd / 1e6).toFixed(1)}M`;
  if (usd >= 1e3) return `$${(usd / 1e3).toFixed(0)}K`;
  return `$${Math.round(usd)}`;
}

interface Props {
  project: OffplanProject;
  rank?: number;
  onInquiry: (project: OffplanProject) => void;
}

export function CatalogProjectCard({ project, rank, onInquiry }: Props) {
  const c = project.offplanCatalog;
  const rec = c?.rec || (project.riskLevel?.toUpperCase() as RecLabel | undefined);
  const rating = c?.rating ?? project.muunoScore;
  const completionYear = c?.comp_y || (project.completionDate ? new Date(project.completionDate).getFullYear() : null);
  const completionQ = c?.comp_q;

  const riskTier = project.riskLevel;
  const seg = c?.seg;
  const zone = c?.zone || project.district;
  const tags = c?.tags || [];

  const waText = encodeURIComponent(
    `Hello! I am interested in: ${project.nameEn}${zone ? ` (${zone})` : ''}`
  );

  const isFeatured = project.isFeatured;

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: 'hsl(var(--nb-surface))',
        border: isFeatured ? '2px solid hsl(var(--nb-gold))' : '1px solid hsl(var(--nb-gold) / 0.12)',
        boxShadow: isFeatured ? '0 0 20px hsl(var(--nb-gold) / 0.15)' : undefined,
      }}
    >
      {/* Image */}
      <Link to={APP_ROUTES.OFFPLAN_DETAIL(project.id)} className="block relative h-44 overflow-hidden">
        {project.coverImage ? (
          <img
            src={project.coverImage}
            alt={project.nameEn}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'hsl(var(--nb-bg))' }}>
            <Building className="w-10 h-10 opacity-30" style={{ color: 'hsl(var(--nb-muted))' }} />
          </div>
        )}

        {/* Featured badge */}
        {isFeatured && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
            style={{ background: 'hsl(var(--nb-gold))', color: 'hsl(var(--nb-bg))' }}
          >
            <span className="inline-flex items-center gap-1"><Star className="w-3 h-3 fill-current" aria-hidden />{project.featuredLabel || 'FEATURED'}</span>
          </div>
        )}

        {/* Rating badge */}
        {rating != null && rating > 0 && (
          <div
            className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold"
            style={{ background: 'hsl(var(--nb-gold))', color: 'hsl(var(--nb-bg))' }}
          >
            {rating.toFixed(1)}
            {rank != null && <span className="ml-1 opacity-70">#{rank}</span>}
          </div>
        )}

        {/* Rec badge */}
        {rec && REC_COLORS[rec] && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: REC_COLORS[rec].bg,
              color: REC_COLORS[rec].text,
              border: `1px solid ${REC_COLORS[rec].border}`,
            }}
          >
            {rec}
          </div>
        )}

        {/* Segment badge */}
        {seg && (
          <div
            className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
            style={{
              background: 'hsl(var(--nb-bg) / 0.85)',
              color: 'hsl(var(--nb-gold))',
              border: '1px solid hsl(var(--nb-gold) / 0.3)',
            }}
          >
            {seg}
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-3.5 space-y-2.5">
        {/* Title + Developer */}
        <div>
          <Link to={APP_ROUTES.OFFPLAN_DETAIL(project.id)}>
            <h3 className="text-sm font-bold leading-tight line-clamp-1" style={{ color: 'hsl(var(--nb-text))', fontFamily: 'var(--font-heading-nb)' }}>
              {project.nameEn}
            </h3>
          </Link>
          {project.developerName && (
            <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--nb-muted))' }}>
              {project.developerName}
            </p>
          )}
        </div>

        {/* Risk + Completion */}
        <div className="flex items-center gap-2 text-[11px]" style={{ color: 'hsl(var(--nb-muted))' }}>
          {riskTier && (
            <span className="px-1.5 py-0.5 rounded" style={{ background: 'hsl(var(--nb-gold) / 0.08)', color: 'hsl(var(--nb-gold))' }}>
              Risk {riskTier}
            </span>
          )}
          {completionYear && (
            <span>{completionQ ? `${completionQ} ` : ''}{completionYear}</span>
          )}
        </div>

        {/* Price row */}
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold" style={{ color: 'hsl(var(--nb-text))', fontFamily: 'var(--font-mono-nb, monospace)' }}>
            {formatPrice(project.priceFrom)}
          </span>
          {project.priceFrom && (
            <span className="text-[11px]" style={{ color: 'hsl(var(--nb-muted))' }}>
              {formatUsd(project.priceFrom)}
            </span>
          )}
          {project.roiProjected && (
            <span className="text-[11px] ml-auto font-medium" style={{ color: 'hsl(var(--rec-buy))' }}>
              ~{project.roiProjected}%
            </span>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {c?.beach && (
            <TagPill icon={<Waves className="w-3 h-3" />} label={BEACH_LABELS[c.beach] || c.beach} />
          )}
          {c?.own && (
            <TagPill label={OWN_LABELS[c.own] || c.own} />
          )}
          {c?.mgmt && (
            <TagPill label={MGMT_LABELS[c.mgmt] || c.mgmt} />
          )}
          {c?.focus && (
            <TagPill icon={<Target className="w-3 h-3" />} label={FOCUS_LABELS[c.focus] || c.focus} />
          )}
          {c?.min_br != null && (
            <TagPill icon={<Bed className="w-3 h-3" />} label={`${c.min_br}+ BR`} />
          )}
        </div>

        {/* Zone + Units */}
        <div className="flex items-center justify-between text-[11px]" style={{ color: 'hsl(var(--nb-muted))' }}>
          {zone && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" aria-hidden />{zone}</span>}
          {project.unitsAvailable > 0 && (
            <span>{project.unitsAvailable} units</span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onInquiry(project)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: 'hsl(var(--nb-gold))',
              color: 'hsl(var(--nb-bg))',
            }}
          >
            <Phone className="w-3.5 h-3.5" />
            Inquiry
          </button>
          <a
            href={`https://wa.me/66922407355?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: 'hsl(var(--brand-whatsapp) / 0.15)',
              color: 'hsl(var(--brand-whatsapp))',
              border: '1px solid hsl(var(--brand-whatsapp) / 0.3)',
            }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WA
          </a>
        </div>
      </div>
    </div>
  );
}

function TagPill({ icon, label }: { icon?: React.ReactNode; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]"
      style={{
        background: 'hsl(var(--nb-gold) / 0.06)',
        color: 'hsl(var(--nb-muted))',
        border: '1px solid hsl(var(--nb-gold) / 0.1)',
      }}
    >
      {icon}
      {label}
    </span>
  );
}
