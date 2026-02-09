import { memo, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { VERTICALS } from '@/lib/verticals';
import { resolveIcon } from '@/lib/iconMap';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
} from '@/components/ui/drawer';
import { IconBadge } from '@/components/ui/IconBadge';

const VERTICAL_GRADIENTS: Record<string, string> = {
  property: 'from-emerald-500 to-green-400',
  yacht: 'from-blue-500 to-cyan-400',
  vehicle: 'from-indigo-500 to-violet-400',
  experience: 'from-purple-500 to-indigo-400',
  cleaning: 'from-amber-500 to-yellow-400',
  babysitter: 'from-pink-400 to-rose-300',
  beauty: 'from-pink-500 to-purple-400',
  restaurant: 'from-rose-500 to-pink-400',
  medical: 'from-teal-500 to-emerald-400',
  legal: 'from-slate-500 to-gray-400',
  education: 'from-blue-400 to-indigo-300',
  fitness: 'from-orange-500 to-red-400',
  event: 'from-purple-500 to-indigo-400',
  water_activity: 'from-cyan-500 to-blue-400',
  pet_service: 'from-orange-500 to-amber-400',
  flower: 'from-pink-400 to-rose-300',
  insurance: 'from-slate-500 to-blue-400',
  transfer: 'from-indigo-500 to-blue-400',
};

interface ExploreVerticalsSheetProps {
  trigger?: ReactNode;
  className?: string;
  /** Controlled open state (optional) */
  open?: boolean;
  /** Controlled open change handler (optional) */
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

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;

  const allVerticals = Object.values(VERTICALS);

  const handleNavigate = (plural: string) => {
    setOpen(false);
    navigate(`/${plural}`);
  };

  // When used as controlled (no trigger), render only the drawer content
  const drawerTrigger = trigger !== undefined || !isControlled ? (
    <DrawerTrigger asChild className={className}>
      {trigger || (
        <button className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted/50 active:bg-muted transition-all duration-200 touch-manipulation active:scale-95">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">
            {language === 'ru' ? 'Ещё' : 'More'}
          </span>
        </button>
      )}
    </DrawerTrigger>
  ) : null;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      {drawerTrigger}
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle>
            {language === 'ru' ? 'Все услуги' : 'All Services'}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Browse all available service categories
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6 overflow-y-auto">
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
        </div>
      </DrawerContent>
    </Drawer>
  );
});
