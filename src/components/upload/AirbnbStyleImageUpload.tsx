import { useState, useCallback, useRef, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Upload, X, Loader2, ImageIcon, GripVertical, Star, 
  Globe, Plus, Check, AlertCircle 
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
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ImagePickerFromUrl, ExternalImageResult } from './ImagePickerFromUrl';

interface UploadingImage {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: 'compressing' | 'uploading' | 'done' | 'error';
  url?: string;
  error?: string;
}

interface AirbnbStyleImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  maxImages?: number;
  className?: string;
}

// Compression options matching Airbnb quality
const compressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 2048,
  useWebWorker: true,
  fileType: 'image/webp' as const,
  initialQuality: 0.85,
};

// Sortable Image Item Component
function SortableImageItem({ 
  url, 
  index, 
  onRemove, 
  isFirst,
  isDragging 
}: { 
  url: string; 
  index: number;
  onRemove: () => void;
  isFirst: boolean;
  isDragging?: boolean;
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
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group aspect-square rounded-xl overflow-hidden border-2 transition-all",
        isFirst ? "col-span-2 row-span-2 border-primary" : "border-border",
        isItemDragging && "opacity-50 scale-95",
        isDragging && "cursor-grabbing"
      )}
    >
      <img 
        src={url} 
        alt={`Image ${index + 1}`}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      
      {/* Cover badge */}
      {isFirst && (
        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1 shadow-lg">
          <Star className="h-3 w-3" fill="currentColor" />
          Обложка
        </div>
      )}
      
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-10 p-1.5 bg-black/60 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-white" />
      </div>
      
      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-all"
      >
        <X className="h-4 w-4 text-white" />
      </button>
      
      {/* Photo number */}
      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
        {index + 1}
      </div>
    </div>
  );
}

