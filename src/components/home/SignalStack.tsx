import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { ROLE_META, SIGNAL_SEED, SIGNAL_ROUTE } from '@/lib/roleBlend';

interface SignalStackProps {
  personas: UserPersona[];
  onRoleSheetOpen: () => void;
}

export function SignalStack({ personas, onRoleSheetOpen }: SignalStackProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const primary = personas[0];
  const secondaries = personas.slice(1, 4);

  if (!primary) return null;

  return (
    <div className="px-4 pb-5">
      <SignalHero persona={primary} isRu={isRu} />
      {secondaries.length > 0 && (
        <div className="mt-2 flex flex-col gap-1.5">
          {secondaries.map(p => <SignalSlim key={p} persona={p} isRu={isRu} />)}
        </div>
      )}
      <button
        onClick={onRoleSheetOpen}
        className="mt-2.5 w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] border border-dashed border-border text-left hover:border-border-strong transition-colors"
      >
        <span className="text-[11.5px] text-muted-foreground">{isRu ? 'Управление ролями · порядок' : 'Manage roles · reorder'}</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
        </svg>
      </button>
    </div>
  );
}

function SignalHero({ persona, isRu }: { persona: UserPersona; isRu: boolean }) {
  const navigate = useNavigate();
  const meta = ROLE_META[persona];
  const sig = SIGNAL_SEED[persona];
  if (!meta || !sig) return null;
  const stateLabel = {
    live: isRu ? 'Активно' : 'Live',
    warn: isRu ? 'Действуй' : 'Act now',
    active: isRu ? 'Активно' : 'Active',
  }[sig.state];

  return (
    <button
      onClick={() => navigate(SIGNAL_ROUTE[persona])}
      className="w-full text-left relative overflow-hidden rounded-[20px] bg-card border border-border p-[18px] active:scale-[0.99] transition-transform"
    >
      {/* 2px left spine */}
      <div className="absolute top-4 bottom-4 left-0 w-0.5 rounded-r-sm" style={{ background: meta.color }} />

      <div className="flex items-center justify-between gap-2 mb-1.5 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <RoleChip persona={persona} meta={meta} />
          <span className="text-[11px] tracking-[0.1em] uppercase text-muted-foreground/50 font-semibold truncate">
            {isRu ? sig.leadRu : sig.lead}
          </span>
        </div>
        <StateChip label={stateLabel} color={meta.color} />
      </div>
      <div className="font-display text-2xl font-bold text-foreground mb-1 leading-tight tracking-[-0.02em]">
        {sig.value}
      </div>
      <div className="text-[13px] text-muted-foreground leading-snug">
        {isRu ? sig.tailRu : sig.tail}
      </div>
    </button>
  );
}

function SignalSlim({ persona, isRu }: { persona: UserPersona; isRu: boolean }) {
  const navigate = useNavigate();
  const meta = ROLE_META[persona];
  const sig = SIGNAL_SEED[persona];
  if (!meta || !sig) return null;

  return (
    <button
      onClick={() => navigate(SIGNAL_ROUTE[persona])}
      className="w-full text-left relative overflow-hidden rounded-[14px] bg-card/60 border border-border grid grid-cols-[auto_1fr_auto] gap-2.5 items-center px-3.5 py-2.5 active:scale-[0.99] transition-transform"
    >
      <div className="absolute top-2.5 bottom-2.5 left-0 w-0.5 rounded-r-sm" style={{ background: meta.color }} />
      <RoleChip persona={persona} meta={meta} compact />
      <div className="overflow-hidden">
        <div className="text-[12.5px] font-medium text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
          <span className="text-muted-foreground">{isRu ? sig.leadRu : sig.lead} · </span>{sig.value}
        </div>
        <div className="text-[11px] text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis mt-0.5">
          {isRu ? sig.tailRu : sig.tail}
        </div>
      </div>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-30">
        <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

function RoleChip({ meta }: {
  persona?: UserPersona;
  meta: typeof ROLE_META[UserPersona];
  compact?: boolean;
}) {
  return (
    <div
      className="inline-flex items-center gap-1.5 h-[22px] px-1 pr-[7px] rounded-full flex-shrink-0 whitespace-nowrap"
      style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}33` }}
    >
      <div
        className="w-3.5 h-3.5 rounded-full flex items-center justify-center font-display text-[9px] font-bold text-[#08101E]"
        style={{ background: meta.color }}
      >
        {meta.glyph}
      </div>
      <span className="text-[10px] font-semibold tracking-[0.04em] uppercase" style={{ color: meta.color }}>
        {meta.short}
      </span>
    </div>
  );
}

function StateChip({ label, color }: { label: string; color: string }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-[9px] py-1 rounded-full flex-shrink-0 whitespace-nowrap"
      style={{ background: `${color}18`, border: `1px solid ${color}33` }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      <span className="text-[10.5px] font-semibold tracking-[0.04em] uppercase" style={{ color }}>
        {label}
      </span>
    </div>
  );
}
