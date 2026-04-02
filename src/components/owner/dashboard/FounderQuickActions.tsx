import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Handshake, Building2, Target, Zap } from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';

export function FounderQuickActions() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();

  const actions = [
    {
      icon: UserPlus,
      label: isRu ? 'Контакт' : 'Contact',
      path: APP_ROUTES.MC_CONTACTS,
      color: 'text-blue-500',
    },
    {
      icon: Handshake,
      label: isRu ? 'Сделка' : 'Deal',
      path: APP_ROUTES.MC_SALES_NEW,
      color: 'text-emerald-500',
    },
    {
      icon: Building2,
      label: isRu ? 'Объект' : 'Property',
      path: APP_ROUTES.MC_PROPERTY_NEW,
      color: 'text-amber-500',
    },
    {
      icon: Target,
      label: isRu ? 'Вендор' : 'Vendor',
      path: '/mc/vendor-acquisition',
      color: 'text-purple-500',
    },
  ];

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          {isRu ? 'Быстрые действия' : 'Quick Actions'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2 flex-wrap">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              className="gap-1.5 h-8"
              onClick={() => navigate(action.path)}
            >
              <action.icon className={`h-3.5 w-3.5 ${action.color}`} />
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
