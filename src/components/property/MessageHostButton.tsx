import React, { useState, forwardRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { GuestPropertyChat } from './GuestPropertyChat';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

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
  const isRu = language === 'ru';

  const title = isRu ? propertyTitleRu || propertyTitle : propertyTitle;
  const buttonLabel = isRu ? 'Написать хозяину' : 'Message host';

  const handleClick = () => {
    if (!user) {
      navigate(`/auth?redirect=/property/${propertyId}`);
      return;
    }
    setIsOpen(true);
  };

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

      <ResponsiveModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title={buttonLabel}
        icon={<MessageCircle className="w-5 h-5 text-primary" />}
        size="md"
        mobileHeight="max-h-[85vh]"
      >
        <div className="min-h-[300px]">
          <GuestPropertyChat
            propertyId={propertyId}
            propertyTitle={title}
            ownerName={ownerName}
            compact={false}
            onClose={() => setIsOpen(false)}
          />
        </div>
      </ResponsiveModal>
    </>
  );
});

export default MessageHostButton;
