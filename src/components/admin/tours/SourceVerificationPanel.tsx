import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Image, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useExperienceMedia, useImportExperienceMedia } from '@/hooks/useExperienceMedia';
import { toast } from 'sonner';

interface Props {
  experienceId: string;
  sourcePageUrl: string | null;
  bookingUrl: string | null;
  notes: Record<string, unknown> | null;
}

export function SourceVerificationPanel({ experienceId, sourcePageUrl, bookingUrl, notes }: Props) {
  const { data: media = [], isLoading: mediaLoading } = useExperienceMedia(experienceId);
  const importMutation = useImportExperienceMedia();

  const mediaStatus = notes?.media_import as string | undefined;
  const importedAt = notes?.media_imported_at as string | undefined;
  const mediaCount = notes?.media_count as number | undefined;

  const handleImport = async () => {
    try {
      const result = await importMutation.mutateAsync(experienceId);
      toast.success(`Imported ${result.imported} images`);
    } catch (err) {
      toast.error(`Import failed: ${err}`);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Image className="w-4 h-4" />
          Source & Media
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {/* Source URL */}
        {sourcePageUrl && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Source:</span>
            <a
              href={sourcePageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline truncate max-w-[200px] inline-flex items-center gap-1"
            >
              {new URL(sourcePageUrl).hostname}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Booking URL */}
        {bookingUrl && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Booking:</span>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline truncate max-w-[200px] inline-flex items-center gap-1"
            >
              {new URL(bookingUrl).hostname}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Media status */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Media:</span>
          {mediaStatus === 'success' ? (
            <Badge variant="outline" className="text-green-600 border-green-200">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {mediaCount} images
            </Badge>
          ) : mediaStatus === 'failed' ? (
            <Badge variant="outline" className="text-destructive border-destructive/20">
              <AlertCircle className="w-3 h-3 mr-1" />
              Failed
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Not imported
            </Badge>
          )}
        </div>

        {importedAt && (
          <p className="text-xs text-muted-foreground">
            Last import: {new Date(importedAt).toLocaleDateString()}
          </p>
        )}

        {/* Import button */}
        {sourcePageUrl && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleImport}
            disabled={importMutation.isPending}
            className="w-full"
          >
            {importMutation.isPending ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Image className="w-3 h-3 mr-1" />
            )}
            {media.length > 0 ? 'Re-import Media' : 'Import Media from Source'}
          </Button>
        )}

        {/* Media thumbnails */}
        {media.length > 0 && (
          <div className="grid grid-cols-4 gap-1 mt-2">
            {media.slice(0, 8).map(m => (
              <div key={m.id} className="aspect-square rounded overflow-hidden bg-muted">
                {m.stored_path ? (
                  <img
                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/tour-media/${m.stored_path}`}
                    alt={m.alt_text || ''}
                    className="w-full h-full object-cover"
                  />
                ) : m.source_image_url ? (
                  <img src={m.source_image_url} alt={m.alt_text || ''} className="w-full h-full object-cover" />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
