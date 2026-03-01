import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings, Calendar, DollarSign, BookOpen, Wrench, ClipboardList, Eye } from 'lucide-react';

interface PropertyQuickActionsProps {
  propertyId: string;
  isRu: boolean;
}

export function PropertyQuickActions({ propertyId, isRu }: PropertyQuickActionsProps) {
  const navigate = useNavigate();

  const actions = [
    { icon: Settings, label: isRu ? 'Редактировать' : 'Manage Listing', path: `/owner/properties/${propertyId}/manage` },
    { icon: Calendar, label: isRu ? 'Календарь' : 'Calendar', path: `/owner/properties/${propertyId}/manage?section=calendar`, variant: 'outline' as const },
    { icon: DollarSign, label: isRu ? 'Цены' : 'Pricing', path: `/owner/properties/${propertyId}/manage?section=pricing`, variant: 'outline' as const },
    { icon: BookOpen, label: isRu ? 'Гайдбук' : 'Guidebook', path: `/owner/properties/${propertyId}/guidebook`, variant: 'outline' as const },
    { icon: Wrench, label: isRu ? 'Услуга' : 'Service', path: `/owner/service-request?property=${propertyId}`, variant: 'outline' as const },
    { icon: ClipboardList, label: isRu ? 'Инспекция' : 'Inspection', path: `/owner/inspection?property=${propertyId}`, variant: 'outline' as const },
    { icon: Eye, label: isRu ? 'Портал' : 'Portal', path: `/owner/properties/${propertyId}/portal-settings`, variant: 'outline' as const },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {actions.map(({ icon: Icon, label, path, variant }) => (
        <Button
          key={path}
          variant={variant || 'default'}
          className="h-auto py-4 flex-col gap-2"
          onClick={() => navigate(path)}
        >
          <Icon className="h-5 w-5" />
          <span className="text-sm">{label}</span>
        </Button>
      ))}
    </div>
  );
}
