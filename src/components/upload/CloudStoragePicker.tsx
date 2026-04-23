/**
 * CloudStoragePicker - Google Drive & Dropbox integration
 * Airbnb-style cloud storage import
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Cloud, 
  Check, 
  AlertCircle,
  HardDrive,
  Droplet,
  Link as LinkIcon,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  onSelect: (urls: string[]) => void;
  maxImages?: number;
}

interface CloudFile {
  id: string;
  name: string;
  thumbnailUrl?: string;
  downloadUrl: string;
  mimeType: string;
}

export function CloudStoragePicker({
  open,
  onOpenChange,
  onSelect,
  maxImages = 10
}: CloudStoragePickerProps) {
  const [activeTab, setActiveTab] = useState<'google' | 'dropbox'>('google');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<CloudFile[]>([]);
  const [isConnected, setIsConnected] = useState({
    google: false,
    dropbox: false
  });

  // Note: These integrations require API keys and OAuth setup
  // For now, we show instructions to users
  
  const handleGoogleDriveConnect = useCallback(() => {
    // Google Picker API requires:
    // 1. Google Cloud Console project
    // 2. OAuth 2.0 Client ID
    // 3. API Key with Picker API enabled
    
    toast.info(
      'Google Drive требует настройки. Используйте "С сайта" для импорта по ссылке.',
      { duration: 5000 }
    );
  }, []);

  const handleDropboxConnect = useCallback(() => {
    // Dropbox Chooser requires:
    // 1. Dropbox App registration
    // 2. App Key
    
    toast.info(
      'Dropbox требует настройки. Используйте "С сайта" для импорта по ссылке.',
      { duration: 5000 }
    );
  }, []);

  const handleSelect = () => {
    if (selectedFiles.length === 0) return;
    
    const urls = selectedFiles.map(f => f.downloadUrl);
    onSelect(urls);
    onOpenChange(false);
    setSelectedFiles([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Импорт из облака
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="google" className="gap-2">
              <GoogleDriveIcon />
              Google Drive
            </TabsTrigger>
            <TabsTrigger value="dropbox" className="gap-2">
              <DropboxIcon />
              Dropbox
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="google" className="mt-4">
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <GoogleDriveIcon />
              </div>
              <div>
                <h4 className="font-medium">Google Drive</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Импортируйте фото напрямую из Google Drive
                </p>
              </div>
              
              <div className="bg-muted/50 rounded-none p-4 text-sm text-left space-y-2">
                <p className="font-medium">Как импортировать:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Откройте нужный файл в Google Drive</li>
                  <li>Нажмите «Получить ссылку» → «Все, у кого есть ссылка»</li>
                  <li>Скопируйте ссылку и вставьте через кнопку «С сайта»</li>
                </ol>
              </div>
              
              <Button 
                variant="outline" 
                onClick={handleGoogleDriveConnect}
                className="gap-2"
              >
                <LinkIcon className="h-4 w-4" />
                Использовать ссылку
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="dropbox" className="mt-4">
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <DropboxIcon />
              </div>
              <div>
                <h4 className="font-medium">Dropbox</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Импортируйте фото из Dropbox
                </p>
              </div>
              
              <div className="bg-muted/50 rounded-none p-4 text-sm text-left space-y-2">
                <p className="font-medium">Как импортировать:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Откройте файл в Dropbox</li>
                  <li>Нажмите «Поделиться» → «Создать ссылку»</li>
                  <li>Скопируйте и вставьте через кнопку «С сайта»</li>
                </ol>
              </div>
              
              <Button 
                variant="outline" 
                onClick={handleDropboxConnect}
                className="gap-2"
              >
                <LinkIcon className="h-4 w-4" />
                Использовать ссылку
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Future: Show file grid when connected */}
        {selectedFiles.length > 0 && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="ghost" onClick={() => setSelectedFiles([])}>
              Отмена
            </Button>
            <Button onClick={handleSelect}>
              Импортировать ({selectedFiles.length})
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
