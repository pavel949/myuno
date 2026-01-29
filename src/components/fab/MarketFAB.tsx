import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, X, Apple, Milk, Cookie, Wine, Sparkles, Baby, 
  Pill, Dog, Flower2, Gift, Shirt, Laptop, Home as HomeIcon
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMarketplaceCategories } from '@/hooks/useMarketplace';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/hooks/useHapticFeedback';

// Icon mapping for categories
const categoryIcons: Record<string, React.ComponentType<any>> = {
  'fruits-vegetables': Apple,
  'dairy': Milk,
  'bakery': Cookie,
  'beverages': Wine,
  'beauty': Sparkles,
  'baby': Baby,
  'pharmacy': Pill,
  'pets': Dog,
  'flowers': Flower2,
  'gifts': Gift,
  'clothing': Shirt,
  'electronics': Laptop,
  'home': HomeIcon,
};

const categoryColors: Record<string, string> = {
  'fruits-vegetables': 'from-green-500 to-emerald-500',
  'dairy': 'from-blue-400 to-cyan-500',
  'bakery': 'from-amber-400 to-orange-500',
  'beverages': 'from-purple-500 to-violet-600',
  'beauty': 'from-pink-500 to-rose-500',
  'baby': 'from-yellow-400 to-amber-500',
  'pharmacy': 'from-emerald-500 to-teal-500',
  'pets': 'from-orange-500 to-red-500',
  'flowers': 'from-rose-400 to-pink-500',
  'gifts': 'from-red-500 to-rose-600',
  'clothing': 'from-indigo-500 to-blue-600',
  'electronics': 'from-slate-500 to-zinc-600',
  'home': 'from-teal-500 to-cyan-600',
};

export function MarketFAB() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [isOpen, setIsOpen] = useState(false);
  
  const { categories, isLoading } = useMarketplaceCategories();
  
  // Get first 9 active categories
  const displayCategories = categories
    .filter(c => c.is_active)
    .slice(0, 9);

  const handleCategoryClick = (slug: string) => {
    triggerHaptic('light');
    setIsOpen(false);
    navigate(`/market/category/${slug}`);
  };

  const handleMainClick = () => {
    triggerHaptic('light');
    if (isOpen) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  };

  const handleGoToMarket = () => {
    triggerHaptic('medium');
    setIsOpen(false);
    navigate('/market');
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
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Category Icons Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "fixed bottom-28 right-4 z-[60]",
              "bg-card rounded-2xl shadow-2xl border p-4",
              "w-[calc(100vw-2rem)] max-w-[320px]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-sm">
                  {isRu ? 'Маркетплейс' : 'Marketplace'}
                </h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Categories Grid */}
            {isLoading ? (
              <div className="grid grid-cols-3 gap-3">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-muted animate-pulse" />
                    <div className="w-10 h-2 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {displayCategories.map((category, index) => {
                  const Icon = categoryIcons[category.slug] || ShoppingBag;
                  const color = categoryColors[category.slug] || 'from-violet-500 to-purple-600';
                  
                  return (
                    <motion.button
                      key={category.id}
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0, 
                        scale: 1,
                        transition: { delay: index * 0.05 }
                      }}
                      onClick={() => handleCategoryClick(category.slug)}
                      className="flex flex-col items-center p-2 rounded-xl hover:bg-muted/50 transition-all active:scale-95"
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-2",
                        "bg-gradient-to-br shadow-md",
                        color
                      )}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-[10px] font-medium text-center leading-tight line-clamp-2">
                        {isRu ? category.name_ru : category.name_en}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Footer - Go to full marketplace */}
            <div className="mt-4 pt-3 border-t">
              <button
                onClick={handleGoToMarket}
                className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                {isRu ? 'Открыть маркетплейс' : 'Open Marketplace'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        onClick={handleMainClick}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "fixed bottom-24 right-4 z-[60] md:bottom-20",
          "w-14 h-14 rounded-full",
          "bg-gradient-to-br from-violet-500 to-purple-600",
          "shadow-lg shadow-violet-500/25",
          "flex items-center justify-center",
          "transition-transform",
          isOpen && "rotate-90"
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <ShoppingBag className="w-6 h-6 text-white" />
        )}
      </motion.button>
    </>
  );
}
