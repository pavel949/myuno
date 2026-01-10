import React, { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  badge?: string | number;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  showBack = false, 
  badge, 
  actions,
  className 
}: PageHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // Check if we came from within the app (referrer exists and is same origin)
    const referrer = document.referrer;
    const isSameOrigin = referrer && referrer.includes(window.location.origin);
    
    if (isSameOrigin && window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-3">
        {showBack && (
          <button 
            onClick={handleBack} 
            className="p-2 -ml-2 hover:bg-secondary rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {badge !== undefined && badge !== 0 && (
          <Badge variant="secondary">{badge}</Badge>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
