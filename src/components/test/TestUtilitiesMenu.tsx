/**
 * TestUtilitiesMenu - Test mode utilities for Wave testing
 * 
 * ONLY visible when VITE_TEST_MODE=true
 * Does NOT bypass RBAC - provides UI convenience only
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FlaskConical, 
  LogOut, 
  Trash2, 
  KeyRound,
  RotateCcw,
  Users
} from 'lucide-react';
import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  isTestModeEnabled, 
  cleanLogoutForTesting,
  clearPinStorage,
  clearOnboardingStorage 
} from '@/lib/testMode';
import { toast } from 'sonner';

interface TestUtilitiesMenuProps {
  className?: string;
}

export function TestUtilitiesMenu({ className }: TestUtilitiesMenuProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Only render if test mode is enabled
  if (!isTestModeEnabled()) {
    return null;
  }

  const handleCleanLogout = async () => {
    try {
      await cleanLogoutForTesting(signOut, navigate);
      toast.success(isRu ? 'Выход выполнен (тестовый режим)' : 'Logged out (test mode)');
    } catch (error) {
      console.error('[TestMode] Logout error:', error);
      toast.error(isRu ? 'Ошибка выхода' : 'Logout error');
    }
  };

  const handleClearPin = () => {
    clearPinStorage();
    toast.success(isRu ? 'PIN-данные очищены' : 'PIN data cleared');
  };

  const handleClearOnboarding = () => {
    clearOnboardingStorage();
    toast.success(isRu ? 'Данные онбординга очищены' : 'Onboarding data cleared');
  };

  const handleClearAll = () => {
    clearPinStorage();
    clearOnboardingStorage();
    toast.success(isRu ? 'Все тестовые данные очищены' : 'All test data cleared');
  };

  const handleSwitchAccount = async () => {
    await handleCleanLogout();
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="text-warning">
        <FlaskConical className="mr-2 h-4 w-4" />
        <span>{isRu ? 'Тест-утилиты' : 'Test Utilities'}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="min-w-[200px]">
          {/* Header */}
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b mb-1">
            🧪 {isRu ? 'Режим тестирования' : 'Test Mode Active'}
          </div>
          
          {/* Switch Account */}
          <DropdownMenuItem onClick={handleSwitchAccount}>
            <Users className="mr-2 h-4 w-4" />
            <span>{isRu ? 'Сменить аккаунт' : 'Switch Account'}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Clear PIN */}
          <DropdownMenuItem onClick={handleClearPin}>
            <KeyRound className="mr-2 h-4 w-4" />
            <span>{isRu ? 'Очистить PIN' : 'Clear PIN'}</span>
          </DropdownMenuItem>

          {/* Clear Onboarding */}
          <DropdownMenuItem onClick={handleClearOnboarding}>
            <RotateCcw className="mr-2 h-4 w-4" />
            <span>{isRu ? 'Сбросить онбординг' : 'Reset Onboarding'}</span>
          </DropdownMenuItem>

          {/* Clear All */}
          <DropdownMenuItem onClick={handleClearAll} className="text-warning">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>{isRu ? 'Очистить всё' : 'Clear All'}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Clean Logout */}
          <DropdownMenuItem onClick={handleCleanLogout} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>{isRu ? 'Чистый выход' : 'Clean Logout'}</span>
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
