import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Home, MapPin, Clock } from 'lucide-react';
import { ClearViewBadge } from '@/components/clearview/ClearViewBadge';

interface PropertyDetailHeaderProps {
  property: {
    id?: string;
    cover_image?: string | null;
    title: string;
    title_ru?: string | null;
    district?: string | null;
    address?: string | null;
    status: string;
    approval_status?: string | null;
    is_active?: boolean;
    clearview_score?: number | null;
    clearview_badge?: string | null;
    project_id?: string | null;
  };
  isRu: boolean;
}

export function PropertyDetailHeader({ property, isRu }: PropertyDetailHeaderProps) {
  const navigate = useNavigate();

  const getStatusBadge = (approvalStatus?: string | null, isActive?: boolean) => {
    // Derive display state from approval_status + is_active (single source of truth)
    if (approvalStatus === 'rejected') {
      return (
        <Badge variant="destructive" className="gap-1">
          {isRu ? 'Требует доработки' : 'Needs Revision'}
        </Badge>
      );
    }
    if (approvalStatus === 'pending') {
      return (
        <Badge variant="secondary" className="bg-warning/10 text-warning gap-1">
          <Clock className="h-3 w-3" />
          {isRu ? 'На рассмотрении' : 'Under Review'}
        </Badge>
      );
    }
    if (approvalStatus === 'approved' && isActive) {
      return <Badge className="bg-success/10 text-success">{isRu ? 'Активен' : 'Active'}</Badge>;
    }
    if (approvalStatus === 'approved' && !isActive) {
      return <Badge variant="outline">{isRu ? 'Скрыт' : 'Hidden'}</Badge>;
    }
    // Draft / no approval status
    return <Badge variant="outline">{isRu ? 'Черновик' : 'Draft'}</Badge>;
  };

  const hasClearView = !!(property.clearview_badge || property.clearview_score);

  return (
    <header className="mb-4 grid overflow-hidden border bg-card sm:grid-cols-3">
      {property.cover_image ? (
        <img src={property.cover_image} alt="" className="aspect-video w-full object-cover sm:aspect-auto sm:h-full" />
      ) : (
        <div className="grid aspect-video place-items-center bg-muted sm:aspect-auto">
          <Home aria-hidden="true" className="h-10 w-10 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 space-y-3 p-4 sm:col-span-2 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {getStatusBadge(property.approval_status, property.is_active)}
          {hasClearView && (
            <ClearViewBadge
              grade={property.clearview_badge}
              score={property.clearview_score}
              isRu={isRu}
              onClick={property.project_id ? () => navigate(`/newbuilds/${property.project_id}#clearview`) : undefined}
            />
          )}
        </div>
        <h1 className="font-display text-2xl font-semibold leading-tight text-foreground [overflow-wrap:anywhere] sm:text-3xl">
          {isRu && property.title_ru ? property.title_ru : property.title}
        </h1>
        {(property.district || property.address) && (
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 [overflow-wrap:anywhere]">{property.district || property.address}</span>
          </p>
        )}
      </div>
    </header>
  );
}
