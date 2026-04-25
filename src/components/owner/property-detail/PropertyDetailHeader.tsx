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
      return <Badge className="bg-success">{isRu ? 'Активен' : 'Active'}</Badge>;
    }
    if (approvalStatus === 'approved' && !isActive) {
      return <Badge variant="outline">{isRu ? 'Скрыт' : 'Hidden'}</Badge>;
    }
    // Draft / no approval status
    return <Badge variant="outline">{isRu ? 'Черновик' : 'Draft'}</Badge>;
  };

  const hasClearView = !!(property.clearview_badge || property.clearview_score);

  return (
    <div className="relative rounded-none overflow-hidden mb-6">
      {property.cover_image ? (
        <img
          src={property.cover_image}
          alt={property.title}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-muted flex items-center justify-center">
          <Home className="h-16 w-16 text-muted-foreground" />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white truncate">
              {isRu && property.title_ru ? property.title_ru : property.title}
            </h1>
            <p className="text-white/80 text-sm flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {property.district || property.address}
            </p>
            {hasClearView && (
              <div className="mt-2">
                <ClearViewBadge
                  grade={property.clearview_badge}
                  score={property.clearview_score}
                  isRu={isRu}
                  onClick={
                    property.project_id
                      ? () => navigate(`/newbuilds/${property.project_id}#clearview`)
                      : undefined
                  }
                />
              </div>
            )}
          </div>
          {getStatusBadge(property.approval_status, property.is_active)}
        </div>
      </div>
    </div>
  );
}
