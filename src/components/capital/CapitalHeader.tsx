import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function CapitalHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/50 bg-background/95 supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex-1" />
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {user?.email}
      </span>
      <Button variant="ghost" size="icon" onClick={() => signOut()} title="Выйти">
        <LogOut className="w-4 h-4" />
      </Button>
    </header>
  );
}
