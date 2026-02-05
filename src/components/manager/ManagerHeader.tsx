/**
 * @module ManagerHeader
 * @description Header for Property Manager dashboard
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Bell, 
  Search,
  Building2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export function ManagerHeader() {
  const { language } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || 'PM';

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger className="-ml-1" />
      
      {/* Role Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1 bg-accent text-accent-foreground">
          <Building2 className="h-3 w-3" />
          {isRu ? 'Управляющий' : 'Property Manager'}
        </Badge>
      </div>

      <div className="flex-1" />

      {/* Search */}
      <Button variant="ghost" size="icon" className="hidden sm:flex">
        <Search className="h-4 w-4" />
      </Button>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-4 w-4" />
        <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
      </Button>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xs bg-primary/10">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-medium">{user?.email}</span>
              <span className="text-xs text-muted-foreground">
                {isRu ? 'Управляющий объектами' : 'Property Manager'}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            {isRu ? 'Профиль' : 'Profile'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/manager/settings')}>
            {isRu ? 'Настройки' : 'Settings'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/')}>
            {isRu ? 'На главную' : 'Go to Homepage'}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => signOut()}
            className="text-destructive focus:text-destructive"
          >
            {isRu ? 'Выйти' : 'Sign Out'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
