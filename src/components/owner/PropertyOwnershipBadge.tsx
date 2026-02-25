import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  UserCheck, 
  FileSignature,
  Clock,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyOwnershipBadgeProps {
  ownershipType: 'own' | 'client' | 'poa' | null | undefined;
  createdOnBehalf?: boolean | null;
  actualOwnerName?: string | null;
  managedByOrgName?: string | null;
  className?: string;
  showLabel?: boolean;
}

export function PropertyOwnershipBadge({
  ownershipType,
  createdOnBehalf,
  actualOwnerName,
  managedByOrgName,
  className,
  showLabel = true,
}: PropertyOwnershipBadgeProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Default to 'own' if not specified
  const type = ownershipType || 'own';

  if (type === 'own' && !createdOnBehalf) {
    return null; // Don't show badge for regular ownership
  }

  const config = {
    own: {
      icon: Building2,
      label: isRu ? 'Мой объект' : 'My property',
      variant: 'outline' as const,
      className: '',
    },
    client: {
      icon: Users,
      label: actualOwnerName 
        ? (isRu ? `Клиент: ${actualOwnerName}` : `Client: ${actualOwnerName}`)
        : (isRu ? 'Объект клиента' : "Client's property"),
      variant: 'secondary' as const,
      className: 'bg-info/10 text-info border-info/30',
    },
    poa: {
      icon: FileSignature,
      label: actualOwnerName 
        ? (isRu ? `По доверенности: ${actualOwnerName}` : `POA: ${actualOwnerName}`)
        : (isRu ? 'По доверенности' : 'Power of Attorney'),
      variant: 'secondary' as const,
      className: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    },
  };

  const { icon: Icon, label, variant, className: badgeClassName } = config[type];

  return (
    <Badge 
      variant={variant}
      className={cn(badgeClassName, className)}
    >
      <Icon className="h-3 w-3 mr-1" />
      {showLabel && <span className="truncate max-w-[120px]">{label}</span>}
      {createdOnBehalf && type !== 'own' && (
        <span title={isRu ? 'Ожидает подтверждения' : 'Pending confirmation'}>
          <Clock className="h-3 w-3 ml-1 text-amber-500" />
        </span>
      )}
    </Badge>
  );
}

interface PropertyDelegationInfoProps {
  ownershipType: 'own' | 'client' | 'poa' | null | undefined;
  actualOwnerName?: string | null;
  actualOwnerEmail?: string | null;
  managedByOrgName?: string | null;
  createdOnBehalf?: boolean | null;
  className?: string;
}

export function PropertyDelegationInfo({
  ownershipType,
  actualOwnerName,
  actualOwnerEmail,
  managedByOrgName,
  createdOnBehalf,
  className,
}: PropertyDelegationInfoProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const type = ownershipType || 'own';

  if (type === 'own' && !createdOnBehalf && !managedByOrgName) {
    return null;
  }

  return (
    <div className={cn("p-3 rounded-lg bg-muted/50 border text-sm", className)}>
      {type === 'client' && (
        <div className="flex items-start gap-2">
          <Users className="h-4 w-4 text-info mt-0.5" />
          <div>
            <p className="font-medium">
              {isRu ? 'Объект клиента' : "Client's property"}
            </p>
            {actualOwnerName && (
              <p className="text-muted-foreground text-xs">
                {isRu ? 'Собственник: ' : 'Owner: '}
                {actualOwnerName}
                {actualOwnerEmail && ` (${actualOwnerEmail})`}
              </p>
            )}
            {createdOnBehalf && (
              <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {isRu ? 'Ожидает подтверждения от собственника' : 'Pending owner confirmation'}
              </p>
            )}
          </div>
        </div>
      )}

      {type === 'poa' && (
        <div className="flex items-start gap-2">
          <FileSignature className="h-4 w-4 text-purple-500 mt-0.5" />
          <div>
            <p className="font-medium">
              {isRu ? 'Управление по доверенности' : 'Power of Attorney'}
            </p>
            {actualOwnerName && (
              <p className="text-muted-foreground text-xs">
                {isRu ? 'Собственник: ' : 'Owner: '}
                {actualOwnerName}
                {actualOwnerEmail && ` (${actualOwnerEmail})`}
              </p>
            )}
            {createdOnBehalf && (
              <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {isRu ? 'Ожидает подтверждения от собственника' : 'Pending owner confirmation'}
              </p>
            )}
          </div>
        </div>
      )}

      {managedByOrgName && (
        <div className="flex items-start gap-2 mt-2 pt-2 border-t">
          <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-muted-foreground text-xs">
              {isRu ? 'Управляющая компания: ' : 'Management company: '}
              <span className="font-medium text-foreground">{managedByOrgName}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
