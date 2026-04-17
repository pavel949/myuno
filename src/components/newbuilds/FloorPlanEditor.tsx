/**
 * FloorPlanEditor — Digital Master Plan Editor (Developer Portal)
 *
 * Features:
 * - Upload floor plan image per level/floor
 * - Click on image to place a unit pin
 * - Drag pins to reposition
 * - Unit picker popup to link a pin to a project_units row
 * - Multi-floor tabs
 * - Zoom + pan via CSS transform
 *
 * Data model:
 *   floor_plans   — one row per uploaded image
 *   project_units — pin_x_pct, pin_y_pct, floor_plan_id columns
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Trash2, ZoomIn, ZoomOut, RotateCcw, Upload, X, GripVertical } from 'lucide-react';
import { useFloorPlans, useUpsertFloorPlan, useDeleteFloorPlan, useProjectUnitsForEditor, useUpdateUnitPin, useRemoveUnitPin, DeveloperProjectUnit, FloorPlan } from '@/hooks/useDeveloperPortal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  projectId: string;
}

const STATUS_COLORS: Record<string, string> = {
  available: '#B8962E',
  soft_hold: '#F59E0B',
  reserved: '#3B82F6',
  spa_signed: '#8B5CF6',
  sold: '#6B7280',
  blocked: '#EF4444',
  not_for_sale: '#374151',
};

const PIN_SIZE = 28;

// ─── Unit Picker Modal ───────────────────────────────────────────────────────

function UnitPicker({
  units,
  floorPlanId,
  onSelect,
  onClose,
}: {
  units: DeveloperProjectUnit[];
  floorPlanId: string;
  onSelect: (unit: DeveloperProjectUnit) => void;
  onClose: () => void;
}) {
  const unlinked = units.filter(u => !u.floor_plan_id || u.floor_plan_id !== floorPlanId);
  const linked = units.filter(u => u.floor_plan_id === floorPlanId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="nb-glass rounded-2xl p-5 w-full max-w-sm max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="nb-display text-base text-[hsl(var(--nb-text))]">Выбрать юнит</h3>
          <button onClick={onClose} className="text-[hsl(var(--nb-muted))] hover:text-[hsl(var(--nb-text))]"><X className="w-4 h-4" /></button>
        </div>

        {unlinked.length === 0 && (
          <p className="text-sm text-[hsl(var(--nb-muted))] text-center py-4">
            Все юниты уже размещены на этом плане.<br />
            Добавьте больше юнитов во вкладке «Инвентарь».
          </p>
        )}

        <div className="space-y-1.5">
          {unlinked.map(u => (
            <button
              key={u.id}
              onClick={() => onSelect(u)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--nb-glass-bg))] border border-[hsl(var(--nb-glass-border))] hover:border-[hsl(var(--nb-gold)/0.4)] transition-all text-left"
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: STATUS_COLORS[u.unit_status ?? 'available'] ?? STATUS_COLORS.available }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[hsl(var(--nb-text))] truncate">
                  {u.unit_code ? `${u.unit_code} — ` : ''}{u.unit_type}
                  {u.bedrooms != null ? `, ${u.bedrooms}BR` : ''}
                </p>
                {u.price && <p className="text-xs text-[hsl(var(--nb-muted))]">฿{u.price.toLocaleString()}</p>}
              </div>
            </button>
          ))}
        </div>

        {linked.length > 0 && (
          <p className="text-xs text-[hsl(var(--nb-muted))] mt-4 text-center">
            {linked.length} юнит{linked.length > 1 ? 'а' : ''} уже на этом этаже
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Add Floor Modal ─────────────────────────────────────────────────────────

function AddFloorModal({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const upsert = useUpsertFloorPlan();
  const [name, setName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `developer-uploads/floorplans/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('property-images').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: pub } = supabase.storage.from('property-images').getPublicUrl(path);
      setImageUrl(pub.publicUrl);

      // Get image dimensions
      const img = new Image();
      img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = pub.publicUrl;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !imageUrl || !imgSize) {
      toast.error('Загрузите изображение и укажите название');
      return;
    }
    await upsert.mutateAsync({
      project_id: projectId,
      name,
      image_url: imageUrl,
      image_width_px: imgSize.w,
      image_height_px: imgSize.h,
      display_order: 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="nb-glass rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="nb-display text-base text-[hsl(var(--nb-text))]">Добавить этаж / зону</h3>
          <button onClick={onClose} className="text-[hsl(var(--nb-muted))] hover:text-[hsl(var(--nb-text))]"><X className="w-4 h-4" /></button>
        </div>

        <div>
          <label className="nb-label mb-1.5 block">Название *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Floor 1, Penthouse, Villa Zone..."
            className="w-full rounded-md bg-[hsl(var(--nb-bg))] border border-[hsl(var(--nb-glass-border))] px-3 py-2 text-sm text-[hsl(var(--nb-text))]"
          />
        </div>

        <div>
          <label className="nb-label mb-1.5 block">Изображение плана *</label>
          {imageUrl ? (
            <div className="relative">
              <img src={imageUrl} alt="floor plan" className="w-full rounded-lg object-contain max-h-32 bg-[hsl(var(--nb-surface))]" />
              <button
                onClick={() => { setImageUrl(''); setImgSize(null); }}
                className="absolute top-1 right-1 bg-black/60 rounded-full p-1"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed border-[hsl(var(--nb-glass-border))] rounded-xl p-6 flex flex-col items-center gap-2 text-[hsl(var(--nb-muted))] hover:border-[hsl(var(--nb-gold)/0.4)] transition-colors disabled:opacity-50"
            >
              <Upload className="w-6 h-6" />
              <span className="text-sm">{uploading ? 'Загрузка...' : 'PNG / JPG / PDF'}</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[hsl(var(--nb-muted))] border border-[hsl(var(--nb-glass-border))] rounded-lg">Отмена</button>
          <button
            onClick={handleSave}
            disabled={upsert.isPending || !imageUrl || !name}
            className="nb-btn-gold disabled:opacity-40"
          >
            {upsert.isPending ? 'Сохранение...' : 'Добавить'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main FloorPlanEditor ────────────────────────────────────────────────────

export function FloorPlanEditor({ projectId }: Props) {
  const { data: floorPlans = [], isLoading: plansLoading } = useFloorPlans(projectId);
  const { data: units = [] } = useProjectUnitsForEditor(projectId);
  const deleteFloorPlan = useDeleteFloorPlan();
  const updatePin = useUpdateUnitPin();
  const removePin = useRemoveUnitPin();

  const [activeFloorId, setActiveFloorId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 });
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);
  // Track drag state locally — only commit to DB on mouseUp to avoid spamming
  const [draggingUnitId, setDraggingUnitId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [showAddFloor, setShowAddFloor] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Set first floor as active when data loads
  useEffect(() => {
    if (floorPlans.length > 0 && !activeFloorId) {
      setActiveFloorId(floorPlans[0].id);
    }
  }, [floorPlans, activeFloorId]);

  const activePlan = floorPlans.find(p => p.id === activeFloorId) ?? null;
  const floorUnits = units.filter(u => u.floor_plan_id === activeFloorId);

  // ── Coordinate conversion ─────────────────────────────────────────────────

  const eventToImagePct = useCallback((e: React.MouseEvent): { x: number; y: number } | null => {
    const img = imageRef.current;
    if (!img) return null;
    const rect = img.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) return null;
    return { x, y };
  }, []);

  // ── Click on canvas = place pin (unless panning) ─────────────────────────

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (isPanning) return;
    if ((e.target as HTMLElement).closest('[data-pin]')) return; // clicked on a pin
    const pos = eventToImagePct(e);
    if (!pos) return;
    setPendingPin(pos);
  }, [isPanning, eventToImagePct]);

  // ── Pin drag ──────────────────────────────────────────────────────────────

  const handlePinMouseDown = useCallback((e: React.MouseEvent, unitId: string) => {
    e.stopPropagation();
    setDraggingUnitId(unitId);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingUnitId) {
      // Track position locally — don't write to DB on every pixel
      const pos = eventToImagePct(e);
      if (pos) setDragPos(pos);
    } else if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPan({ x: panStart.panX + dx, y: panStart.panY + dy });
    }
  }, [draggingUnitId, isPanning, eventToImagePct, panStart]);

  const handleMouseUp = useCallback(() => {
    // Commit pin position to DB on release
    if (draggingUnitId && dragPos && activePlan) {
      updatePin.mutate({
        unitId: draggingUnitId,
        floorPlanId: activePlan.id,
        pinXPct: dragPos.x,
        pinYPct: dragPos.y,
        projectId,
      });
    }
    setDraggingUnitId(null);
    setDragPos(null);
    setIsPanning(false);
  }, [draggingUnitId, dragPos, activePlan, updatePin, projectId]);

  // ── Pan on canvas background drag ────────────────────────────────────────

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-pin]')) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y });
  }, [pan]);

  // ── Wheel zoom ────────────────────────────────────────────────────────────

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.max(0.5, Math.min(4, z + delta)));
  }, []);

  // ── Unit picker result ────────────────────────────────────────────────────

  const handleUnitSelected = useCallback((unit: DeveloperProjectUnit) => {
    if (!pendingPin || !activePlan) return;
    updatePin.mutate({
      unitId: unit.id,
      floorPlanId: activePlan.id,
      pinXPct: pendingPin.x,
      pinYPct: pendingPin.y,
      projectId,
    });
    setPendingPin(null);
  }, [pendingPin, activePlan, updatePin, projectId]);

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  if (plansLoading) {
    return <div className="nb-glass p-8 text-center text-[hsl(var(--nb-muted))]">Загрузка...</div>;
  }

  if (floorPlans.length === 0) {
    return (
      <div className="nb-glass p-10 text-center space-y-4">
        <GripVertical className="w-10 h-10 mx-auto text-[hsl(var(--nb-muted)/0.4)]" />
        <div>
          <p className="text-[hsl(var(--nb-text))] font-medium mb-1">Digital Master Plan</p>
          <p className="text-sm text-[hsl(var(--nb-muted))]">
            Загрузите план этажа или ситуационный план, чтобы разместить юниты интерактивно.
          </p>
        </div>
        <button className="nb-btn-gold" onClick={() => setShowAddFloor(true)}>
          <Plus className="w-4 h-4 mr-1 inline" /> Добавить этаж / зону
        </button>
        {showAddFloor && (
          <AddFloorModal projectId={projectId} onClose={() => setShowAddFloor(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Floor tabs + add button */}
      <div className="flex items-center gap-2 flex-wrap">
        {floorPlans.map((plan: FloorPlan) => (
          <div key={plan.id} className="flex items-center gap-1">
            <button
              onClick={() => { setActiveFloorId(plan.id); resetView(); }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition-all',
                plan.id === activeFloorId
                  ? 'bg-[hsl(var(--nb-gold)/0.15)] text-[hsl(var(--nb-gold))] border border-[hsl(var(--nb-gold)/0.3)]'
                  : 'text-[hsl(var(--nb-muted))] border border-[hsl(var(--nb-glass-border))] hover:text-[hsl(var(--nb-text))]'
              )}
            >
              {plan.name}
            </button>
            {plan.id === activeFloorId && (
              <button
                onClick={() => {
                  if (window.confirm(`Удалить «${plan.name}»? Пины юнитов на этом плане будут сброшены.`)) {
                    deleteFloorPlan.mutate({ id: plan.id, project_id: projectId });
                    setActiveFloorId(floorPlans.find(p => p.id !== plan.id)?.id ?? null);
                  }
                }}
                className="text-[hsl(var(--nb-muted))] hover:text-red-400"
                title="Удалить этаж"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => setShowAddFloor(true)}
          className="px-3 py-1.5 rounded-lg text-sm border border-dashed border-[hsl(var(--nb-glass-border))] text-[hsl(var(--nb-muted))] hover:text-[hsl(var(--nb-gold))] hover:border-[hsl(var(--nb-gold)/0.3)]"
        >
          <Plus className="w-3 h-3 inline mr-1" /> Этаж
        </button>
      </div>

      {activePlan && (
        <div className="nb-glass overflow-hidden" style={{ userSelect: 'none' }}>
          {/* Toolbar */}
          <div className="flex items-center justify-between p-3 border-b border-[hsl(var(--nb-glass-border))]">
            <div className="flex items-center gap-1.5">
              <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="p-1.5 rounded-lg hover:bg-[hsl(var(--nb-glass-bg))] text-[hsl(var(--nb-muted))] hover:text-[hsl(var(--nb-text))]">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-1.5 rounded-lg hover:bg-[hsl(var(--nb-glass-bg))] text-[hsl(var(--nb-muted))] hover:text-[hsl(var(--nb-text))]">
                <ZoomOut className="w-4 h-4" />
              </button>
              <button onClick={resetView} className="p-1.5 rounded-lg hover:bg-[hsl(var(--nb-glass-bg))] text-[hsl(var(--nb-muted))] hover:text-[hsl(var(--nb-text))]">
                <RotateCcw className="w-4 h-4" />
              </button>
              <span className="nb-mono text-xs text-[hsl(var(--nb-muted))] ml-1">{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[hsl(var(--nb-muted))]">
              <span>{floorUnits.length} пин{floorUnits.length !== 1 ? 'ов' : ''}</span>
              <span>·</span>
              <span>Клик на план — разместить юнит</span>
            </div>
          </div>

          {/* Canvas */}
          <div
            ref={containerRef}
            className="relative overflow-hidden bg-[hsl(var(--nb-bg))]"
            style={{ height: '560px', cursor: isPanning ? 'grabbing' : 'crosshair' }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onClick={handleCanvasClick}
          >
            {/* Zoomable/pannable container */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  position: 'relative',
                  display: 'inline-block',
                }}
              >
                <img
                  ref={imageRef}
                  src={activePlan.image_url}
                  alt={activePlan.name}
                  className="block max-w-none"
                  style={{ maxHeight: '500px', maxWidth: '900px', objectFit: 'contain', pointerEvents: 'none' }}
                  draggable={false}
                />

                {/* Pins */}
                {floorUnits.map(unit => {
                  if (unit.pin_x_pct == null || unit.pin_y_pct == null) return null;
                  const color = STATUS_COLORS[unit.unit_status ?? 'available'] ?? STATUS_COLORS.available;
                  // Use live dragPos for the currently-dragging pin for smooth UX
                  const pinX = (draggingUnitId === unit.id && dragPos) ? dragPos.x : unit.pin_x_pct;
                  const pinY = (draggingUnitId === unit.id && dragPos) ? dragPos.y : unit.pin_y_pct;
                  return (
                    <div
                      key={unit.id}
                      data-pin="true"
                      style={{
                        position: 'absolute',
                        left: `calc(${pinX}% - ${PIN_SIZE / 2}px)`,
                        top: `calc(${pinY}% - ${PIN_SIZE / 2}px)`,
                        width: PIN_SIZE,
                        height: PIN_SIZE,
                        borderRadius: '50% 50% 50% 0',
                        transform: 'rotate(-45deg)',
                        background: color,
                        border: '2px solid rgba(255,255,255,0.7)',
                        cursor: 'grab',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                        zIndex: 10,
                      }}
                      onMouseDown={e => handlePinMouseDown(e, unit.id)}
                      title={`${unit.unit_code ?? ''} ${unit.unit_type} — перетащить для перемещения`}
                    >
                      {/* Label inside pin */}
                      <div style={{
                        transform: 'rotate(45deg)',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 8,
                        fontWeight: 700,
                        color: 'white',
                        overflow: 'hidden',
                      }}>
                        {(unit.unit_code ?? unit.unit_type).slice(0, 3).toUpperCase()}
                      </div>

                      {/* Remove button (visible on hover) */}
                      <button
                        data-pin="true"
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => {
                          e.stopPropagation();
                          removePin.mutate({ unitId: unit.id, projectId });
                        }}
                        style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          transform: 'rotate(45deg)',
                          background: '#EF4444',
                          border: '1px solid white',
                          borderRadius: '50%',
                          width: 16,
                          height: 16,
                          display: 'none',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 20,
                          fontSize: 10,
                          color: 'white',
                          lineHeight: 1,
                        }}
                        className="pin-remove-btn"
                        title="Убрать пин"
                      >✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="p-3 border-t border-[hsl(var(--nb-glass-border))] flex flex-wrap gap-3">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5 text-xs text-[hsl(var(--nb-muted))]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                {status}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unit Picker when pin is pending */}
      {pendingPin && activePlan && (
        <UnitPicker
          units={units}
          floorPlanId={activePlan.id}
          onSelect={handleUnitSelected}
          onClose={() => setPendingPin(null)}
        />
      )}

      {showAddFloor && (
        <AddFloorModal projectId={projectId} onClose={() => setShowAddFloor(false)} />
      )}

      {/* CSS for pin hover */}
      <style>{`
        [data-pin="true"]:hover .pin-remove-btn { display: flex !important; }
      `}</style>
    </div>
  );
}
