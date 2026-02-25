import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronRight, Store, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VendorLinkProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  description: string;
  onClick: () => void;
}

function VendorLink({ icon, iconBg, label, description, onClick }: VendorLinkProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3",
        "hover:bg-muted/50 active:bg-muted transition-colors"
      )}
    >
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <span className="text-sm font-medium block">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}

interface VendorSectionProps {
  onNavigate: () => void;
}

export function VendorSection({ onNavigate }: VendorSectionProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const handleNav = (path: string) => {
    onNavigate();
    navigate(path);
  };

  return (
    <div className="py-1">
      <div className="px-4 py-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {language === 'ru' ? 'Для продавцов' : 'For Vendors'}
        </span>
      </div>
      <VendorLink
        icon={<Store className="w-5 h-5 text-emerald-600" />}
        iconBg="bg-emerald-100 dark:bg-emerald-900/30"
        label={language === 'ru' ? 'Стать продавцом' : 'Become a Seller'}
        description={language === 'ru' ? 'Продавайте на myUNO' : 'Sell on myUNO'}
        onClick={() => handleNav('/vendor/onboarding')}
      />
      <VendorLink
        icon={<LayoutDashboard className="w-5 h-5 text-blue-600" />}
        iconBg="bg-blue-100 dark:bg-blue-900/30"
        label={language === 'ru' ? 'Панель продавца' : 'Vendor Dashboard'}
        description={language === 'ru' ? 'Управление товарами' : 'Manage your products'}
        onClick={() => handleNav('/vendor')}
      />
    </div>
  );
}
