import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Globe, Clock, AlertTriangle, ExternalLink, Settings, Eye, EyeOff, Loader2, Rocket } from 'lucide-react';
import { useUpdateOwnerProperty } from '@/hooks/usePropertyCare';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';

interface MarketplaceStatusCardProps {
  propertyId: string;
  approvalStatus?: string | null;
  rejectionReason?: string | null;
  isActive?: boolean;
  isRu: boolean;
}

export function MarketplaceStatusCard({ propertyId, approvalStatus, rejectionReason, isActive, isRu }: MarketplaceStatusCardProps) {
  const navigate = useNavigate();
  const updateProperty = useUpdateOwnerProperty();
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);

  const handlePublish = () => {
    updateProperty.mutate({ id: propertyId, is_active: true } as any, {
      onSuccess: () => setShowPublishConfirm(false),
    });
  };

  const handleUnpublish = () => {
    updateProperty.mutate({ id: propertyId, is_active: false } as any, {
      onSuccess: () => setShowUnpublishConfirm(false),
    });
  };

  // Published and active
  if (approvalStatus === 'approved' && isActive) {
    return (
      <>
        <Card className="mb-6 border-success/30 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="h-5 w-5 text-success" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-success">{isRu ? 'Опубликовано для гостей' : 'Published for Guests'}</p>
                    <Badge className="bg-success/20 text-success text-[10px]">LIVE</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isRu ? 'Гости видят объект в поиске и могут бронировать' : 'Guests can find and book this property'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => navigate(APP_ROUTES.PROPERTY_DETAIL(propertyId))}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  {isRu ? 'Открыть' : 'View'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowUnpublishConfirm(true)}>
                  <EyeOff className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={showUnpublishConfirm} onOpenChange={setShowUnpublishConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{isRu ? 'Снять с публикации?' : 'Unpublish property?'}</AlertDialogTitle>
              <AlertDialogDescription>
                {isRu
                  ? 'Объект будет скрыт из поиска гостей. Существующие бронирования не пострадают. Вы сможете опубликовать его снова в любой момент.'
                  : 'The property will be hidden from guest search. Existing bookings won\'t be affected. You can republish anytime.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
              <AlertDialogAction onClick={handleUnpublish} disabled={updateProperty.isPending}>
                {updateProperty.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <EyeOff className="h-4 w-4 mr-2" />}
                {isRu ? 'Снять с публикации' : 'Unpublish'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Approved but not published (draft)
  if (approvalStatus === 'approved' && !isActive) {
    return (
      <>
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{isRu ? 'Черновик — не опубликован' : 'Draft — Not Published'}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {isRu ? 'Скрыт' : 'Hidden'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isRu
                      ? 'Объект одобрен, но невидим для гостей. Нажмите «Опубликовать», когда будете готовы.'
                      : 'Approved but hidden from guests. Click "Publish" when ready.'}
                  </p>
                </div>
              </div>
              <Button onClick={() => setShowPublishConfirm(true)} className="flex-shrink-0 gap-2">
                <Rocket className="h-4 w-4" />
                {isRu ? 'Опубликовать' : 'Publish'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={showPublishConfirm} onOpenChange={setShowPublishConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                {isRu ? 'Опубликовать для гостей?' : 'Publish for guests?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {isRu
                  ? 'Объект станет видимым в поиске и каталоге. Гости смогут просматривать и бронировать его. Убедитесь, что фотографии, цены и описание заполнены корректно.'
                  : 'The property will become visible in search and catalog. Guests will be able to view and book it. Make sure photos, pricing, and description are complete.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{isRu ? 'Ещё не готов' : 'Not yet'}</AlertDialogCancel>
              <AlertDialogAction onClick={handlePublish} disabled={updateProperty.isPending}>
                {updateProperty.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}
                {isRu ? 'Да, опубликовать!' : 'Yes, publish!'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Pending review
  if (approvalStatus === 'pending') {
    return (
      <Card className="mb-6 border-warning/30 bg-warning/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="font-semibold">{isRu ? 'На модерации' : 'Under Review'}</p>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? 'После одобрения вы сможете опубликовать объект для гостей'
                  : 'After approval you can publish the property for guests'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Rejected
  if (approvalStatus === 'rejected') {
    return (
      <Card className="mb-6 border-destructive/30 bg-destructive/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold">{isRu ? 'Требуется доработка' : 'Revision Required'}</p>
                <p className="text-sm text-muted-foreground">
                  {rejectionReason || (isRu ? 'Внесите изменения и отправьте на повторную проверку' : 'Make changes and resubmit for review')}
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate(`/mc/properties/${propertyId}/editor`)}>
              <Settings className="h-4 w-4 mr-1" />
              {isRu ? 'Редактировать' : 'Edit'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default: no status (new draft)
  return (
    <Card className="mb-6 border-muted bg-muted/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Globe className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">{isRu ? 'Черновик' : 'Draft'}</p>
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Заполните все поля и отправьте на модерацию' : 'Complete all fields and submit for review'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
