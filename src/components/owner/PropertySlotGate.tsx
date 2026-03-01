import React from 'react';
import { Lock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMCSubscription } from '@/hooks/useMCSubscription';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface PropertySlotGateProps {
  propertyId: string;
  children: React.ReactNode;
}

export function PropertySlotGate({ propertyId, children }: PropertySlotGateProps) {
  const { isPropertyActive, canActivateMore, activateProperty, paidSlots } = useMCSubscription();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();

  if (isPropertyActive(propertyId)) {
    return <>{children}</>;
  }

  return (
    <Card className="border-dashed border-2 border-muted-foreground/30 bg-muted/30">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-4">
        <div className="rounded-full bg-muted p-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">
            {isRu ? 'Объект не активирован' : 'Property Not Activated'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            {isRu
              ? 'Активируйте этот объект, чтобы получить доступ к календарю, бронированиям, финансам и задачам. $25/мес за объект.'
              : 'Activate this property to access Calendar, Bookings, Financials and Tasks. $25/mo per property.'}
          </p>
        </div>
        {canActivateMore ? (
          <Button onClick={() => activateProperty(propertyId)} className="gap-2">
            <Zap className="h-4 w-4" />
            {isRu ? 'Активировать объект' : 'Activate Property'}
          </Button>
        ) : (
          <Button onClick={() => navigate('/mc/subscription')} variant="outline" className="gap-2">
            {paidSlots === 0
              ? (isRu ? 'Купить подписку' : 'Buy Subscription')
              : (isRu ? 'Докупить слоты' : 'Buy More Slots')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
