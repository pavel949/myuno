import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface VendorFormSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Whether section can be collapsed */
  collapsible?: boolean;
  /** Default open state for collapsible sections */
  defaultOpen?: boolean;
  /** Optional badge (e.g., "Required", "Optional") */
  badge?: string;
  /** Tooltip help text */
  helpText?: string;
}

export function VendorFormSection({
  title,
  description,
  icon,
  children,
  className,
  collapsible = false,
  defaultOpen = true,
  badge,
  helpText,
}: VendorFormSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  const header = (
    <div className="flex items-center gap-2">
      {icon && <span className="text-primary">{icon}</span>}
      <h3 className="font-semibold text-base">{title}</h3>
      {badge && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {badge}
        </span>
      )}
      {helpText && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">{helpText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );

  if (collapsible) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn('space-y-3', className)}>
        <div className="flex items-center justify-between">
          {header}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <CollapsibleContent className="space-y-4">
          {children}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {header}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}
