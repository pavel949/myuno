import { memo, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { VERTICALS } from '@/lib/verticals';
import { cn } from '@/lib/utils';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { IconBadge } from '@/components/ui/IconBadge';
import { VERTICAL_GRADIENTS } from '@/lib/resolveVerticalItem';

interface ExploreVerticalsSheetProps {
  trigger?: ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ExploreVerticalsSheet = memo(function ExploreVerticalsSheet({
  trigger,
  className,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ExploreVerticalsSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { language } = useLanguage();
  const navigate = useNavigate();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;

  const allVerticals = Object.values(VERTICALS);

  const handleNavigate = (plural: string) => {
    setOpen(false);
    navigate(`/${plural}`);
  };

  const defaultTrigger = (
    <button 
      onClick={() => setOpen(true)}
      className={cn(
        "flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted/70 active:bg-muted transition-all duration-200 touch-manipulation active:scale-95",
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
        <LayoutGrid className="w-5 h-5 text-gray-900 dark:text-gray-100" />
      </div>
      <span className="text-[10px] font-medium text-gray-900 dark:text-gray-100">
        {language === 'ru' ? 'Ещё' : 'More'}
      </span>
    </button>
  );

  const triggerElement = trigger ? (
    <div onClick={() => setOpen(true)} className={className}>
      {trigger}
    </div>
  ) : defaultTrigger;

  return (
    <>
      {triggerElement}
      <ResponsiveModal
        open={open}
        onOpenChange={setOpen}
        title={language === 'ru' ? 'Все услуги' : 'All Services'}
        icon={<LayoutGrid className="h-5 w-5 text-primary" />}
        size="lg"
      >
        <div className="grid grid-cols-4 gap-2">
          {allVerticals.map((v) => {
            const gradient = VERTICAL_GRADIENTS[v.id] || 'from-primary to-accent';
            return (
              <button
                key={v.id}
                onClick={() => handleNavigate(v.plural)}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-2 rounded-xl',
                  'hover:bg-muted/50 active:bg-muted transition-all duration-200',
                  'touch-manipulation active:scale-95'
                )}
              >
                <IconBadge
                  icon={v.icon}
                  size="lg"
                  variant="gradient"
                  gradient={gradient}
                  className="shadow-md"
                />
                <span className="text-[10px] font-medium text-center text-muted-foreground leading-tight line-clamp-2">
                  {language === 'ru' ? v.labelRu : v.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </ResponsiveModal>
    </>
  );
});
