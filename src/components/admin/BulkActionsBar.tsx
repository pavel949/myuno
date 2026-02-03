import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  X, 
  CheckSquare, 
  Power, 
  PowerOff, 
  Trash2, 
  Star, 
  StarOff, 
  Percent,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BulkAction {
  id: string;
  labelEn: string;
  labelRu: string;
  icon: React.ReactNode;
  variant?: 'default' | 'destructive';
  onClick: () => void;
}

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  actions: BulkAction[];
  className?: string;
}

export function BulkActionsBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  actions,
  className,
}: BulkActionsBarProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  if (selectedCount === 0) return null;

  const primaryActions = actions.slice(0, 3);
  const moreActions = actions.slice(3);

  return (
    <div 
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-3 px-4 py-3 rounded-xl",
        "bg-card border shadow-lg",
        "animate-in slide-in-from-bottom-4 duration-300",
        className
      )}
    >
      {/* Selection Info */}
      <div className="flex items-center gap-2 pr-3 border-r">
        <CheckSquare className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          {selectedCount} {isRussian ? 'из' : 'of'} {totalCount}
        </span>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onSelectAll}
          className="text-xs"
        >
          {isRussian ? 'Выбрать все' : 'Select All'}
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDeselectAll}
          className="text-xs"
        >
          {isRussian ? 'Снять выбор' : 'Deselect'}
        </Button>
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-border" />

      {/* Primary Actions */}
      <div className="flex items-center gap-1">
        {primaryActions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
            size="sm"
            onClick={action.onClick}
            className="gap-1.5"
          >
            {action.icon}
            <span className="hidden sm:inline">
              {isRussian ? action.labelRu : action.labelEn}
            </span>
          </Button>
        ))}

        {/* More Actions Dropdown */}
        {moreActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                {isRussian ? 'Ещё' : 'More'}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {moreActions.map((action, idx) => (
                <React.Fragment key={action.id}>
                  {action.variant === 'destructive' && idx > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem 
                    onClick={action.onClick}
                    className={action.variant === 'destructive' ? 'text-destructive' : ''}
                  >
                    {action.icon}
                    <span className="ml-2">{isRussian ? action.labelRu : action.labelEn}</span>
                  </DropdownMenuItem>
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Close Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 ml-2"
        onClick={onDeselectAll}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Preset bulk actions for common use cases
export function useCatalogBulkActions(
  selectedIds: string[],
  handlers: {
    onActivate?: () => void;
    onDeactivate?: () => void;
    onFeature?: () => void;
    onUnfeature?: () => void;
    onDelete?: () => void;
    onChangeCommission?: () => void;
  }
): BulkAction[] {
  const actions: BulkAction[] = [];

  if (handlers.onActivate) {
    actions.push({
      id: 'activate',
      labelEn: 'Activate',
      labelRu: 'Активировать',
      icon: <Power className="h-4 w-4" />,
      onClick: handlers.onActivate,
    });
  }

  if (handlers.onDeactivate) {
    actions.push({
      id: 'deactivate',
      labelEn: 'Deactivate',
      labelRu: 'Деактивировать',
      icon: <PowerOff className="h-4 w-4" />,
      onClick: handlers.onDeactivate,
    });
  }

  if (handlers.onFeature) {
    actions.push({
      id: 'feature',
      labelEn: 'Feature',
      labelRu: 'В избранное',
      icon: <Star className="h-4 w-4" />,
      onClick: handlers.onFeature,
    });
  }

  if (handlers.onUnfeature) {
    actions.push({
      id: 'unfeature',
      labelEn: 'Unfeature',
      labelRu: 'Убрать из избранного',
      icon: <StarOff className="h-4 w-4" />,
      onClick: handlers.onUnfeature,
    });
  }

  if (handlers.onChangeCommission) {
    actions.push({
      id: 'commission',
      labelEn: 'Change Commission',
      labelRu: 'Изменить комиссию',
      icon: <Percent className="h-4 w-4" />,
      onClick: handlers.onChangeCommission,
    });
  }

  if (handlers.onDelete) {
    actions.push({
      id: 'delete',
      labelEn: 'Delete',
      labelRu: 'Удалить',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      onClick: handlers.onDelete,
    });
  }

  return actions;
}
