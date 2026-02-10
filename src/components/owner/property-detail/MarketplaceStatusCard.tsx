import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Clock, AlertTriangle, ExternalLink, Settings } from 'lucide-react';

interface MarketplaceStatusCardProps {
  propertyId: string;
  approvalStatus?: string | null;
  rejectionReason?: string | null;
  isRu: boolean;
}

export function MarketplaceStatusCard({ propertyId, approvalStatus, rejectionReason, isRu }: MarketplaceStatusCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        {approvalStatus === 'approved' ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{isRu ? 'Опубликовано на маркетплейсе' : 'Published on Marketplace'}</p>
                <p className="text-sm text-muted-foreground">
                  {isRu ? 'Доступно для бронирования' : 'Available for booking'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate(`/property/${propertyId}`)}>
              <ExternalLink className="h-4 w-4 mr-1" />
              {isRu ? 'Открыть' : 'View'}
            </Button>
          </div>
        ) : approvalStatus === 'pending' ? (
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-500" />
            <div>
              <p className="font-medium">{isRu ? 'На модерации' : 'Under Review'}</p>
              <p className="text-sm text-muted-foreground">
                {isRu ? 'После одобрения объект автоматически появится на маркетплейсе' : 'Property will be published automatically after approval'}
              </p>
            </div>
          </div>
        ) : approvalStatus === 'rejected' ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium">{isRu ? 'Требуется доработка' : 'Revision Required'}</p>
                <p className="text-sm text-muted-foreground">
                  {rejectionReason || (isRu ? 'Внесите изменения и отправьте на повторную проверку' : 'Make changes and resubmit for review')}
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate(`/owner/properties/${propertyId}/edit`)}>
              <Settings className="h-4 w-4 mr-1" />
              {isRu ? 'Редактировать' : 'Edit'}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{isRu ? 'Ожидает отправки на модерацию' : 'Awaiting Submission'}</p>
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Заполните все обязательные поля и отправьте на проверку' : 'Complete all required fields and submit for review'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
