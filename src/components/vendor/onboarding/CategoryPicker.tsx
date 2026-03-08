/**
 * Airbnb-style Category Picker for Vendor Onboarding
 * Two-level: Group → Items, visual grid with icons
 */
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { VERTICAL_GROUPS, type VerticalGroup, type VerticalGroupItem } from '@/lib/verticalGroups';
import { VERTICALS, type VerticalDefinition } from '@/lib/verticals';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check } from 'lucide-react';

interface CategoryPickerProps {
  value: string;
  onChange: (categoryId: string, label: string) => void;
}

// Flatten VERTICALS for lookup
const verticalMap: Record<string, VerticalDefinition> = {};
for (const v of Object.values(VERTICALS)) {
  verticalMap[v.id] = v;
}

// Filter groups relevant for vendors (exclude help)
const VENDOR_GROUPS = VERTICAL_GROUPS.filter(g => g.id !== 'help');

function resolveItem(item: VerticalGroupItem) {
  if (item.verticalId && verticalMap[item.verticalId]) {
    const v = verticalMap[item.verticalId];
    return { id: v.id, icon: v.icon, labelEn: v.labelEn, labelRu: v.labelRu };
  }
  if (item.route) {
    const slug = item.route.split('/').pop() || item.route;
    return { id: slug, icon: item.icon || '📌', labelEn: item.labelEn || slug, labelRu: item.labelRu || slug };
  }
  return null;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [selectedGroup, setSelectedGroup] = useState<VerticalGroup | null>(null);

  // Find current selection label for display
  const findLabel = () => {
    for (const group of VENDOR_GROUPS) {
      for (const item of group.items) {
        const resolved = resolveItem(item);
        if (resolved && resolved.id === value) {
          return { group, item: resolved };
        }
      }
    }
    return null;
  };

  const current = findLabel();

  return (
    <div className="space-y-3">
      {/* Selected badge */}
      {current && !selectedGroup && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary/5 border border-primary/20">
          <span className="text-lg">{current.item.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{isRu ? current.item.labelRu : current.item.labelEn}</p>
            <p className="text-[11px] text-muted-foreground">{isRu ? current.group.labelRu : current.group.labelEn}</p>
          </div>
          <Check className="h-5 w-5 text-primary shrink-0" />
        </div>
      )}

      <AnimatePresence mode="wait">
        {!selectedGroup ? (
          /* Level 1: Groups */
          <motion.div
            key="groups"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-xs text-muted-foreground mb-2 px-1">
              {isRu ? 'Выберите направление' : 'Choose your sector'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {VENDOR_GROUPS.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroup(group)}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl text-left transition-all",
                    "border hover:border-primary/40 hover:bg-primary/5",
                    "active:scale-[0.98]",
                    current?.group.id === group.id
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/60 bg-card"
                  )}
                >
                  <span className="text-2xl">{group.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight">
                      {isRu ? group.labelRu : group.labelEn}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {group.items.length} {isRu ? 'кат.' : 'cat.'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Level 2: Items within group */
          <motion.div
            key={`items-${selectedGroup.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.15 }}
          >
            <button
              type="button"
              onClick={() => setSelectedGroup(null)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 -ml-1 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="text-lg">{selectedGroup.icon}</span>
              <span className="font-medium">{isRu ? selectedGroup.labelRu : selectedGroup.labelEn}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              {selectedGroup.items.map((item, idx) => {
                const resolved = resolveItem(item);
                if (!resolved) return null;
                const isSelected = value === resolved.id;

                return (
                  <button
                    key={resolved.id}
                    type="button"
                    onClick={() => {
                      onChange(resolved.id, isRu ? resolved.labelRu : resolved.labelEn);
                      setSelectedGroup(null);
                    }}
                    className={cn(
                      "relative flex items-center gap-3 p-4 rounded-2xl text-left transition-all",
                      "border active:scale-[0.98]",
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border/60 bg-card hover:border-primary/30 hover:bg-primary/5"
                    )}
                  >
                    <span className="text-xl">{resolved.icon}</span>
                    <span className="text-sm font-medium leading-tight">
                      {isRu ? resolved.labelRu : resolved.labelEn}
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary absolute top-2 right-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
