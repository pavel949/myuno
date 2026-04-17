/**
 * PublicFloorPlan — buyer-facing Digital Master Plan
 *
 * Features:
 * - Floor tabs
 * - Coloured pins per unit status (available=gold, reserved=blue, sold=grey)
 * - Tap pin → bottom sheet (mobile) / side panel (desktop) with unit info + lead form
 * - Filter: All | Available | Reserved | Sold
 * - Legend + live counter
 * - Zoom + pan via CSS transforms (mouse wheel + drag)
 * - Mobile touch zoom/pan
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Maximize, Bed, Bath, Layers, Eye, ZoomIn, ZoomOut, RotateCcw, Clock, Lock } from 'lucide-react';
import { useFloorPlans, FloorPlan, useSoftHold, useCreateBookingCheckout } from '@/hooks/useDeveloperPortal';
import { useProjectUnitsForEditor, DeveloperProjectUnit } from '@/hooks/useDeveloperPortal';
import { NbLeadForm } from './NbLeadForm';
import { NbPriceDisplay } from './NbPriceDisplay';
import { cn } from '@/lib/utils';

interface Props {
  projectId: string;
  developerId?: string;
}

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  available:    { label: 'Доступен',    color: '#B8962E', bg: 'rgba(184,150,46,0.15)' },
  soft_hold:    { label: 'Удержание',   color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  reserved:     { label: 'Забронировано', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  spa_signed:   { label: 'SPA подписан', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
  sold:         { label: 'Продано',     color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
  blocked:      { label: 'Заблокирован',color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  not_for_sale: { label: 'Не продаётся',color: '#374151', bg: 'rgba(55,65,81,0.15)' },
};

type Filter = 'all' | 'available' | 'reserved' | 'sold';

const FILTER_LABELS: [Filter, string][] = [
  ['all',       'Все'],
  ['available', 'Доступные'],
  ['reserved',  'Забронировано'],
  ['sold',      'Продано'],
];

function statusMatchesFilter(status: string, filter: Filter): boolean {
  if (filter === 'all') return true;
  if (filter === 'available') return status === 'available';
  if (filter === 'reserved') return ['soft_hold', 'reserved', 'spa_signed'].includes(status);
  if (filter === 'sold') return ['sold', 'not_for_sale', 'blocked'].includes(status);
  return true;
}

const PIN_SIZE = 26;

// ── Countdown timer hook ────────────────────────────────────────────────────

function useCountdown(expiresAt: string | null): string | null {
  const [display, setDisplay] = useState<string | null>(null);

  useEffect(() => {
    if (!expiresAt) { setDisplay(null); return; }

    function tick() {
      const ms = new Date(expiresAt!).getTime() - Date.now();
      if (ms <= 0) { setDisplay('00:00'); return; }
      const totalSec = Math.ceil(ms / 1000);
      const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
      const s = (totalSec % 60).toString().padStart(2, '0');
      setDisplay(`${m}:${s}`);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return display;
}

// ── Unit Detail Sheet ────────────────────────────────────────────────────────

function UnitSheet({
  unit,
  projectId,
  developerId,
  onClose,
}: {
  unit: DeveloperProjectUnit;
  projectId: string;
  developerId?: string;
  onClose: () => void;
}) {
  const cfg = STATUS_CONFIG[unit.unit_status ?? 'available'] ?? STATUS_CONFIG.available;
  const [showLead, setShowLead] = useState(false);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [holdId, setHoldId] = useState<string | null>(null);
  const softHold = useSoftHold();
  const bookingCheckout = useCreateBookingCheckout();
  const countdown = useCountdown(holdExpiresAt);

  const isAvailable = (unit.unit_status ?? 'available') === 'available';

  function handleSoftHold() {
    softHold.mutate(
      {
        unitId: unit.id,
        expectedVersion: unit.status_version ?? 0,
        projectId,
      },
      {
        onSuccess: (data) => {
          setHoldExpiresAt(data.expires_at);
          setHoldId(data.hold_id);
        },
      },
    );
  }

  function handleBookingFee() {
    if (!holdId) return;
    const base = window.location.origin;
    bookingCheckout.mutate(
      {
        unitId: unit.id,
        holdId,
        projectId,
        successUrl: `${base}/newbuilds/${projectId}?booking=success&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${base}/newbuilds/${projectId}?booking=cancelled`,
      },
      {
        onSuccess: ({ checkout_url }) => {
          window.location.href = checkout_url;
        },
      },
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={onClose} />

      {/* Sheet — bottom on mobile, right panel on desktop */}
      <div
        className={cn(
          'fixed z-50 bg-[hsl(var(--nb-surface))] border-[hsl(var(--nb-glass-border))]',
          'bottom-0 left-0 right-0 rounded-t-2xl border-t',
          'md:top-0 md:right-0 md:bottom-0 md:left-auto md:w-80 md:rounded-none md:border-l md:border-t-0',
          'overflow-y-auto transition-transform duration-300',
        )}
        style={{ maxHeight: '85vh' }}
      >
        {/* Handle (mobile) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[hsl(var(--nb-glass-border))]" />
        </div>

        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="nb-display text-xl text-[hsl(var(--nb-text))]">
                {unit.unit_code ? `Юнит ${unit.unit_code}` : unit.unit_type}
              </h3>
              <span
                className="inline-block text-xs px-2 py-0.5 rounded-full mt-1"
                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }}
              >
                {cfg.label}
              </span>
            </div>
            <button onClick={onClose} className="text-[hsl(var(--nb-muted))] hover:text-[hsl(var(--nb-text))] mt-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Floor plan image */}
          {unit.floor_plan_image_url && (
            <img
              src={unit.floor_plan_image_url}
              alt="Floor plan"
              className="w-full rounded-xl object-contain max-h-40 bg-[hsl(var(--nb-bg))]"
            />
          )}

          {/* Specs */}
          <div className="grid grid-cols-2 gap-3">
            {unit.area_sqm && (
              <div className="flex items-center gap-2">
                <Maximize className="w-4 h-4 text-[hsl(var(--nb-gold))]" />
                <span className="text-sm text-[hsl(var(--nb-text))]">{unit.area_sqm} м²</span>
              </div>
            )}
            {unit.bedrooms != null && (
              <div className="flex items-center gap-2">
                <Bed className="w-4 h-4 text-[hsl(var(--nb-gold))]" />
                <span className="text-sm text-[hsl(var(--nb-text))]">{unit.bedrooms} спален</span>
              </div>
            )}
            {unit.bathrooms != null && (
              <div className="flex items-center gap-2">
                <Bath className="w-4 h-4 text-[hsl(var(--nb-gold))]" />
                <span className="text-sm text-[hsl(var(--nb-text))]">{unit.bathrooms} ванных</span>
              </div>
            )}
            {unit.floor != null && (
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[hsl(var(--nb-gold))]" />
                <span className="text-sm text-[hsl(var(--nb-text))]">Этаж {unit.floor}</span>
              </div>
            )}
            {unit.view_type && (
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[hsl(var(--nb-gold))]" />
                <span className="text-sm text-[hsl(var(--nb-text))]">{unit.view_type}</span>
              </div>
            )}
          </div>

          {/* Price */}
          {unit.price && (
            <div className="border-t border-[hsl(var(--nb-glass-border))] pt-4">
              <NbPriceDisplay price={unit.price} showFrom={false} size="lg" />
              {unit.price && unit.area_sqm && (
                <p className="text-xs text-[hsl(var(--nb-muted))] nb-mono mt-0.5">
                  ฿{Math.round(unit.price / unit.area_sqm).toLocaleString()}/м²
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          {unit.notes && (
            <p className="text-sm text-[hsl(var(--nb-text-secondary))]">{unit.notes}</p>
          )}

          {/* CTA block */}
          {isAvailable ? (
            holdExpiresAt ? (
              /* ── Active soft hold countdown ── */
              <div
                className="rounded-xl p-4 space-y-3 border"
                style={{
                  background: 'rgba(184,150,46,0.08)',
                  borderColor: 'rgba(184,150,46,0.3)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" style={{ color: '#B8962E' }} />
                  <span className="text-sm font-medium" style={{ color: '#B8962E' }}>
                    Юнит удержан для вас
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[hsl(var(--nb-muted))]" />
                  <span className="nb-mono text-2xl font-bold text-[hsl(var(--nb-text))]">
                    {countdown ?? '30:00'}
                  </span>
                  <span className="text-xs text-[hsl(var(--nb-muted))]">осталось</span>
                </div>
                <p className="text-xs text-[hsl(var(--nb-muted))]">
                  Оплатите бронирование сейчас или оставьте заявку
                </p>
                {holdId && (
                  <button
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
                    style={{ background: '#B8962E', color: '#fff' }}
                    disabled={bookingCheckout.isPending}
                    onClick={handleBookingFee}
                  >
                    <Lock className="w-4 h-4" />
                    {bookingCheckout.isPending ? 'Переход к оплате...' : 'Забронировать — ฿25,000'}
                  </button>
                )}
                {showLead ? (
                  <NbLeadForm
                    projectId={projectId}
                    developerId={developerId}
                    source={`soft_hold_unit_${unit.unit_code ?? unit.id}`}
                    compact={false}
                  />
                ) : (
                  <button
                    className="w-full rounded-xl py-3 text-sm font-medium border"
                    style={{
                      borderColor: 'rgba(184,150,46,0.3)',
                      color: '#B8962E',
                      background: 'transparent',
                    }}
                    onClick={() => setShowLead(true)}
                  >
                    Сохранить заявку на консультацию
                  </button>
                )}
              </div>
            ) : showLead ? (
              <NbLeadForm
                projectId={projectId}
                developerId={developerId}
                source={`floor_plan_unit_${unit.unit_code ?? unit.id}`}
                compact={false}
              />
            ) : (
              /* ── Available unit CTAs ── */
              <div className="space-y-2">
                <button
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all"
                  style={{
                    background: 'rgba(184,150,46,0.12)',
                    color: '#B8962E',
                    border: '1px solid rgba(184,150,46,0.3)',
                  }}
                  disabled={softHold.isPending}
                  onClick={handleSoftHold}
                >
                  <Lock className="w-4 h-4" />
                  {softHold.isPending ? 'Удержание...' : 'Удержать на 30 мин'}
                </button>
                <button className="nb-btn-gold w-full" onClick={() => setShowLead(true)}>
                  Запросить этот юнит
                </button>
              </div>
            )
          ) : (
            <p className="text-center text-sm text-[hsl(var(--nb-muted))] py-2">{cfg.label}</p>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main PublicFloorPlan ────────────────────────────────────────────────────

export function PublicFloorPlan({ projectId, developerId }: Props) {
  const { data: floorPlans = [], isLoading: plansLoading } = useFloorPlans(projectId);
  const { data: rawUnits = [], isLoading: unitsLoading } = useProjectUnitsForEditor(projectId);

  const [activeFloorId, setActiveFloorId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedUnit, setSelectedUnit] = useState<DeveloperProjectUnit | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 });

  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (floorPlans.length > 0 && !activeFloorId) {
      setActiveFloorId(floorPlans[0].id);
    }
  }, [floorPlans, activeFloorId]);

  const activePlan = floorPlans.find(p => p.id === activeFloorId) ?? null;

  // Units pinned to the active floor
  const floorUnits = rawUnits.filter(u => u.floor_plan_id === activeFloorId && u.pin_x_pct != null && u.pin_y_pct != null);

  const visibleUnits = floorUnits.filter(u => statusMatchesFilter(u.unit_status ?? 'available', filter)) as (DeveloperProjectUnit & { pin_x_pct: number; pin_y_pct: number })[];

  // ── Zoom/pan handlers ────────────────────────────────────────────────────

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.max(0.5, Math.min(4, z + delta)));
  }, []);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-pin]')) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    setPan({ x: panStart.panX + dx, y: panStart.panY + dy });
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // ── Stats ────────────────────────────────────────────────────────────────

  const allPinned = rawUnits.filter(u => u.floor_plan_id === activeFloorId);
  const countAvailable = allPinned.filter(u => u.unit_status === 'available').length;
  const countReserved = allPinned.filter(u => ['soft_hold', 'reserved', 'spa_signed'].includes(u.unit_status ?? '')).length;
  const countSold = allPinned.filter(u => ['sold', 'not_for_sale', 'blocked'].includes(u.unit_status ?? '')).length;

  if (plansLoading || unitsLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-[hsl(var(--nb-muted))]">
        Загрузка плана...
      </div>
    );
  }

  if (floorPlans.length === 0) {
    return (
      <div className="text-center py-16 text-[hsl(var(--nb-muted))]">
        <p className="nb-display text-xl mb-2">Интерактивный план недоступен</p>
        <p className="text-sm">Запросите информацию о доступных юнитах ниже</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Floor tabs */}
      {floorPlans.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          {floorPlans.map((plan: FloorPlan) => (
            <button
              key={plan.id}
              onClick={() => { setActiveFloorId(plan.id); resetView(); }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition-all',
                plan.id === activeFloorId
                  ? 'bg-[hsl(var(--nb-gold)/0.15)] text-[hsl(var(--nb-gold))] border border-[hsl(var(--nb-gold)/0.3)]'
                  : 'text-[hsl(var(--nb-muted))] border border-[hsl(var(--nb-glass-border))]'
              )}
            >
              {plan.name}
            </button>
          ))}
        </div>
      )}

      {/* Availability stats bar */}
      {allPinned.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-[hsl(var(--nb-text-secondary))]">
            {countAvailable} доступно · {countReserved} забронировано · {countSold} продано
          </span>
          <div className="h-2 flex-1 rounded-full overflow-hidden bg-[hsl(var(--nb-glass-bg))] min-w-[120px]">
            <div className="h-full flex">
              <div style={{ width: `${(countAvailable / allPinned.length) * 100}%`, background: STATUS_CONFIG.available.color }} />
              <div style={{ width: `${(countReserved / allPinned.length) * 100}%`, background: STATUS_CONFIG.reserved.color }} />
              <div style={{ width: `${(countSold / allPinned.length) * 100}%`, background: STATUS_CONFIG.sold.color }} />
            </div>
          </div>
        </div>
      )}

      {/* Filter buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_LABELS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="px-3 py-1 rounded-full text-xs transition-all"
            style={{
              background: filter === key ? 'hsl(var(--nb-gold))' : 'hsl(var(--nb-gold) / 0.08)',
              color: filter === key ? 'hsl(var(--nb-bg))' : 'hsl(var(--nb-gold))',
              border: `1px solid hsl(var(--nb-gold) / ${filter === key ? '1' : '0.2'})`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {activePlan && (
        <div className="nb-glass overflow-hidden">
          {/* Zoom toolbar */}
          <div className="flex items-center gap-1.5 p-2 border-b border-[hsl(var(--nb-glass-border))]">
            <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="p-1.5 rounded hover:bg-[hsl(var(--nb-glass-bg))] text-[hsl(var(--nb-muted))]">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-1.5 rounded hover:bg-[hsl(var(--nb-glass-bg))] text-[hsl(var(--nb-muted))]">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={resetView} className="p-1.5 rounded hover:bg-[hsl(var(--nb-glass-bg))] text-[hsl(var(--nb-muted))]">
              <RotateCcw className="w-4 h-4" />
            </button>
            <span className="nb-mono text-xs text-[hsl(var(--nb-muted))]">{Math.round(zoom * 100)}%</span>
            <span className="ml-auto text-xs text-[hsl(var(--nb-muted))]">
              {visibleUnits.length} {visibleUnits.length !== 1 ? 'юнитов' : 'юнит'} на плане
            </span>
          </div>

          {/* Map canvas */}
          <div
            className="relative overflow-hidden bg-[hsl(var(--nb-bg))]"
            style={{
              height: 480,
              cursor: isPanning ? 'grabbing' : 'grab',
              userSelect: 'none',
            }}
            onWheel={handleWheel}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                position: 'relative',
                display: 'inline-block',
              }}>
                <img
                  ref={imageRef}
                  src={activePlan.image_url}
                  alt={activePlan.name}
                  className="block max-w-none"
                  style={{ maxHeight: '440px', maxWidth: '860px', objectFit: 'contain', pointerEvents: 'none' }}
                  draggable={false}
                />

                {/* Pins */}
                {visibleUnits.map(unit => {
                  const cfg = STATUS_CONFIG[unit.unit_status ?? 'available'] ?? STATUS_CONFIG.available;
                  const isAvailable = (unit.unit_status ?? 'available') === 'available';
                  return (
                    <div
                      key={unit.id}
                      data-pin="true"
                      onClick={e => { e.stopPropagation(); setSelectedUnit(unit); }}
                      style={{
                        position: 'absolute',
                        left: `calc(${unit.pin_x_pct}% - ${PIN_SIZE / 2}px)`,
                        top: `calc(${unit.pin_y_pct}% - ${PIN_SIZE / 2}px)`,
                        width: PIN_SIZE,
                        height: PIN_SIZE,
                        borderRadius: '50% 50% 50% 0',
                        transform: 'rotate(-45deg)',
                        background: cfg.color,
                        border: `2px solid ${isAvailable ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)'}`,
                        cursor: 'pointer',
                        boxShadow: `0 2px 8px rgba(0,0,0,0.4), 0 0 0 ${isAvailable ? '3px' : '0'} ${cfg.color}40`,
                        zIndex: 10,
                        transition: 'transform 0.1s, box-shadow 0.1s',
                      }}
                      title={`${unit.unit_code ?? unit.unit_type} — ${cfg.label}`}
                    >
                      <div style={{
                        transform: 'rotate(45deg)',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 7,
                        fontWeight: 700,
                        color: 'white',
                        overflow: 'hidden',
                      }}>
                        {(unit.unit_code ?? unit.unit_type).slice(0, 3).toUpperCase()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="p-3 border-t border-[hsl(var(--nb-glass-border))] flex flex-wrap gap-3">
            {Object.entries(STATUS_CONFIG)
              .filter(([s]) => ['available', 'reserved', 'spa_signed', 'sold'].includes(s))
              .map(([status, cfg]) => (
                <div key={status} className="flex items-center gap-1.5 text-xs text-[hsl(var(--nb-muted))]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />
                  {cfg.label}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Unit detail sheet */}
      {selectedUnit && (
        <UnitSheet
          unit={selectedUnit}
          projectId={projectId}
          developerId={developerId}
          onClose={() => setSelectedUnit(null)}
        />
      )}
    </div>
  );
}
