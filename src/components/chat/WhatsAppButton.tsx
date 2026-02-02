import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MessageCircle, X, GripVertical } from 'lucide-react';
import { COMPANY_CONTACTS } from '@/lib/config/contacts';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

interface SocialButtonsProps {
  className?: string;
}

// Pages where buttons should be hidden
const HIDDEN_ROUTES = ['/auth'];

const STORAGE_KEY = 'whatsapp-button-position';

export const WhatsAppButton: React.FC<SocialButtonsProps> = ({ className }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);

  // Load saved position
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate position is within viewport
        const maxX = window.innerWidth - 60;
        const maxY = window.innerHeight - 60;
        setPosition({
          x: Math.min(Math.max(0, parsed.x), maxX),
          y: Math.min(Math.max(0, parsed.y), maxY),
        });
      } catch {
        // Invalid saved position
      }
    }
  }, []);

  // Save position when changed
  useEffect(() => {
    if (position) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    }
  }, [position]);

  // Drag handlers
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const currentPos = position || {
      x: window.innerWidth - 60,
      y: window.innerHeight - 140,
    };
    
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      posX: currentPos.x,
      posY: currentPos.y,
    };
  };

  const handleDrag = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    
    const newX = dragStartRef.current.posX + deltaX;
    const newY = dragStartRef.current.posY + deltaY;
    
    // Constrain to viewport
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 60;
    
    setPosition({
      x: Math.min(Math.max(16, newX), maxX),
      y: Math.min(Math.max(16, newY), maxY),
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Add/remove global event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDrag);
      window.addEventListener('touchend', handleDragEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging]);
  
  // Hide on auth page
  if (HIDDEN_ROUTES.includes(location.pathname)) {
    return null;
  }
  
  const handleWhatsApp = () => {
    if (!isDragging) {
      window.open(COMPANY_CONTACTS.whatsapp.link, '_blank');
      setIsOpen(false);
    }
  };

  const handleTelegram = () => {
    if (!isDragging) {
      window.open(COMPANY_CONTACTS.telegram.number, '_blank');
      setIsOpen(false);
    }
  };

  const handleToggle = () => {
    if (!isDragging) {
      setIsOpen(!isOpen);
    }
  };

  // Calculate style based on position
  const positionStyle = position
    ? {
        left: position.x,
        top: position.y,
        right: 'auto',
        bottom: 'auto',
      }
    : {
        right: 16,
        bottom: 80,
      };

  return (
    <div 
      ref={dragRef}
      className={cn(
        'fixed z-40',
        isDragging && 'cursor-grabbing',
        className
      )}
      style={positionStyle}
    >
      {/* Expanded buttons */}
      <div 
        className={cn(
          'flex flex-col gap-2 mb-2 transition-all duration-300',
          isOpen 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <button
          onClick={handleTelegram}
          className={cn(
            'w-11 h-11 rounded-full shadow-lg',
            'bg-[#0088cc] hover:bg-[#0077b5] active:scale-95',
            'flex items-center justify-center',
            'transition-all duration-200'
          )}
          aria-label="Chat on Telegram"
        >
          <TelegramIcon className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={handleWhatsApp}
          className={cn(
            'w-11 h-11 rounded-full shadow-lg',
            'bg-[#25D366] hover:bg-[#20BD5A] active:scale-95',
            'flex items-center justify-center',
            'transition-all duration-200'
          )}
          aria-label="Chat on WhatsApp"
        >
          <WhatsAppIcon className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Main button with drag handle */}
      <div className="flex items-center gap-1">
        {/* Drag handle */}
        <button
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className={cn(
            'w-6 h-12 rounded-l-full flex items-center justify-center',
            'bg-muted/80 backdrop-blur-sm border border-border/50',
            'cursor-grab active:cursor-grabbing',
            'transition-all duration-200 hover:bg-muted',
            isDragging && 'bg-primary/20'
          )}
          aria-label="Drag to move"
        >
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </button>

        {/* Toggle button */}
        <button
          onClick={handleToggle}
          className={cn(
            'w-12 h-12 rounded-full shadow-lg',
            'bg-primary hover:bg-primary/90 active:scale-95',
            'flex items-center justify-center',
            'transition-all duration-300'
          )}
          aria-label={isOpen ? 'Close chat menu' : 'Open chat menu'}
        >
          <div className={cn(
            'transition-transform duration-300',
            isOpen && 'rotate-180'
          )}>
            {isOpen ? (
              <X className="w-5 h-5 text-primary-foreground" />
            ) : (
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

export default WhatsAppButton;
