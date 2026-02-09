import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid3X3, X, Settings, Check, GripVertical,
  Anchor, Plane, Flower2, Home, Utensils, Compass,
  Stethoscope, ShoppingBag, Sparkles, Dumbbell, Car,
  Waves, Package, Ticket, Baby, Wrench, Scale, Shirt
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { triggerHaptic } from '@/hooks/useHapticFeedback';

// All available mini-apps
const ALL_MINI_APPS = [
  { id: 'yachts', icon: Anchor, label: 'Boat Charters', labelRu: 'Чартер', path: '/yachts', color: 'from-cyan-500 to-blue-500' },
  { id: 'transfer', icon: Plane, label: 'Transfer', labelRu: 'Трансфер', path: '/transport/airport-transfer', color: 'from-indigo-500 to-purple-500' },
  { id: 'flowers', icon: Flower2, label: 'Flowers', labelRu: 'Цветы', path: '/flowers', color: 'from-rose-400 to-pink-500' },
  { id: 'property', icon: Home, label: 'Property', labelRu: 'Жильё', path: '/property', color: 'from-teal-500 to-emerald-500' },
  { id: 'restaurants', icon: Utensils, label: 'Food', labelRu: 'Еда', path: '/restaurants', color: 'from-orange-400 to-red-500' },
  { id: 'experiences', icon: Compass, label: 'Experiences', labelRu: 'Впечатления', path: '/experiences', color: 'from-amber-400 to-orange-500' },
  { id: 'medical', icon: Stethoscope, label: 'Medical', labelRu: 'Медицина', path: '/medical', color: 'from-emerald-400 to-teal-500' },
  { id: 'market', icon: ShoppingBag, label: 'Market', labelRu: 'Маркет', path: '/market', color: 'from-violet-500 to-purple-600' },
  { id: 'beauty', icon: Sparkles, label: 'Beauty', labelRu: 'Красота', path: '/beauty', color: 'from-pink-400 to-rose-500' },
  { id: 'fitness', icon: Dumbbell, label: 'Fitness', labelRu: 'Фитнес', path: '/fitness', color: 'from-green-500 to-emerald-600' },
  { id: 'transport', icon: Car, label: 'Transport', labelRu: 'Транспорт', path: '/transport', color: 'from-blue-500 to-indigo-600' },
  { id: 'water', icon: Waves, label: 'Water', labelRu: 'Вода', path: '/water', color: 'from-sky-400 to-blue-500' },
  { id: 'events', icon: Ticket, label: 'Events', labelRu: 'События', path: '/events', color: 'from-fuchsia-500 to-pink-600' },
  { id: 'babysitter', icon: Baby, label: 'Babysitter', labelRu: 'Няня', path: '/babysitter', color: 'from-yellow-400 to-amber-500' },
  { id: 'services', icon: Wrench, label: 'Services', labelRu: 'Услуги', path: '/services', color: 'from-slate-500 to-gray-600' },
  { id: 'legal', icon: Scale, label: 'Legal', labelRu: 'Юрист', path: '/legal', color: 'from-stone-500 to-zinc-600' },
  { id: 'cleaning', icon: Shirt, label: 'Cleaning', labelRu: 'Уборка', path: '/cleaning', color: 'from-sky-500 to-cyan-600' },
];

// Default 9 favorites
const DEFAULT_FAVORITES = ['yachts', 'transfer', 'flowers', 'property', 'restaurants', 'tours', 'medical', 'market', 'beauty'];

const STORAGE_KEY = 'uno-fab-favorites';

export function MiniAppsFAB() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_FAVORITES;
    } catch {
      return DEFAULT_FAVORITES;
    }
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const favoriteApps = useMemo(() => {
    return favorites
      .map(id => ALL_MINI_APPS.find(app => app.id === id))
      .filter(Boolean)
      .slice(0, 9);
  }, [favorites]);

  const handleAppClick = (path: string) => {
    if (isEditing) return;
    triggerHaptic('light');
    setIsOpen(false);
    navigate(path);
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      if (prev.includes(id)) {
        return prev.filter(f => f !== id);
      } else if (prev.length < 9) {
        return [...prev, id];
      }
      return prev;
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsEditing(false);
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Grid Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "fixed bottom-28 left-4 z-[60]",
              "bg-card rounded-2xl shadow-2xl border p-4",
              "w-[calc(100vw-2rem)] max-w-[320px]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">
                {isEditing 
                  ? (isRu ? 'Выберите до 9' : 'Select up to 9') 
                  : (isRu ? 'Быстрый доступ' : 'Quick Access')
                }
              </h3>
              <div className="flex gap-2">
                <Button
                  variant={isEditing ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? <Check className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Apps Grid */}
            {!isEditing ? (
              // Normal 3x3 grid
              <div className="grid grid-cols-3 gap-3">
                {favoriteApps.map((app) => {
                  if (!app) return null;
                  const Icon = app.icon;
                  return (
                    <button
                      key={app.id}
                      onClick={() => handleAppClick(app.path)}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-xl",
                        "hover:bg-muted/50 transition-all active:scale-95"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-2",
                        "bg-gradient-to-br shadow-md",
                        app.color
                      )}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-[11px] font-medium text-center leading-tight">
                        {isRu ? app.labelRu : app.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              // Edit mode - show all apps
              <div className="max-h-[50vh] overflow-y-auto -mx-1 px-1">
                <div className="grid grid-cols-3 gap-2">
                  {ALL_MINI_APPS.map((app) => {
                    const Icon = app.icon;
                    const isSelected = favorites.includes(app.id);
                    const canSelect = favorites.length < 9 || isSelected;
                    
                    return (
                      <button
                        key={app.id}
                        onClick={() => toggleFavorite(app.id)}
                        disabled={!canSelect}
                        className={cn(
                          "relative flex flex-col items-center p-2 rounded-xl transition-all",
                          isSelected ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-muted/50",
                          !canSelect && "opacity-40"
                        )}
                      >
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center mb-1",
                          "bg-gradient-to-br",
                          app.color
                        )}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] font-medium text-center leading-tight">
                          {isRu ? app.labelRu : app.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer hint */}
            <div className="mt-3 pt-3 border-t text-center">
              <button
                onClick={() => { handleClose(); navigate('/discover'); }}
                className="text-xs text-primary hover:underline"
              >
                {isRu ? 'Все сервисы →' : 'All services →'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button - positioned above bottom nav */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "fixed bottom-24 left-4 z-[60]",
          "w-14 h-14 rounded-full",
          "bg-gradient-to-br from-primary to-primary/80",
          "shadow-lg shadow-primary/25",
          "flex items-center justify-center",
          "transition-transform",
          isOpen && "rotate-45"
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-primary-foreground" />
        ) : (
          <Grid3X3 className="w-6 h-6 text-primary-foreground" />
        )}
      </motion.button>
    </>
  );
}
