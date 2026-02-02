import React, { useState, forwardRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { GuestPropertyChat } from './GuestPropertyChat';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface MessageHostButtonProps {
  propertyId: string;
  propertyTitle?: string;
  propertyTitleRu?: string;
  ownerName?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  fullWidth?: boolean;
  showLabel?: boolean;
  className?: string;
}

export const MessageHostButton = forwardRef<HTMLButtonElement, MessageHostButtonProps>(
  function MessageHostButton({
    propertyId,
    propertyTitle,
    propertyTitleRu,
    ownerName,
    variant = 'outline',
    size = 'default',
    fullWidth = false,
    showLabel = true,
    className,
  }, ref) {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isRu = language === 'ru';

  const title = isRu ? propertyTitleRu || propertyTitle : propertyTitle;
  const buttonLabel = isRu ? 'Написать хозяину' : 'Message host';

  const handleClick = () => {
    if (!user) {
      // Redirect to auth with return URL
      navigate(`/auth?redirect=/property/${propertyId}`);
      return;
    }
    setIsOpen(true);
  };

  const chatContent = (
    <GuestPropertyChat
      propertyId={propertyId}
      propertyTitle={title}
      ownerName={ownerName}
      compact={isMobile}
      onClose={() => setIsOpen(false)}
    />
  );

  return (
    <>
      <Button
        ref={ref}
        variant={variant}
        size={size}
        onClick={handleClick}
        className={className}
        style={{ width: fullWidth ? '100%' : undefined }}
      >
        <MessageCircle className="w-4 h-4" />
        {showLabel && <span className="ml-2">{buttonLabel}</span>}
      </Button>

      {/* Mobile: Use Sheet (bottom drawer) */}
      {isMobile ? (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-xl">
            <SheetHeader className="sr-only">
              <SheetTitle>{buttonLabel}</SheetTitle>
            </SheetHeader>
            <div className="h-full">
              {chatContent}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        /* Desktop: Use Dialog */
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-md p-0 overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>{buttonLabel}</DialogTitle>
            </DialogHeader>
            {chatContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
});

export default MessageHostButton;
