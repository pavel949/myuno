import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Copy } from 'lucide-react';
import { useICalExportUrl } from '@/hooks/useExternalCalendars';
import { toast } from 'sonner';

interface ExportLinkCardProps {
  propertyId: string;
  propertyName?: string;
  isRu: boolean;
}

export function ExportLinkCard({ propertyId, propertyName, isRu }: ExportLinkCardProps) {
  const { exportUrl, isLoading } = useICalExportUrl(propertyId);

  const handleCopy = () => {
    if (exportUrl) {
      navigator.clipboard.writeText(exportUrl);
      toast.success(isRu ? 'Ссылка скопирована!' : 'Link copied!');
    }
  };

  if (isLoading) {
    return <div className="h-16 bg-muted animate-pulse rounded-lg" />;
  }

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{propertyName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {exportUrl ? exportUrl.slice(0, 50) + '...' : 'Loading...'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!exportUrl}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
