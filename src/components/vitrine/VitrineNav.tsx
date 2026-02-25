import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Search, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal';
import { cn } from '@/lib/utils';

const LIFE_SITUATIONS = [
  { path: '/life/tourist', labelEn: 'Tourist', labelRu: 'Турист', icon: '🏖' },
  { path: '/life/resident', labelEn: 'Resident', labelRu: 'Резидент', icon: '🏠' },
  { path: '/life/investor', labelEn: 'Investor', labelRu: 'Инвестор', icon: '💼' },
  { path: '/life/owner', labelEn: 'Owner', labelRu: 'Собственник', icon: '🏡' },
];

const SERVICE_GROUPS = [
  {
    titleEn: 'Arrival', titleRu: 'Прибытие',
    items: [
      { path: '/transport/airport-transfer', labelEn: 'Airport Transfers', labelRu: 'Трансферы' },
      { path: '/property', labelEn: 'Villas & Condos', labelRu: 'Виллы и квартиры' },
      { path: '/transport', labelEn: 'Car & Scooter Rental', labelRu: 'Аренда транспорта' },
    ],
  },
  {
    titleEn: 'Experience', titleRu: 'Впечатления',
    items: [
      { path: '/yachts', labelEn: 'Yacht Charters', labelRu: 'Яхты' },
      { path: '/experiences', labelEn: 'Tours & Activities', labelRu: 'Туры и экскурсии' },
      { path: '/restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны' },
      { path: '/events', labelEn: 'Events', labelRu: 'События' },
    ],
  },
  {
    titleEn: 'Lifestyle', titleRu: 'Жизнь',
    items: [
      { path: '/beauty', labelEn: 'Spa & Beauty', labelRu: 'Спа и красота' },
      { path: '/fitness', labelEn: 'Gyms & Fitness', labelRu: 'Фитнес' },
      { path: '/flowers', labelEn: 'Flowers & Gifts', labelRu: 'Цветы' },
      { path: '/cleaning', labelEn: 'Cleaning', labelRu: 'Клининг' },
    ],
  },
  {
    titleEn: 'Professional', titleRu: 'Специалисты',
    items: [
      { path: '/legal', labelEn: 'Legal Services', labelRu: 'Юридические услуги' },
      { path: '/medical', labelEn: 'Clinics & Medical', labelRu: 'Клиники' },
      { path: '/insurance', labelEn: 'Insurance', labelRu: 'Страхование' },
      { path: '/education', labelEn: 'Education', labelRu: 'Образование' },
    ],
  },
];

export function VitrineNav() {
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleDropdownEnter = useCallback((id: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setActiveDropdown(id);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    dropdownTimeout.current = setTimeout(() => setActiveDropdown(null), 150);
  }, []);

  return (
    <>
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/95 backdrop-blur-xl border-b border-border/40 shadow-sm"
          : "bg-transparent"
      )}>
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">
            {/* Logo */}
            <Link to="/" className="flex items-baseline gap-0.5 shrink-0 group">
              <span className={cn(
                "text-base font-light transition-colors",
                scrolled ? "text-muted-foreground" : "text-muted-foreground"
              )}>my</span>
              <span className={cn(
                "text-xl font-bold font-display tracking-tight transition-colors",
                scrolled ? "text-foreground" : "text-foreground"
              )}>UNO</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1 ml-10">
              {/* Life Situations dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleDropdownEnter('life')}
                onMouseLeave={handleDropdownLeave}
              >
                <button className={cn(
                  "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  activeDropdown === 'life' ? "text-foreground bg-muted/50" : "text-muted-foreground hover:text-foreground"
                )}>
                  {isRu ? 'Жизненные ситуации' : 'Life Situations'}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {activeDropdown === 'life' && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-card rounded-xl border border-border/50 shadow-lg p-2 animate-fade-in">
                    {LIFE_SITUATIONS.map(item => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-sm font-medium text-foreground">
                          {isRu ? item.labelRu : item.labelEn}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Services dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleDropdownEnter('services')}
                onMouseLeave={handleDropdownLeave}
              >
                <button className={cn(
                  "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  activeDropdown === 'services' ? "text-foreground bg-muted/50" : "text-muted-foreground hover:text-foreground"
                )}>
                  {isRu ? 'Сервисы' : 'Services'}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {activeDropdown === 'services' && (
                  <div className="absolute top-full left-0 mt-1 w-[560px] bg-card rounded-xl border border-border/50 shadow-lg p-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      {SERVICE_GROUPS.map(group => (
                        <div key={group.titleEn}>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                            {isRu ? group.titleRu : group.titleEn}
                          </p>
                          {group.items.map(item => (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setActiveDropdown(null)}
                              className="block px-2 py-1.5 text-sm text-foreground hover:bg-muted/50 rounded-md transition-colors"
                            >
                              {isRu ? item.labelRu : item.labelEn}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link
                to="/about"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg"
              >
                {isRu ? 'О нас' : 'About'}
              </Link>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted/50 transition-colors"
                aria-label="Search"
              >
                <Search className="w-[18px] h-[18px] text-muted-foreground" />
              </button>

              {/* Language */}
              <button
                onClick={() => setLanguage(isRu ? 'en' : 'ru')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>{isRu ? 'EN' : 'RU'}</span>
              </button>

              {/* Auth */}
              {user ? (
                <Link to="/account">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center hover:ring-2 hover:ring-primary/20 transition-all">
                    <span className="text-xs font-semibold text-primary">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button size="sm" className="h-9 text-sm px-5 rounded-lg font-medium">
                    {isRu ? 'Войти' : 'Sign In'}
                  </Button>
                </Link>
              )}

              {/* Mobile menu */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-background border-t border-border/40 animate-fade-in">
            <div className="max-w-[1280px] mx-auto px-4 py-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {isRu ? 'Жизненные ситуации' : 'Life Situations'}
                </p>
                {LIFE_SITUATIONS.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50"
                  >
                    <span>{item.icon}</span>
                    <span className="text-sm font-medium">{isRu ? item.labelRu : item.labelEn}</span>
                  </Link>
                ))}
              </div>
              {SERVICE_GROUPS.map(group => (
                <div key={group.titleEn}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {isRu ? group.titleRu : group.titleEn}
                  </p>
                  {group.items.map(item => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className="block px-3 py-2 text-sm text-foreground hover:bg-muted/50 rounded-lg"
                    >
                      {isRu ? item.labelRu : item.labelEn}
                    </Link>
                  ))}
                </div>
              ))}
              <div className="pt-2 border-t border-border/40">
                <button
                  onClick={() => { setLanguage(isRu ? 'en' : 'ru'); setMobileOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground"
                >
                  <Globe className="w-4 h-4" />
                  {isRu ? 'Switch to English' : 'Переключить на русский'}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <GlobalSearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
