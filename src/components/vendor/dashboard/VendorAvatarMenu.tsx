/**
 * VendorAvatarMenu - User dropdown menu in header
 * Benchmark: Shopify, Stripe Dashboard
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings, 
  CreditCard, 
  HelpCircle, 
  LogOut, 
  Store,
  Moon,
  Sun,
  ChevronRight
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface VendorAvatarMenuProps {
  className?: string;
}

export function VendorAvatarMenu({ className }: VendorAvatarMenuProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const isRu = language === 'ru';

  const menuItems = [
    {
      id: 'profile',
      labelEn: 'My Profile',
      labelRu: 'Мой профиль',
      icon: User,
      action: () => navigate('/profile'),
    },
    {
      id: 'business',
      labelEn: 'Business Settings',
      labelRu: 'Настройки бизнеса',
      icon: Store,
      action: () => navigate('/vendor/settings'),
    },
    {
      id: 'billing',
      labelEn: 'Billing & Subscription',
      labelRu: 'Оплата и подписка',
      icon: CreditCard,
      action: () => navigate('/vendor/subscription'),
    },
    {
      id: 'help',
      labelEn: 'Help & Support',
      labelRu: 'Помощь и поддержка',
      icon: HelpCircle,
      action: () => navigate('/support'),
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Vendor';
  const userEmail = user?.email || '';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = userName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={cn("relative h-8 w-8 rounded-full", className)}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={userName} />
            <AvatarFallback className="bg-primary/20 text-primary text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {menuItems.map((item) => (
          <DropdownMenuItem
            key={item.id}
            onClick={item.action}
            className="cursor-pointer"
          >
            <item.icon className="mr-2 h-4 w-4" />
            <span>{isRu ? item.labelRu : item.labelEn}</span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Theme Switcher */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {theme === 'dark' ? (
              <Moon className="mr-2 h-4 w-4" />
            ) : (
              <Sun className="mr-2 h-4 w-4" />
            )}
            <span>{isRu ? 'Тема' : 'Theme'}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                <span>{isRu ? 'Светлая' : 'Light'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                <span>{isRu ? 'Тёмная' : 'Dark'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>{isRu ? 'Системная' : 'System'}</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isRu ? 'Выйти' : 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
