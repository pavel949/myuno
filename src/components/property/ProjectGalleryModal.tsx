/**
 * ProjectGalleryModal - Fullscreen gallery modal with swipe navigation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, DownloadCloud } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProjectGalleryModalProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
}

export function ProjectGalleryModal({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  projectName,
}: ProjectGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  // Reset to initial index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
    }
  }, [isOpen, initialIndex]);

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    setIsZoomed(false);
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
    setIsZoomed(false);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrev();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  if (!images.length) return null;

  const handleDownloadCurrent = async () => {
    try {
      const url = images[currentIndex];
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
      link.download = `${projectName || 'photo'}_${currentIndex + 1}.${ext}`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      toast.error('Download failed');
    }
  };

  const handleDownloadAll = async () => {
    toast.info('Downloading all photos...');
    for (let i = 0; i < images.length; i++) {
      try {
        const url = images[i];
        const response = await fetch(url);
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
        link.download = `${projectName || 'photo'}_${i + 1}.${ext}`;
        link.click();
        URL.revokeObjectURL(link.href);
        // Small delay between downloads
        await new Promise(r => setTimeout(r, 300));
      } catch { /* skip failed */ }
    }
    toast.success(`Downloaded ${images.length} photos`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 bg-black/95 border-none">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="text-white">
            {projectName && (
              <h3 className="font-medium">{projectName}</h3>
            )}
            <p className="text-sm text-white/70">
              {currentIndex + 1} / {images.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={handleDownloadCurrent}
              title="Download current"
            >
              <Download className="h-5 w-5" />
            </Button>
            {images.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={handleDownloadAll}
                title="Download all"
              >
                <DownloadCloud className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setIsZoomed(!isZoomed)}
            >
              {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main image */}
        <div 
          className="w-full h-full flex items-center justify-center overflow-hidden"
          onClick={(e) => {
            // Click on left third = prev, right third = next, center = toggle zoom
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const third = rect.width / 3;
            
            if (x < third) {
              handlePrev();
            } else if (x > third * 2) {
              handleNext();
            } else {
              setIsZoomed(!isZoomed);
            }
          }}
        >
          <img
            src={images[currentIndex]}
            alt={`${projectName || 'Gallery'} ${currentIndex + 1}`}
            className={cn(
              "max-w-full max-h-full transition-transform duration-300",
              isZoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
            )}
            draggable={false}
          />
        </div>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
            <div className="flex gap-2 justify-center overflow-x-auto scrollbar-hide">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                    setIsZoomed(false);
                  }}
                  className={cn(
                    "w-16 h-12 rounded-none overflow-hidden flex-shrink-0 border-2 transition-all",
                    idx === currentIndex 
                      ? "border-white opacity-100" 
                      : "border-transparent opacity-50 hover:opacity-75"
                  )}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ProjectGalleryModal;
