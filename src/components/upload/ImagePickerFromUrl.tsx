import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, Check, ExternalLink, Globe, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ImageItem {
  url: string;
  preview?: string;
  name?: string;
}

interface ImagePickerFromUrlProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (urls: string[]) => void;
  maxImages?: number;
  currentCount?: number;
}

// Generate proxy URL for Yandex Disk previews
function getProxiedUrl(url: string, isYandexSource: boolean): string {
  if (!isYandexSource) return url;
  // Use edge function to proxy the image
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/proxy-image?url=${encodeURIComponent(url)}`;
}

export function ImagePickerFromUrl({
  open,
  onOpenChange,
  onSelect,
  maxImages = 20,
  currentCount = 0
}: ImagePickerFromUrlProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [pageTitle, setPageTitle] = useState('');
  const [source, setSource] = useState<string>('');
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const isMobile = useIsMobile();

  const remainingSlots = maxImages - currentCount;
  const isYandexSource = source === 'yandex_disk';

  const handleExtract = async () => {
    if (!url.trim()) {
      toast.error('Введите URL сайта');
      return;
    }

    setIsLoading(true);
    setImages([]);
    setSelectedImages(new Set());
    setPageTitle('');
    setSource('');
    setLoadedImages(new Set());
    setFailedImages(new Set());

    try {
      const { data, error } = await supabase.functions.invoke('extract-images-from-url', {
        body: { url: url.trim() }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Не удалось загрузить страницу');
      }

      const imageItems: ImageItem[] = (data.images || []).map((img: string | ImageItem) => {
        if (typeof img === 'string') {
          return { url: img };
        }
        return img;
      });

      setImages(imageItems);
      setPageTitle(data.pageTitle || '');
      setSource(data.source || '');

      if (imageItems.length === 0) {
        toast.info('На странице не найдено изображений');
      } else {
        const sourceLabel = data.source === 'yandex_disk' ? 'Yandex Disk' : 'сайте';
        toast.success(`Найдено ${imageItems.length} изображений на ${sourceLabel}`);
      }
    } catch (error) {
      console.error('Error extracting images:', error);
      toast.error(error instanceof Error ? error.message : 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleImage = (imageUrl: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageUrl)) {
      newSelected.delete(imageUrl);
    } else {
      if (newSelected.size >= remainingSlots) {
        toast.warning(`Можно выбрать максимум ${remainingSlots} фото`);
        return;
      }
      newSelected.add(imageUrl);
    }
    setSelectedImages(newSelected);
  };

  const handleConfirm = () => {
    if (selectedImages.size === 0) {
      toast.error('Выберите хотя бы одно изображение');
      return;
    }
    onSelect(Array.from(selectedImages));
    onOpenChange(false);
    resetState();
  };

  const resetState = () => {
    setImages([]);
    setSelectedImages(new Set());
    setUrl('');
    setPageTitle('');
    setSource('');
    setLoadedImages(new Set());
    setFailedImages(new Set());
  };

  const selectAll = () => {
    const validIndices = images
      .map((_, idx) => idx)
      .filter(idx => loadedImages.has(idx) && !failedImages.has(idx));
    const toSelect = validIndices.slice(0, remainingSlots).map(idx => images[idx].url);
    setSelectedImages(new Set(toSelect));
  };

  const clearSelection = () => {
    setSelectedImages(new Set());
  };

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set([...prev, index]));
  };

  const handleImageError = (index: number) => {
    setFailedImages(prev => new Set([...prev, index]));
  };

  const isYandexDiskUrl = url.includes('disk.yandex.ru') || url.includes('yadi.sk');
  const loadedCount = images.filter((_, idx) => loadedImages.has(idx) && !failedImages.has(idx)).length;

  const content = (
    <div className="flex flex-col h-full gap-4">
      {/* URL Input */}
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://disk.yandex.ru/d/... или любой сайт"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
          className="flex-1"
        />
        <Button onClick={handleExtract} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          <span className="ml-2 hidden sm:inline">Найти</span>
        </Button>
      </div>

      {/* Yandex Disk hint */}
      {isYandexDiskUrl && !isLoading && images.length === 0 && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          🔗 Обнаружена ссылка на Yandex Disk. Нажмите "Найти" для загрузки изображений.
        </div>
      )}

      {/* Page title / source */}
      {pageTitle && (
        <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
          <ExternalLink className="h-4 w-4 shrink-0" />
          <span className="truncate">{pageTitle}</span>
          {isYandexSource && (
            <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded shrink-0">Yandex Disk</span>
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">
              {isYandexDiskUrl ? 'Загрузка файлов с Yandex Disk...' : 'Поиск изображений...'}
            </p>
          </div>
        </div>
      )}

      {/* Images grid */}
      {!isLoading && images.length > 0 && (
        <>
          {/* Selection controls */}
          <div className="flex items-center justify-between gap-2 flex-wrap bg-muted/30 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Выбрано: <span className="text-primary">{selectedImages.size}</span> / {remainingSlots}
              </span>
              {loadedCount < images.length && (
                <span className="text-xs text-muted-foreground">
                  (загружено {loadedCount}/{images.length})
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Выбрать все
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Сбросить
              </Button>
            </div>
          </div>

          {/* Image grid */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-1">
              {images.map((image, index) => {
                const isSelected = selectedImages.has(image.url);
                const rawPreviewUrl = image.preview || image.url;
                const displayUrl = isYandexSource ? getProxiedUrl(rawPreviewUrl, true) : rawPreviewUrl;
                const isImageLoaded = loadedImages.has(index);
                const isImageFailed = failedImages.has(index);
                
                if (isImageFailed) return null;
                
                return (
                  <div
                    key={index}
                    className={cn(
                      "relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all group",
                      "border-2 bg-muted",
                      isSelected 
                        ? "border-primary ring-2 ring-primary/30 scale-[0.98]" 
                        : "border-transparent hover:border-primary/50"
                    )}
                    onClick={() => isImageLoaded && toggleImage(image.url)}
                  >
                    {/* Loading placeholder */}
                    {!isImageLoaded && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    
                    <img
                      src={displayUrl}
                      alt={image.name || `Фото ${index + 1}`}
                      className={cn(
                        "w-full h-full object-cover transition-all",
                        isImageLoaded ? "opacity-100" : "opacity-0",
                        isSelected && "brightness-90"
                      )}
                      loading="lazy"
                      onLoad={() => handleImageLoad(index)}
                      onError={() => handleImageError(index)}
                    />
                    
                    {/* Selection indicator */}
                    <div className={cn(
                      "absolute top-2 right-2 transition-all",
                      isImageLoaded ? "opacity-100" : "opacity-0"
                    )}>
                      {isSelected ? (
                        <CheckCircle2 className="h-6 w-6 text-primary drop-shadow-lg" fill="white" />
                      ) : (
                        <Circle className="h-6 w-6 text-white/80 drop-shadow-lg group-hover:text-white" />
                      )}
                    </div>
                    
                    {/* File name on hover */}
                    {image.name && isImageLoaded && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-2 pt-4 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                        {image.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Confirm buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button onClick={handleConfirm} disabled={selectedImages.size === 0} size="lg">
              <Check className="h-4 w-4 mr-2" />
              Добавить {selectedImages.size > 0 && `(${selectedImages.size})`}
            </Button>
          </div>
        </>
      )}

      {/* Empty/initial states */}
      {!isLoading && images.length === 0 && (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground space-y-2">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="font-medium">Вставьте ссылку на страницу с фотографиями</p>
            <p className="text-sm">Поддерживается Yandex Disk и другие сайты</p>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Загрузить фото с сайта
            </DrawerTitle>
            <DrawerDescription>
              Вставьте ссылку на Yandex Disk или другой сайт
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 flex-1 overflow-hidden">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] max-h-[900px] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Загрузить фото с сайта
          </DialogTitle>
          <DialogDescription>
            Вставьте ссылку на Yandex Disk или другой сайт с изображениями
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