// Uploading Image Preview
function UploadingImageItem({ image }: { image: UploadingImage }) {
  return (
    <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-primary/50 bg-muted">
      <img 
        src={image.preview} 
        alt="Uploading"
        className="w-full h-full object-cover opacity-50"
      />
      
      {/* Progress overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
        {image.status === 'compressing' && (
          <>
            <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
            <span className="text-white text-xs font-medium">Сжатие...</span>
          </>
        )}
        {image.status === 'uploading' && (
          <>
            <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="4"
                  fill="none"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="white"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={175.93}
                  strokeDashoffset={175.93 - (175.93 * image.progress) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold">
                {image.progress}%
              </span>
            </div>
          </>
        )}
        {image.status === 'done' && (
          <div className="bg-green-500 rounded-full p-2">
            <Check className="h-6 w-6 text-white" />
          </div>
        )}
        {image.status === 'error' && (
          <>
            <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
            <span className="text-red-400 text-xs text-center px-2">{image.error}</span>
          </>
        )}
      </div>
    </div>
  );
}

export function AirbnbStyleImageUpload({
  value = [],
  onChange,
  folder = 'images',
  maxImages = 20,
  className = ''
}: AirbnbStyleImageUploadProps) {
  const { user } = useAuth();
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showUrlPicker, setShowUrlPicker] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { 
      isMountedRef.current = false;
      // Clean up preview URLs
      uploadingImages.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
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
          toast.success('Обложка изменена');
        }
      }
    }
  };

  // Compress and upload a single file
  const processFile = useCallback(async (file: File, id: string): Promise<string | null> => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'];
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.heic')) {
      setUploadingImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: 'error' as const, error: 'Неподдерживаемый формат' } : img
      ));
      return null;
    }

    // Validate file size (max 20MB before compression)
    if (file.size > 20 * 1024 * 1024) {
      setUploadingImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: 'error' as const, error: 'Файл слишком большой' } : img
      ));
      return null;
    }

    try {
      // Step 1: Compress
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

      // Step 2: Upload
      setUploadingImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: 'uploading' as const, progress: 30 } : img
      ));

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
      const filePath = `${user?.id}/${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vendor-uploads')
        .upload(filePath, compressedFile, {
          contentType: 'image/webp',
          cacheControl: '31536000' // 1 year cache
        });

      if (uploadError) throw uploadError;

      // Simulate progress
      for (let p = 30; p <= 100; p += 10) {
        if (!isMountedRef.current) break;
        setUploadingImages(prev => prev.map(img => 
          img.id === id ? { ...img, progress: p } : img
        ));
        await new Promise(r => setTimeout(r, 50));
      }

      const { data: { publicUrl } } = supabase.storage
        .from('vendor-uploads')
        .getPublicUrl(filePath);

      setUploadingImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: 'done' as const, url: publicUrl } : img
      ));

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      setUploadingImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: 'error' as const, error: 'Ошибка загрузки' } : img
      ));
      return null;
    }
  }, [user, folder]);

  // Handle multiple files
  const handleFiles = useCallback(async (files: File[]) => {
    if (!user) {
      toast.error('Необходимо авторизоваться');
      return;
    }

    const remainingSlots = maxImages - value.length;
    if (remainingSlots <= 0) {
      toast.error(`Максимум ${maxImages} фото`);
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    
    // Create preview items
    const newUploadingImages: UploadingImage[] = filesToProcess.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'compressing' as const
    }));

    setUploadingImages(prev => [...prev, ...newUploadingImages]);

    // Process all files in parallel (max 3 concurrent)
    const results: string[] = [];
    const batchSize = 3;
    
    for (let i = 0; i < newUploadingImages.length; i += batchSize) {
      const batch = newUploadingImages.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(img => processFile(img.file, img.id))
      );
      results.push(...batchResults.filter((url): url is string => url !== null));
    }

    if (isMountedRef.current && results.length > 0) {
      onChange([...value, ...results]);
      
      // Clean up completed uploads after delay
      setTimeout(() => {
        if (isMountedRef.current) {
          setUploadingImages(prev => prev.filter(img => img.status !== 'done'));
        }
      }, 1000);
      
      toast.success(`Загружено ${results.length} фото`);
    }
  }, [user, value, onChange, maxImages, processFile]);

  // Handle external images from URL picker
  const handleExternalImages = useCallback(async (images: ExternalImageResult[]) => {
    if (!user) {
      toast.error('Необходимо авторизоваться');
      return;
    }

    const remainingSlots = maxImages - value.length;
    const imagesToProcess = images.slice(0, remainingSlots);
    
    // Create placeholder uploading items
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
        // Fetch via proxy for Yandex Disk
        const fetchUrl = img.isYandexDisk 
          ? `https://kakkwibljrjsawxgnupk.supabase.co/functions/v1/proxy-image?url=${encodeURIComponent(img.originalUrl)}`
          : img.originalUrl;
        
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const blob = await response.blob();
        const file = new File([blob], img.name || 'image.jpg', { type: blob.type });
        
        // Compress the downloaded image
        setUploadingImages(prev => prev.map(u => 
          u.id === uploadingId ? { ...u, status: 'compressing' as const } : u
        ));
        
        const compressedFile = await imageCompression(file, compressionOptions);
        
        setUploadingImages(prev => prev.map(u => 
          u.id === uploadingId ? { ...u, status: 'uploading' as const, progress: 50 } : u
        ));
        
        // Upload
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
        const filePath = `${user.id}/${folder}/${fileName}`;
        
        const { error } = await supabase.storage
          .from('vendor-uploads')
          .upload(filePath, compressedFile, {
            contentType: 'image/webp',
            cacheControl: '31536000'
          });
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('vendor-uploads')
          .getPublicUrl(filePath);
        
        results.push(publicUrl);
        
        setUploadingImages(prev => prev.map(u => 
          u.id === uploadingId ? { ...u, status: 'done' as const, progress: 100 } : u
        ));
      } catch (error) {
        console.error('External upload error:', error);
        setUploadingImages(prev => prev.map(u => 
          u.id === uploadingId ? { ...u, status: 'error' as const, error: 'Ошибка загрузки' } : u
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
      
      toast.success(`Загружено ${results.length} фото`);
    }
  }, [user, value, onChange, maxImages, folder]);

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const activeImage = activeId ? value.find(url => url === activeId) : null;
  const remainingSlots = maxImages - value.length - uploadingImages.length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Фотографии</h3>
          <p className="text-sm text-muted-foreground">
            {value.length} из {maxImages} • Перетащите для изменения порядка
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowUrlPicker(true)}
            disabled={remainingSlots <= 0}
          >
            <Globe className="h-4 w-4 mr-2" />
            С сайта
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={remainingSlots <= 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
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
      />

      {/* Image Grid with DnD */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-xl transition-all",
          isDragOver && "ring-2 ring-primary ring-offset-2"
        )}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={value} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {/* Uploaded images */}
              {value.map((url, index) => (
                <SortableImageItem
                  key={url}
                  url={url}
                  index={index}
                  isFirst={index === 0}
                  onRemove={() => handleRemove(index)}
                  isDragging={!!activeId}
                />
              ))}

              {/* Uploading images */}
              {uploadingImages.map((image) => (
                <UploadingImageItem key={image.id} image={image} />
              ))}

              {/* Add more placeholder */}
              {remainingSlots > 0 && value.length > 0 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 flex flex-col items-center justify-center gap-2 transition-colors bg-muted/30 hover:bg-muted/50"
                >
                  <Plus className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Ещё</span>
                </button>
              )}
            </div>
          </SortableContext>

          {/* Drag overlay */}
          <DragOverlay>
            {activeImage && (
              <div className="aspect-square rounded-xl overflow-hidden border-2 border-primary shadow-2xl scale-105">
                <img 
                  src={activeImage} 
                  alt="Dragging"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {/* Empty state / Drop zone */}
        {value.length === 0 && uploadingImages.length === 0 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-full py-16 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4",
              isDragOver 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
            )}
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium">Перетащите фото сюда</p>
              <p className="text-sm text-muted-foreground mt-1">
                или нажмите для выбора • до {maxImages} фото
              </p>
            </div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>JPG</span>
              <span>•</span>
              <span>PNG</span>
              <span>•</span>
              <span>WebP</span>
              <span>•</span>
              <span>HEIC</span>
            </div>
          </button>
        )}

        {/* Drag over overlay */}
        {isDragOver && value.length > 0 && (
          <div className="absolute inset-0 bg-primary/10 rounded-xl flex items-center justify-center pointer-events-none">
            <div className="bg-background/90 backdrop-blur-sm px-6 py-4 rounded-xl shadow-lg">
              <p className="font-medium text-primary">Отпустите для загрузки</p>
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      {value.length > 0 && (
        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
          <ImageIcon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p><strong>Совет:</strong> Первое фото станет обложкой. Перетащите фото, чтобы изменить порядок.</p>
          </div>
        </div>
      )}

      {/* URL Picker */}
      <ImagePickerFromUrl
        open={showUrlPicker}
        onOpenChange={setShowUrlPicker}
        onSelect={handleExternalImages}
        maxImages={maxImages}
        currentCount={value.length}
      />
    </div>
  );
}
