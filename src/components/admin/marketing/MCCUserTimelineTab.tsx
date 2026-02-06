import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  User, Search, Clock, Globe, MousePointerClick, Target,
  CheckCircle, Flag, MessageSquare, Tag, Loader2
} from 'lucide-react';
import { useUserTimeline } from '@/hooks/useMCCControlTower';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

const EVENT_ICONS: Record<string, React.ElementType> = {
  landing_view: Globe,
  primary_cta_click: MousePointerClick,
  intent_started: Target,
  form_submitted: User,
  first_service_completed: CheckCircle,
  second_service_started: Target,
  second_service_completed: CheckCircle,
  session_started: Clock,
};

export function MCCUserTimelineTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [searchId, setSearchId] = useState('');
  const [activeUserId, setActiveUserId] = useState('');

  const { data, isLoading } = useUserTimeline(activeUserId);

  const handleSearch = () => {
    if (searchId.trim()) {
      setActiveUserId(searchId.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          {isRu ? 'Таймлайн пользователя' : 'User Timeline'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isRu ? 'Полная история событий для конкретного пользователя' : 'Complete event history for a specific user'}
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isRu ? 'Введите User ID...' : 'Enter User ID...'}
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch}>
          {isRu ? 'Найти' : 'Search'}
        </Button>
      </div>

      {!activeUserId ? (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Введите User ID для просмотра таймлайна' : 'Enter a User ID to view their timeline'}
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* User Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-medium">
                    {data?.profile?.full_name || (isRu ? 'Неизвестный пользователь' : 'Unknown User')}
                  </h3>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {data?.profile?.email && <span>{data.profile.email}</span>}
                    {data?.profile?.phone && <span>{data.profile.phone}</span>}
                  </div>
                  <div className="flex gap-2 mt-2">
                    {data?.state && (
                      <Badge variant="default" className="text-xs">{data.state.state}</Badge>
                    )}
                    {data?.state?.source_landing && (
                      <Badge variant="outline" className="text-xs">
                        {isRu ? 'Источник:' : 'Source:'} {data.state.source_landing}
                      </Badge>
                    )}
                    {data?.state?.verticals_used && (data.state.verticals_used as string[]).length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {(data.state.verticals_used as string[]).join(', ')}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {isRu ? 'Тег' : 'Tag'}
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    {isRu ? 'Сообщение' : 'Message'}
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs text-destructive">
                    <Flag className="h-3 w-3 mr-1" />
                    {isRu ? 'Флаг' : 'Flag'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {isRu ? 'События' : 'Events'} ({data?.events?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {(data?.events || []).map((event: any, idx: number) => {
                  const Icon = EVENT_ICONS[event.event_name] || Clock;
                  return (
                    <div key={event.id || idx} className="flex gap-3 py-3 border-b border-border/50 last:border-0">
                      <div className="flex flex-col items-center">
                        <div className="p-1.5 rounded-full bg-muted">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        {idx < (data?.events?.length || 0) - 1 && (
                          <div className="w-px flex-1 bg-border mt-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{event.event_name}</span>
                            {event.landing_id && (
                              <Badge variant="outline" className="text-xs">{event.landing_id}</Badge>
                            )}
                            {event.vertical && (
                              <Badge variant="secondary" className="text-xs">{event.vertical}</Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatDistanceToNow(new Date(event.created_at), {
                              addSuffix: true,
                              locale: isRu ? ru : enUS,
                            })}
                          </span>
                        </div>
                        {event.payload && Object.keys(event.payload).length > 0 && (
                          <div className="mt-1 text-xs text-muted-foreground font-mono bg-muted/50 rounded p-1.5 overflow-x-auto">
                            {JSON.stringify(event.payload, null, 0).slice(0, 120)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {(!data?.events || data.events.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {isRu ? 'Нет событий для этого пользователя' : 'No events for this user'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
