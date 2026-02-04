import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Phone, FileText, Briefcase } from 'lucide-react';

export function InvestorQuickActions() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const actions = [
    {
      icon: Search,
      label: isRu ? 'Найти проект' : 'Find Project',
      onClick: () => navigate('/invest'),
      variant: 'default' as const,
    },
    {
      icon: Phone,
      label: isRu ? 'Связаться' : 'Contact Us',
      onClick: () => navigate('/support'),
      variant: 'outline' as const,
    },
    {
      icon: FileText,
      label: isRu ? 'Привлечь' : 'Raise',
      onClick: () => navigate('/invest/raise'),
      variant: 'outline' as const,
    },
    {
      icon: Briefcase,
      label: isRu ? 'Каталог' : 'Catalog',
      onClick: () => navigate('/invest'),
      variant: 'outline' as const,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          {isRu ? 'Быстрые действия' : 'Quick Actions'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-4 gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              size="sm"
              onClick={action.onClick}
              className="flex flex-col items-center gap-1.5 h-auto py-3 px-2"
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs font-medium text-center leading-tight">
                {action.label}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
