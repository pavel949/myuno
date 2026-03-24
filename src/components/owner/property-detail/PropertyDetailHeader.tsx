import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Home, MapPin, Clock } from 'lucide-react';

interface PropertyDetailHeaderProps {
  property: {
    cover_image?: string | null;
    title: string;
    title_ru?: string | null;
    district?: string | null;
    address?: string | null;
    status: string;
    approval_status?: string | null;
  };
  isRu: boolean;
}

export function PropertyDetailHeader({ property, isRu }: PropertyDetailHeaderProps) {
  const getStatusBadge = (status: string, approvalStatus?: string | null) => {
    if (approvalStatus === 'pending') {
      return (
        <Badge variant="secondary" className="bg-warning/10 text-warning gap-1">
          <Clock className="h-3 w-3" />
          {isRu ? 'На рассмотрении' : 'Under Review'}
        </Badge>
      );
    }
    if (approvalStatus === 'rejected') {
      return (
        <Badge variant="destructive" className="gap-1">
          {isRu ? 'Требует доработки' : 'Needs Revision'}
        </Badge>
      );
    }
    switch (status) {
      case 'active':
        return <Badge className="bg-success">{isRu ? 'Активен' : 'Active'}</Badge>;
      case 'pending':
        return <Badge variant="secondary">{isRu ? 'На проверке' : 'Pending'}</Badge>;
      default:
        return <Badge variant="outline">{isRu ? 'Неактивен' : 'Inactive'}</Badge>;
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden mb-6">
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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {isRu && property.title_ru ? property.title_ru : property.title}
            </h1>
            <p className="text-white/80 text-sm flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {property.district || property.address}
            </p>
          </div>
          {getStatusBadge(property.status, property.approval_status)}
        </div>
      </div>
    </div>
  );
}
