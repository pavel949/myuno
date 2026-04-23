import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, FileText } from 'lucide-react';

interface ReceiptViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptUrl: string;
  title?: string;
}

export function ReceiptViewer({
  open,
  onOpenChange,
  receiptUrl,
  title
}: ReceiptViewerProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const isPdf = receiptUrl?.toLowerCase().endsWith('.pdf');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = receiptUrl;
    link.download = title || 'receipt';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenExternal = () => {
    window.open(receiptUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {title || (isRu ? 'Просмотр чека' : 'View Receipt')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isPdf ? (
            <div className="w-full h-64 rounded-none border border-border bg-muted/50 flex flex-col items-center justify-center gap-3">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {isRu ? 'PDF документ' : 'PDF Document'}
              </span>
            </div>
          ) : (
            <div className="relative rounded-none overflow-hidden border border-border">
              <img 
                src={receiptUrl} 
                alt="Receipt" 
                className="w-full max-h-[60vh] object-contain bg-muted/30"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleOpenExternal}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {isRu ? 'Открыть' : 'Open'}
            </Button>
            <Button 
              variant="default" 
              className="flex-1"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              {isRu ? 'Скачать' : 'Download'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
