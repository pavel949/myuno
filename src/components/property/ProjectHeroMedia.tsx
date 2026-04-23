/**
 * ProjectHeroMedia - Hero section with video or photo carousel for project pages
 * Supports YouTube embed, direct video URLs, and fallback to cover image
 */

import React, { useState, useMemo } from 'react';
import { Play, Images, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProjectHeroMediaProps {
  videoUrl?: string | null;
  coverImage?: string | null;
  images?: string[] | null;
  projectName: string;
  onGalleryOpen?: () => void;
  className?: string;
}

export function ProjectHeroMedia({
  videoUrl,
  coverImage,
  images,
  projectName,
  onGalleryOpen,
  className,
}: ProjectHeroMediaProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [showVideo, setShowVideo] = useState(!!videoUrl);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Extract YouTube video ID
  const youtubeId = useMemo(() => {
    if (!videoUrl) return null;
    const match = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  }, [videoUrl]);

  const allImages = useMemo(() => {
    const imgs: string[] = [];
    if (coverImage) imgs.push(coverImage);
    if (images?.length) {
      images.forEach(img => {
        if (img !== coverImage) imgs.push(img);
      });
    }
    return imgs;
  }, [coverImage, images]);

  const hasMultipleImages = allImages.length > 1;
  const totalImages = allImages.length;

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => (prev === 0 ? totalImages - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => (prev === totalImages - 1 ? 0 : prev + 1));
  };

  // Render YouTube embed
  if (showVideo && youtubeId) {
    return (
      <div className={cn("relative overflow-hidden rounded-none", className)}>
        <AspectRatio ratio={16 / 9}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&rel=0`}
            title={projectName}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </AspectRatio>
        
        {/* Toggle to photos */}
        {allImages.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-4 right-4 gap-2 bg-background/80"
            onClick={() => setShowVideo(false)}
          >
            <Images className="h-4 w-4" />
            {isRu ? 'Фото' : 'Photos'}
          </Button>
        )}
      </div>
    );
  }

  // Render direct video
  if (showVideo && videoUrl && !youtubeId) {
    return (
      <div className={cn("relative overflow-hidden rounded-none", className)}>
        <AspectRatio ratio={16 / 9}>
          <video
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        </AspectRatio>
        
        {allImages.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-4 right-4 gap-2 bg-background/80"
            onClick={() => setShowVideo(false)}
          >
            <Images className="h-4 w-4" />
            {isRu ? 'Фото' : 'Photos'}
          </Button>
        )}
      </div>
    );
  }

  // Render photo carousel
  return (
    <div className={cn("relative overflow-hidden rounded-none group", className)}>
      <AspectRatio ratio={16 / 9}>
        {allImages.length > 0 ? (
          <img
            src={allImages[currentImageIndex]}
            alt={`${projectName} ${currentImageIndex + 1}`}
            className="w-full h-full object-cover transition-opacity"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">
              {isRu ? 'Нет изображений' : 'No images'}
            </span>
          </div>
        )}
      </AspectRatio>

      {/* Carousel navigation */}
      {hasMultipleImages && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handlePrevImage}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleNextImage}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Dots indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {allImages.slice(0, 5).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  idx === currentImageIndex
                    ? "bg-white w-4"
                    : "bg-white/50 hover:bg-white/75"
                )}
              />
            ))}
            {totalImages > 5 && (
              <span className="text-xs text-white/80 ml-1">+{totalImages - 5}</span>
            )}
          </div>
        </>
      )}

      {/* Action buttons */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        {videoUrl && (
          <Button
            variant="secondary"
            size="sm"
            className="gap-2 bg-background/80"
            onClick={() => setShowVideo(true)}
          >
            <Play className="h-4 w-4" />
            {isRu ? 'Видео' : 'Video'}
          </Button>
        )}
        {allImages.length > 1 && onGalleryOpen && (
          <Button
            variant="secondary"
            size="sm"
            className="gap-2 bg-background/80"
            onClick={onGalleryOpen}
          >
            <Images className="h-4 w-4" />
            {isRu ? `${totalImages} фото` : `${totalImages} photos`}
          </Button>
        )}
      </div>
    </div>
  );
}

export default ProjectHeroMedia;
