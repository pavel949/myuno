/** Guidance for importing public cloud links through the existing URL importer. */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cloud, Link as LinkIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { mediaModalClasses, type MediaModalLayer } from './shared/mediaModalLayer';

// Google Drive SVG Icon
const GoogleDriveIcon = () => (
  <svg viewBox="0 0 87.3 78" className="h-5 w-5">
    <path d="M6.6 66.85L.2 78h28.8l6.4-11.15z" fill="hsl(var(--brand-google-blue))"/>
    <path d="M58.6 78h28.8l-6.4-11.15H52.2z" fill="hsl(var(--brand-google-green))"/>
    <path d="M28.8 0L0 50.7l6.6 11.15 28.8-50.7z" fill="hsl(var(--brand-google-red))"/>
    <path d="M87.3 50.7L58.5 0H29.7l28.8 50.7z" fill="hsl(var(--brand-google-dark-green))"/>
    <path d="M58.6 50.7l-6.4 11.15 6.4 11.15h28.7L81 61.85z" fill="hsl(var(--brand-google-light-blue))"/>
    <path d="M29.7 0l-6.4 11.15 28.8 50.7 6.4-11.15z" fill="hsl(var(--brand-google-yellow))"/>
  </svg>
);

// Dropbox SVG Icon
const DropboxIcon = () => (
  <svg viewBox="0 0 43 40" className="h-5 w-5">
    <path fill="hsl(var(--brand-dropbox))" d="M12.5 0L0 8.1l8.6 6.9 12.5-7.7zM0 22l12.5 8.1 8.6-6.1-12.5-7.7zm21.1 2l8.6 6.1L42.2 22l-8.6-6.9zM42.2 8.1L29.7 0l-8.6 6.1 12.5 7.7zm-21 8.4l-8.7 6.1L0 15.7l8.6-6.9z"/>
  </svg>
);

interface CloudStoragePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseLink?: () => void;
  modalLayer?: MediaModalLayer;
}

export function CloudStoragePicker({ open, onOpenChange, onUseLink, modalLayer }: CloudStoragePickerProps) {
  const [activeTab, setActiveTab] = useState('google');
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const sources = [
    { id: 'google', name: 'Google Drive', Icon: GoogleDriveIcon },
    { id: 'dropbox', name: 'Dropbox', Icon: DropboxIcon },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName={mediaModalClasses(modalLayer).overlayClassName}
        className={cn('max-w-lg max-h-[90dvh] overflow-y-auto [&>button]:z-20', mediaModalClasses(modalLayer).className)}
      >
        <DialogHeader className="pr-6">
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 shrink-0" />
            {isRu ? 'Фото по облачной ссылке' : 'Photos from a cloud link'}
          </DialogTitle>
          <DialogDescription>
            {isRu
              ? 'Импорт по общедоступной ссылке. Подключать облачный аккаунт не требуется.'
              : 'Import using a public link. No cloud account connection is required.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            {sources.map(({ id, name, Icon }) => (
              <TabsTrigger key={id} value={id} className="gap-2"><Icon />{name}</TabsTrigger>
            ))}
          </TabsList>
          {sources.map(({ id, name }) => (
            <TabsContent key={id} value={id} className="mt-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>{isRu ? `Откройте нужное фото в ${name}.` : `Open the photo in ${name}.`}</li>
                <li>{isRu
                  ? 'Скопируйте общедоступную ссылку. Делитесь только фото, предназначенными для публикации.'
                  : 'Copy its public link. Only share photos intended for publication.'}</li>
                <li>{isRu
                  ? 'Вставьте ссылку в форму импорта. Если фото не найдено, скачайте его и загрузите с устройства.'
                  : 'Paste the link in the importer. If no photo is found, download it and upload it from your device.'}</li>
              </ol>
            </TabsContent>
          ))}
        </Tabs>
        <Button type="button" onClick={() => { onOpenChange(false); onUseLink?.(); }} className="gap-2">
          {onUseLink && <LinkIcon className="h-4 w-4" />}
          {onUseLink ? (isRu ? 'Вставить ссылку' : 'Paste link') : (isRu ? 'Понятно' : 'Got it')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
