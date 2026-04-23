import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOtaConnections, useOtaSync } from '@/hooks/useOtaSync';
import { RefreshCw, Link2, AlertCircle, CheckCircle2, AlertTriangle, ExternalLink, FileDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AirbnbSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (connectionId: string) => void;
}

export function AirbnbSyncDialog({ open, onOpenChange, onSuccess }: AirbnbSyncDialogProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [listingUrl, setListingUrl] = useState('');
  const [step, setStep] = useState<'url' | 'syncing' | 'done' | 'error' | 'blocked'>('url');
  const [error, setError] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  
  const { createConnection } = useOtaConnections();
  const syncMutation = useOtaSync();

  const isValidAirbnbUrl = (url: string) => {
    return url.includes('airbnb.com/rooms/') || url.includes('airbnb.com/h/');
  };

  const handleSync = async () => {
    if (!isValidAirbnbUrl(listingUrl)) {
      setError(isRu ? 'Введите корректную ссылку Airbnb' : 'Enter a valid Airbnb URL');
      return;
    }

    setStep('syncing');
    setError(null);

    try {
      // Create connection
      const connection = await createConnection.mutateAsync({
        platform: 'airbnb',
        listing_url: listingUrl,
      });
      
      setConnectionId(connection.id);

      // Trigger sync
      await syncMutation.mutateAsync({
        connection_id: connection.id,
        sync_type: 'full',
      });

      setStep('done');
      
      if (onSuccess) {
        onSuccess(connection.id);
      }
    } catch (err: unknown) {
      console.error('Sync error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Check if blocked by OTA
      if (errorMessage.includes('OTA_BLOCKED') || errorMessage.includes('blocklisted')) {
        setStep('blocked');
      } else {
        setError(errorMessage);
        setStep('error');
      }
    }
  };

  const handleClose = () => {
    setStep('url');
    setListingUrl('');
    setError(null);
    setConnectionId(null);
    onOpenChange(false);
  };

  const handleOpenICalHelp = () => {
    window.open('https://www.airbnb.com/help/article/99', '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            {isRu ? 'Импорт с Airbnb' : 'Import from Airbnb'}
          </DialogTitle>
          <DialogDescription>
            {isRu 
              ? 'Вставьте ссылку на ваш листинг для импорта данных'
              : 'Paste your listing URL to import data'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === 'url' && (
            <>
              <div className="space-y-2">
                <Label>
                  {isRu ? 'Ссылка на листинг' : 'Listing URL'}
                </Label>
                <Input
                  placeholder="https://www.airbnb.com/rooms/12345678"
                  value={listingUrl}
                  onChange={(e) => {
                    setListingUrl(e.target.value);
                    setError(null);
                  }}
                />
                {error && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                  </p>
                )}
              </div>

              <div className="bg-muted/50 rounded-none p-3 text-sm text-muted-foreground">
                <p className="font-medium mb-1">
                  {isRu ? 'Что будет импортировано:' : 'What will be imported:'}
                </p>
                <ul className="space-y-0.5 text-xs">
                  <li>• {isRu ? 'Название и описание' : 'Title and description'}</li>
                  <li>• {isRu ? 'Фотографии' : 'Photos'}</li>
                  <li>• {isRu ? 'Характеристики (спальни, ванные, гости)' : 'Specs (bedrooms, baths, guests)'}</li>
                  <li>• {isRu ? 'Цена за ночь' : 'Price per night'}</li>
                  <li>• {isRu ? 'Удобства и правила' : 'Amenities and rules'}</li>
                </ul>
              </div>

              <Button 
                onClick={handleSync} 
                className="w-full"
                disabled={!listingUrl.trim()}
              >
                <Link2 className="h-4 w-4 mr-2" />
                {isRu ? 'Импортировать' : 'Import'}
              </Button>
            </>
          )}

          {step === 'syncing' && (
            <div className="py-8 text-center">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
              <p className="text-lg font-medium">
                {isRu ? 'Импортируем данные...' : 'Importing data...'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isRu ? 'Это может занять до 30 секунд' : 'This may take up to 30 seconds'}
              </p>
            </div>
          )}

          {step === 'done' && (
            <div className="py-8 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-success" />
              <p className="text-lg font-medium">
                {isRu ? 'Данные импортированы!' : 'Data imported!'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isRu 
                  ? 'Теперь выберите какие поля применить к объекту'
                  : 'Now choose which fields to apply to property'}
              </p>
              <Button className="mt-4" onClick={handleClose}>
                {isRu ? 'Продолжить' : 'Continue'}
              </Button>
            </div>
          )}

          {step === 'blocked' && (
            <div className="py-4 space-y-4">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-warning" />
                <p className="text-lg font-medium">
                  {isRu ? 'Airbnb заблокировал импорт' : 'Airbnb blocked the import'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRu 
                    ? 'Но вы можете синхронизировать календарь вручную'
                    : 'But you can sync calendar manually'}
                </p>
              </div>

              <Alert>
                <FileDown className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {isRu 
                    ? 'Используйте iCal-ссылку из Airbnb для синхронизации занятости. UNO автоматически будет обновлять ваш календарь.'
                    : 'Use the iCal link from Airbnb to sync availability. UNO will automatically update your calendar.'}
                </AlertDescription>
              </Alert>

              <div className="bg-muted/50 rounded-none p-3 space-y-2">
                <p className="text-sm font-medium">
                  {isRu ? 'Как получить iCal ссылку:' : 'How to get iCal link:'}
                </p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>{isRu ? 'Откройте ваш листинг в Airbnb' : 'Open your listing in Airbnb'}</li>
                  <li>{isRu ? 'Перейдите в Календарь → Настройки' : 'Go to Calendar → Settings'}</li>
                  <li>{isRu ? 'Скопируйте ссылку "Экспорт календаря"' : 'Copy the "Export calendar" link'}</li>
                  <li>{isRu ? 'Вставьте в UNO на странице Каналы' : 'Paste in UNO on the Channels page'}</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleOpenICalHelp}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {isRu ? 'Инструкция Airbnb' : 'Airbnb Guide'}
                </Button>
                <Button className="flex-1" onClick={handleClose}>
                  {isRu ? 'Понятно' : 'Got it'}
                </Button>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="py-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <p className="text-lg font-medium">
                {isRu ? 'Ошибка импорта' : 'Import failed'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {error || (isRu ? 'Попробуйте ещё раз' : 'Please try again')}
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setStep('url')}
              >
                {isRu ? 'Попробовать снова' : 'Try again'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}