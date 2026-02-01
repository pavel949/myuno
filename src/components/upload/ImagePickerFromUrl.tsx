import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, Check, ExternalLink, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

  const remainingSlots = maxImages - currentCount;

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

    try {
      const { data, error } = await supabase.functions.invoke('extract-images-from-url', {
        body: { url: url.trim() }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Не удалось загрузить страницу');
      }

      // Handle both formats: array of strings or array of objects with url/preview
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
    setImages([]);
    setSelectedImages(new Set());
    setUrl('');
    setPageTitle('');
    setSource('');
  };

  const selectAll = () => {
    const toSelect = images.slice(0, remainingSlots).map(img => img.url);
    setSelectedImages(new Set(toSelect));
  };

  const clearSelection = () => {
    setSelectedImages(new Set());
  };

  // Check if URL looks like Yandex Disk
  const isYandexDiskUrl = url.includes('disk.yandex.ru') || url.includes('yadi.sk');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Загрузить фото с сайта
          </DialogTitle>
        </DialogHeader>

        {/* URL Input */}
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://example.com или disk.yandex.ru/d/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
            className="flex-1"
          />
          <Button onClick={handleExtract} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2">Найти</span>
          </Button>
        </div>

        {/* Yandex Disk hint */}
        {isYandexDiskUrl && !isLoading && images.length === 0 && (
          <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
            🔗 Обнаружена ссылка на Yandex Disk. Будет использован API Yandex Disk для извлечения изображений.
          </div>
        )}

        {/* Page title / source */}
        {pageTitle && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            {pageTitle}
            {source === 'yandex_disk' && (
              <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded">Yandex Disk</span>
            )}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">
                {isYandexDiskUrl 
                  ? 'Загрузка файлов с Yandex Disk...' 
                  : 'Загрузка страницы и поиск изображений...'}
              </p>
            </div>
          </div>
        )}

        {/* Images grid */}
        {!isLoading && images.length > 0 && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Выбрано: {selectedImages.size} / {remainingSlots} доступно
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Выбрать все
                </Button>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Сбросить
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 max-h-[400px]">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-1">
                {images.map((image, index) => {
                  const isSelected = selectedImages.has(image.url);
                  const displayUrl = image.preview || image.url;
                  return (
                    <div
                      key={index}
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all group",
                        isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-muted-foreground/30"
                      )}
                      onClick={() => toggleImage(image.url)}
                    >
                      <img
                        src={displayUrl}
                        alt={image.name || `Image ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.parentElement!.style.display = 'none';
                        }}
                      />
                      {image.name && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                          {image.name}
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button onClick={handleConfirm} disabled={selectedImages.size === 0}>
                Добавить {selectedImages.size > 0 && `(${selectedImages.size})`}
              </Button>
            </div>
          </>
        )}

        {/* Empty state after search */}
        {!isLoading && images.length === 0 && url && (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center text-muted-foreground">
              <p>Введите URL страницы и нажмите "Найти"</p>
              <p className="text-sm mt-1">Мы извлечём все изображения с этой страницы</p>
            </div>
          </div>
        )}

        {/* Initial state */}
        {!isLoading && images.length === 0 && !url && (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Вставьте ссылку на страницу с фотографиями</p>
              <p className="text-sm mt-1">Поддерживается Yandex Disk и другие сайты</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
