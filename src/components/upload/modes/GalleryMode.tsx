/**
 * GalleryMode - Multi-image gallery with drag & drop reordering
 * Based on AirbnbStyleImageUpload with enhancements
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Upload, X, Loader2, GripVertical, Star, 
  Globe, Plus, Check, AlertCircle, Pencil, Cloud
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ImagePickerFromUrl, ExternalImageResult } from '../ImagePickerFromUrl';
import { ImageEditor } from '../ImageEditor';
import { CloudStoragePicker } from '../CloudStoragePicker';
import { ImageQualityTips } from '../ImageQualityTips';
import type { CompressionConfig } from '../shared/ImageCompressor';

interface UploadingImage {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: 'compressing' | 'uploading' | 'done' | 'error';
  url?: string;
  error?: string;
}

interface GalleryModeProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  bucket?: string;
  maxItems?: number;
  enableCloudImport?: boolean;
  enableUrlImport?: boolean;
  enableEditing?: boolean;
  enableQualityTips?: boolean;
  compressionConfig?: Partial<CompressionConfig>;
  className?: string;
  disabled?: boolean;
}

// Sortable Image Item Component
function SortableImageItem({ 
  url, 
  index, 
  onRemove,
  onEdit,
  isFirst,
  isDragging,
  coverLabel,
}: { 
  url: string; 
  index: number;
  onRemove: () => void;
  onEdit: () => void;
  isFirst: boolean;
  isDragging?: boolean;
  coverLabel?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isItemDragging,
  } = useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isItemDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group rounded-none overflow-hidden border-2 transition-all select-none",
        isFirst ? "col-span-2 row-span-2 border-primary" : "border-border",
        isItemDragging && "opacity-30 scale-95 shadow-2xl ring-2 ring-primary",
        !isItemDragging && isDragging && "transition-transform duration-200"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-10 touch-none"
      />
      
      <div className={cn("aspect-square", isFirst && "aspect-auto h-full")}>
        <img 
          src={url} 
          alt={`Photo ${index + 1}`}
          className="w-full h-full object-cover pointer-events-none"
          loading="lazy"
          draggable={false}
        />
      </div>
      
      {isFirst && (
        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-none flex items-center gap-1 shadow-lg z-20">
          <Star className="h-3 w-3" fill="currentColor" />
          {coverLabel || 'Cover'}
        </div>
      )}
      
      <div className="absolute top-2 left-1/2 -translate-x-1/2 p-1 bg-black/40 rounded-full opacity-60 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
        <GripVertical className="h-4 w-4 text-white" />
      </div>
      
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-1.5 bg-black/60 hover:bg-primary rounded-none transition-colors"
        >
          <Pencil className="h-4 w-4 text-white" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1.5 bg-black/60 hover:bg-destructive rounded-none transition-colors"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>
      
      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-none z-20 pointer-events-none">
        {index + 1}
      </div>
      
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none z-0" />
    </div>
  );
}

// Uploading Image Preview
function UploadingImageItem({ image }: { image: UploadingImage }) {
  return (
    <div className="relative aspect-square rounded-none overflow-hidden border-2 border-dashed border-primary/50 bg-muted">
      <img 
        src={image.preview} 
        alt="Uploading"
        className="w-full h-full object-cover opacity-50"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
        {image.status === 'compressing' && (
          <>
            <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
            <span className="text-white text-xs font-medium">Compressing...</span>
          </>
        )}
        {image.status === 'uploading' && (
          <div className="w-16 h-16 relative">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.3)" strokeWidth="4" fill="none" />
              <circle cx="32" cy="32" r="28" stroke="white" strokeWidth="4" fill="none"
                strokeDasharray={175.93} strokeDashoffset={175.93 - (175.93 * image.progress) / 100} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold">
              {image.progress}%
            </span>
          </div>
        )}
        {image.status === 'done' && (
          <div className="bg-success rounded-full p-2">
            <Check className="h-6 w-6 text-white" />
          </div>
        )}
        {image.status === 'error' && (
          <>
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <span className="text-destructive text-xs text-center px-2">{image.error}</span>
          </>
        )}
      </div>
    </div>
  );
}

export function GalleryMode({
  value = [],
  onChange,
  folder = 'images',
  bucket = 'vendor-uploads',
  maxItems = 20,
  enableCloudImport = true,
  enableUrlImport = true,
  enableEditing = true,
  enableQualityTips = true,
  compressionConfig = {},
  className = '',
  disabled = false,
}: GalleryModeProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showUrlPicker, setShowUrlPicker] = useState(false);
  const [showCloudPicker, setShowCloudPicker] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editingImage, setEditingImage] = useState<{ url: string; index: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  const compressionOptions = {
    maxSizeMB: compressionConfig.maxSizeMB || 1,
    maxWidthOrHeight: compressionConfig.maxWidthOrHeight || 2048,
    useWebWorker: true,
    fileType: 'image/webp' as const,
    initialQuality: 0.85,
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => { 
      isMountedRef.current = false;
      uploadingImages.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    if ('vibrate' in navigator) navigator.vibrate(50);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = value.indexOf(active.id as string);
      const newIndex = value.indexOf(over.id as string);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newValue = arrayMove(value, oldIndex, newIndex);
        onChange(newValue);
        
        if (oldIndex !== 0 && newIndex === 0) {
          toast.success(isRu ? 'Обложка изменена' : 'Cover changed');
        }
      }
    }
  };

  const processFile = useCallback(async (file: File, id: string): Promise<string | null> => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'];
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.heic')) {
      setUploadingImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: 'error' as const, error: isRu ? 'Неподдерживаемый формат' : 'Unsupported format' } : img
      ));
      return null;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadingImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: 'error' as const, error: isRu ? 'Файл > 20MB' : 'File > 20MB' } : img
      ));
      return null;
    }

    try {
      setUploadingImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: 'compressing' as const } : img
      ));

      const compressedFile = await imageCompression(file, {
        ...compressionOptions,
        onProgress: (progress) => {
          if (isMountedRef.current) {
            setUploadingImages(prev => prev.map(img => 
              img.id === id && img.status === 'compressing' 
                ? { ...img, progress: Math.round(progress * 0.3) } 
                : img
            ));
          }
        }
      });

      setUploadingImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: 'uploading' as const, progress: 30 } : img
      ));

      const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 12)}.webp`;
      const filePath = `${user?.id}/${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, compressedFile, {
          contentType: 'image/webp',
          cacheControl: '31536000'
        });

      if (uploadError) throw uploadError;

      for (let p = 30; p <= 100; p += 10) {
        if (!isMountedRef.current) break;
        setUploadingImages(prev => prev.map(img => 
          img.id === id ? { ...img, progress: p } : img
        ));
        await new Promise(r => setTimeout(r, 50));
      }

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

      setUploadingImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: 'done' as const, url: publicUrl } : img
      ));

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      setUploadingImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: 'error' as const, error: isRu ? 'Ошибка загрузки' : 'Upload error' } : img
      ));
      return null;
    }
  }, [user, folder, bucket, compressionOptions]);

  const handleFiles = useCallback(async (files: File[]) => {
    if (!user) {
      toast.error(isRu ? 'Необходимо авторизоваться' : 'Please sign in');
      return;
    }

    const remainingSlots = maxItems - value.length;
    if (remainingSlots <= 0) {
      toast.error(isRu ? `Максимум ${maxItems} фото` : `Maximum ${maxItems} photos`);
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    
    const newUploadingImages: UploadingImage[] = filesToProcess.map(file => ({
      id: `${Date.now()}-${crypto.randomUUID().slice(0, 12)}`,
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'compressing' as const
    }));

    setUploadingImages(prev => [...prev, ...newUploadingImages]);

    const results: string[] = [];
    const batchSize = 3;
    
    for (let i = 0; i < newUploadingImages.length; i += batchSize) {
      const batch = newUploadingImages.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(img => processFile(img.file, img.id)));
      results.push(...batchResults.filter((url): url is string => url !== null));
    }

    if (isMountedRef.current && results.length > 0) {
      onChange([...value, ...results]);
      setTimeout(() => {
        if (isMountedRef.current) {
          setUploadingImages(prev => prev.filter(img => img.status !== 'done'));
        }
      }, 1000);
      toast.success(isRu ? `Загружено ${results.length} фото` : `${results.length} photos uploaded`);
    }
  }, [user, value, onChange, maxItems, processFile]);

  const handleExternalImages = useCallback(async (images: ExternalImageResult[]) => {
    if (!user) {
      toast.error(isRu ? 'Необходимо авторизоваться' : 'Please sign in');
      return;
    }

    const remainingSlots = maxItems - value.length;
    const imagesToProcess = images.slice(0, remainingSlots);
    
    const newUploadingImages: UploadingImage[] = imagesToProcess.map((img, idx) => ({
      id: `ext-${Date.now()}-${idx}`,
      file: new File([], img.name || 'image'),
      preview: img.previewUrl || img.originalUrl,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploadingImages(prev => [...prev, ...newUploadingImages]);

    const results: string[] = [];

    for (let i = 0; i < imagesToProcess.length; i++) {
      const img = imagesToProcess[i];
      const uploadingId = newUploadingImages[i].id;
      
      try {
        const fetchUrl = img.isYandexDisk 
          ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-image?url=${encodeURIComponent(img.originalUrl)}`
          : img.originalUrl;
        
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const blob = await response.blob();
        const file = new File([blob], img.name || 'image.jpg', { type: blob.type });
        
        setUploadingImages(prev => prev.map(u => 
          u.id === uploadingId ? { ...u, status: 'compressing' as const } : u
        ));
        
        const compressedFile = await imageCompression(file, compressionOptions);
        
        setUploadingImages(prev => prev.map(u => 
          u.id === uploadingId ? { ...u, status: 'uploading' as const, progress: 50 } : u
        ));
        
        const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 12)}.webp`;
        const filePath = `${user.id}/${folder}/${fileName}`;
        
        const { error } = await supabase.storage.from(bucket).upload(filePath, compressedFile, {
          contentType: 'image/webp',
          cacheControl: '31536000'
        });
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
        
        results.push(publicUrl);
        
        setUploadingImages(prev => prev.map(u => 
          u.id === uploadingId ? { ...u, status: 'done' as const, progress: 100 } : u
        ));
      } catch (error) {
        console.error('External upload error:', error);
        setUploadingImages(prev => prev.map(u => 
          u.id === uploadingId ? { ...u, status: 'error' as const, error: isRu ? 'Ошибка загрузки' : 'Upload error' } : u
        ));
      }
    }

    if (isMountedRef.current && results.length > 0) {
      onChange([...value, ...results]);
      setTimeout(() => {
        if (isMountedRef.current) {
          setUploadingImages(prev => prev.filter(img => img.status !== 'done'));
        }
      }, 1000);
      toast.success(isRu ? `Загружено ${results.length} фото` : `${results.length} photos uploaded`);
    }
  }, [user, value, onChange, maxItems, folder, bucket, compressionOptions]);

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleEdit = (url: string, index: number) => {
    setEditingImage({ url, index });
  };

  const handleEditSave = (newUrl: string) => {
    if (!editingImage) return;
    const newValue = [...value];
    newValue[editingImage.index] = newUrl;
    onChange(newValue);
    setEditingImage(null);
  };

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) handleFiles(files);
  };

  const activeImage = activeId ? value.find(url => url === activeId) : null;
  const remainingSlots = maxItems - value.length - uploadingImages.length;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-medium">{isRu ? 'Фотографии' : 'Photos'}</h3>
          <p className="text-sm text-muted-foreground">
            {value.length} {isRu ? 'из' : 'of'} {maxItems} • {isRu ? 'Перетащите для изменения порядка' : 'Drag to reorder'}
          </p>
        </div>
        <div className="flex gap-2">
          {enableCloudImport && (
            <Button type="button" variant="outline" size="sm" onClick={() => setShowCloudPicker(true)} disabled={disabled || remainingSlots <= 0}>
              <Cloud className="h-4 w-4 mr-2" />
              {isRu ? 'Облако' : 'Cloud'}
            </Button>
          )}
          {enableUrlImport && (
            <Button type="button" variant="outline" size="sm" onClick={() => setShowUrlPicker(true)} disabled={disabled || remainingSlots <= 0}>
              <Globe className="h-4 w-4 mr-2" />
              {isRu ? 'С сайта' : 'From URL'}
            </Button>
          )}
          <Button type="button" variant="default" size="sm" onClick={() => fileInputRef.current?.click()} disabled={disabled || remainingSlots <= 0}>
            <Plus className="h-4 w-4 mr-2" />
            {isRu ? 'Добавить' : 'Add'}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) handleFiles(files);
          e.target.value = '';
        }}
        className="hidden"
        multiple
        disabled={disabled}
      />

      <div
        onDragEnter={handleDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn("relative rounded-none transition-all", isDragOver && "ring-2 ring-primary ring-offset-2")}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={value} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 auto-rows-fr">
              {value.map((url, index) => (
                <SortableImageItem
                  key={url}
                  url={url}
                  index={index}
                  isFirst={index === 0}
                  onRemove={() => handleRemove(index)}
                  onEdit={() => enableEditing && handleEdit(url, index)}
                  isDragging={!!activeId}
                  coverLabel={isRu ? 'Обложка' : 'Cover'}
                />
              ))}

              {uploadingImages.map((image) => (
                <UploadingImageItem key={image.id} image={image} />
              ))}

              {remainingSlots > 0 && value.length > 0 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="aspect-square rounded-none border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 flex flex-col items-center justify-center gap-2 transition-colors bg-muted/30 hover:bg-muted/50"
                >
                  <Plus className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{isRu ? 'Ещё' : 'More'}</span>
                </button>
              )}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeImage && (
              <div className="aspect-square rounded-none overflow-hidden border-2 border-primary shadow-2xl scale-110 rotate-3">
                <img src={activeImage} alt="Dragging" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-primary/20" />
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {value.length === 0 && uploadingImages.length === 0 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className={cn(
              "w-full py-16 rounded-none border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4",
              isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
            )}
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium">{isRu ? 'Перетащите фото сюда' : 'Drag photos here'}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isRu ? `или нажмите для выбора • до ${maxItems} фото` : `or click to select • up to ${maxItems} photos`}
              </p>
            </div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>JPG</span><span>•</span><span>PNG</span><span>•</span><span>WebP</span><span>•</span><span>HEIC</span>
            </div>
          </button>
        )}

        {isDragOver && value.length > 0 && (
          <div className="absolute inset-0 bg-primary/10 rounded-none flex items-center justify-center pointer-events-none">
            <div className="bg-background/90 px-6 py-4 rounded-none shadow-lg">
              <p className="font-medium text-primary">{isRu ? 'Отпустите для загрузки' : 'Drop to upload'}</p>
            </div>
          </div>
        )}
      </div>

      {enableQualityTips && <ImageQualityTips imageUrl={value[0]} imageCount={value.length} />}

      {enableUrlImport && (
        <ImagePickerFromUrl
          open={showUrlPicker}
          onOpenChange={setShowUrlPicker}
          onSelect={handleExternalImages}
          maxImages={maxItems}
          currentCount={value.length}
        />
      )}

      {enableCloudImport && (
        <CloudStoragePicker
          open={showCloudPicker}
          onOpenChange={setShowCloudPicker}
          onSelect={(urls) => {
            const images: ExternalImageResult[] = urls.map(url => ({
              originalUrl: url,
              previewUrl: url,
              name: 'cloud-image.jpg',
              isYandexDisk: false
            }));
            handleExternalImages(images);
          }}
          maxImages={maxItems}
        />
      )}

      {enableEditing && editingImage && (
        <ImageEditor
          open={!!editingImage}
          onOpenChange={(open) => !open && setEditingImage(null)}
          imageUrl={editingImage.url}
          onSave={handleEditSave}
          userId={user?.id}
          folder={folder}
        />
      )}
    </div>
  );
}
