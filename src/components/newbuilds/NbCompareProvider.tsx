/**
 * NbCompareProvider — Compare context for newbuild projects (max 3)
 * Follows same pattern as PropertyCompare.tsx
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, GitCompareArrows } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { FLOATING, FLOATING_OFFSET } from '@/lib/nav/floatingStack';

const MAX_COMPARE = 3;
const STORAGE_KEY = 'myuno_compare_newbuilds';

export interface CompareNewbuild {
  id: string;
  name_en: string;
  name_ru?: string | null;
  cover_image?: string | null;
  location_area?: string | null;
  price_from?: number | null;
  price_to?: number | null;
  developer_name?: string | null;
  construction_progress?: number;
  completion_date?: string | null;
  project_status?: string;
  total_units?: number | null;
  amenities?: string[] | null;
  unit_types?: string[] | null;
  muuno_score?: number | null;
}

interface NbCompareContextType {
  items: CompareNewbuild[];
  add: (project: CompareNewbuild) => void;
  remove: (id: string) => void;
  clear: () => void;
  isInCompare: (id: string) => boolean;
}

const NbCompareContext = createContext<NbCompareContextType | null>(null);

export function useNbCompare() {
  const ctx = useContext(NbCompareContext);
  if (!ctx) throw new Error('useNbCompare must be used within NbCompareProvider');
  return ctx;
}

export function NbCompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareNewbuild[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback((project: CompareNewbuild) => {
    setItems(prev => {
      if (prev.length >= MAX_COMPARE) {
        toast.error(`Максимум ${MAX_COMPARE} проекта для сравнения`);
        return prev;
      }
      if (prev.some(p => p.id === project.id)) {
        toast.info('Уже в сравнении');
        return prev;
      }
      toast.success('Добавлено к сравнению');
      return [...prev, project];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(p => p.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const isInCompare = useCallback((id: string) => items.some(p => p.id === id), [items]);

  return (
    <NbCompareContext.Provider value={{ items, add, remove, clear, isInCompare }}>
      {children}
      {/* Floating compare bar */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={`fixed ${FLOATING_OFFSET.aboveBottomNav} left-4 right-4 md:left-auto md:right-8 md:w-auto ${FLOATING.compare}`}
          >
            <div className="nb-glass p-3 flex items-center gap-3 nb-glow-pulse" style={{ background: 'hsl(var(--nb-bg) / 0.95)' }}>
              <GitCompareArrows className="w-5 h-5 flex-shrink-0" style={{ color: 'hsl(var(--nb-gold))' }} />
              <div className="flex gap-2">
                {items.map(item => (
                  <div key={item.id} className="relative group">
                    <div className="w-10 h-10 rounded-lg overflow-hidden" style={{ background: 'hsl(var(--nb-surface))' }}>
                      {item.cover_image ? (
                        <img src={item.cover_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] nb-mono" style={{ color: 'hsl(var(--nb-muted))' }}>
                          {(item.name_ru || item.name_en).slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => remove(item.id)}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'hsl(0 70% 50%)', color: 'white', fontSize: '8px' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {items.length < MAX_COMPARE && (
                  <div className="w-10 h-10 rounded-lg border-2 border-dashed flex items-center justify-center" style={{ borderColor: 'hsl(var(--nb-gold) / 0.3)' }}>
                    <span className="text-xs" style={{ color: 'hsl(var(--nb-gold) / 0.5)' }}>+</span>
                  </div>
                )}
              </div>
              <Link
                to="/newbuilds/compare"
                className="px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap"
                style={{ background: 'hsl(var(--nb-gold))', color: 'hsl(var(--nb-bg))' }}
              >
                Сравнить ({items.length})
              </Link>
              <button onClick={clear} className="p-1.5" style={{ color: 'hsl(var(--nb-muted))' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </NbCompareContext.Provider>
  );
}
