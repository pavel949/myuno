import React, { forwardRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Compass, ShoppingBag, Calendar, User, X, Apple, Milk, Cookie, Wine, Sparkles, Baby, Pill, Dog, Flower2, Gift, Shirt, Laptop, Home as HomeIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { triggerRipple } from '@/hooks/useRipple';
import { playSound } from '@/hooks/useSoundEffects';
import { getFeedbackSettings } from '@/hooks/useFeedbackSettings';
import { useMarketplaceCategories } from '@/hooks/useMarketplace';

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

const navItems = [
  { path: '/', icon: Home, labelKey: 'nav.home' },
  { path: '/discover', icon: Compass, labelKey: 'nav.discover' },
  { path: '/market', icon: ShoppingBag, labelKey: 'nav.market', isMarket: true },
  { path: '/bookings', icon: Calendar, labelKey: 'nav.bookings' },
  { path: '/profile', icon: User, labelKey: 'nav.profile' },
];

export const BottomNav = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => {
    const { t, language } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const isRu = language === 'ru';
    const [showMarketPopup, setShowMarketPopup] = useState(false);
    
    const { categories, isLoading } = useMarketplaceCategories();
    
    // Get first 9 active categories
    const displayCategories = categories
      .filter(c => c.is_active)
      .slice(0, 9);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      triggerRipple(e);
      const settings = getFeedbackSettings();
      if (settings.hapticEnabled) {
        triggerHaptic('light');
      }
      if (settings.soundEnabled) {
        playSound('click');
      }
    };

    const handleMarketClick = (e: React.MouseEvent) => {
      e.preventDefault();
      triggerHaptic('light');
      setShowMarketPopup(true);
    };

    const handleCategoryClick = (slug: string) => {
      triggerHaptic('light');
      setShowMarketPopup(false);
      navigate(`/market/category/${slug}`);
    };

    const handleGoToMarket = () => {
      triggerHaptic('medium');
      setShowMarketPopup(false);
      navigate('/market');
    };

    return (
      <>
        {/* Market Categories Popup */}
        <AnimatePresence>
          {showMarketPopup && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMarketPopup(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
              />
              
              {/* Popup */}
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={cn(
                  "fixed bottom-20 left-4 right-4 z-[70]",
                  "bg-card rounded-2xl shadow-2xl border p-4",
                  "max-w-md mx-auto"
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
                    onClick={() => setShowMarketPopup(false)}
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
                            transition: { delay: index * 0.03 }
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
            </>
          )}
        </AnimatePresence>

        <nav ref={ref} className="fixed bottom-0 left-0 right-0 z-50 md:hidden" {...props}>
          {/* Backdrop blur */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border" />
          
          {/* Nav items */}
          <div className="relative flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
            {navItems.map(({ path, icon: Icon, labelKey, isMarket }) => {
              const isActive = location.pathname === path || (isMarket && location.pathname.startsWith('/market'));
              const tourId = path === '/profile' ? 'profile' : path === '/bookings' ? 'cart' : undefined;
              
              if (isMarket) {
                return (
                  <button
                    key={path}
                    onClick={handleMarketClick}
                    data-tour={tourId}
                    className={cn(
                      "relative overflow-hidden flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors active:scale-95",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                      isActive && "bg-primary/10"
                    )}>
                      <Icon className={cn("w-5 h-5", isActive && "scale-110")} />
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium transition-all truncate max-w-[60px]",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}>
                      {t(labelKey)}
                    </span>
                  </button>
                );
              }
              
              return (
                <NavLink
                  key={path}
                  to={path}
                  onClick={handleNavClick}
                  data-tour={tourId}
                  className={cn(
                    "relative overflow-hidden flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors active:scale-95",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                    isActive && "bg-primary/10"
                  )}>
                    <Icon className={cn("w-5 h-5", isActive && "scale-110")} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium transition-all truncate max-w-[60px]",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {t(labelKey)}
                  </span>
                </NavLink>
              );
            })}
          </div>
          
          {/* Safe area padding for iOS */}
          <div className="h-safe-area-inset-bottom bg-background/80" />
        </nav>
      </>
    );
  }
);

BottomNav.displayName = 'BottomNav';
