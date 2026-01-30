import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { priorityConfig, sourceConfig, type VendorProspect } from '@/hooks/useVendorAcquisition';
import { MapPin, Star, Instagram, Globe, MessageCircle, Facebook, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

interface VendorProspectCardProps {
  prospect: VendorProspect;
  onDragStart: (e: React.DragEvent) => void;
  onClick: () => void;
}

export function VendorProspectCard({ prospect, onDragStart, onClick }: VendorProspectCardProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const priority = priorityConfig[prospect.ai_priority || ''];

  const getSourceIcon = () => {
    switch (prospect.source_type) {
      case 'instagram':
        return <Instagram className="h-3 w-3" />;
      case 'google_maps':
        return <Map className="h-3 w-3" />;
      case 'facebook':
        return <Facebook className="h-3 w-3" />;
      default:
        return <MessageCircle className="h-3 w-3" />;
    }
  };

  const location = prospect.district || prospect.address || prospect.city;

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200 bg-background",
        "hover:ring-2 hover:ring-primary/20"
      )}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header with avatar and name */}
        <div className="flex items-start gap-2">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {prospect.business_name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{prospect.business_name}</h4>
            {prospect.category && (
              <p className="text-xs text-muted-foreground truncate">{prospect.category}</p>
            )}
          </div>
        </div>

        {/* Score and priority */}
        <div className="flex items-center gap-2">
          {prospect.ai_score !== null && (
            <Badge variant="outline" className="text-xs gap-1">
              <Star className="h-3 w-3 text-yellow-500" />
              {prospect.ai_score}
            </Badge>
          )}
          {priority && (
            <Badge 
              variant="outline" 
              className={cn("text-xs", priority.color)}
            >
              {priority.label}
            </Badge>
          )}
        </div>

        {/* Location */}
        {location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{location}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t">
          <div className="flex items-center gap-1 text-muted-foreground">
            {getSourceIcon()}
            <span className="text-xs capitalize">{prospect.source_type?.replace('_', ' ')}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(prospect.created_at), { 
              addSuffix: true,
              locale: isRussian ? ru : enUS 
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
