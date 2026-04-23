/**
 * VendorProspectPanel — Inline detail panel for desktop (replaces Sheet on lg+).
 * Shows prospect info, status controls, and quick actions without full navigation.
 */
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PanelSection } from '@/components/uno/PersistentPanelLayout';
import { 
  statusConfig, priorityConfig, 
  useUpdateProspect, useScoreProspect, useLogActivity,
  type VendorProspect 
} from '@/hooks/useVendorAcquisition';
import { 
  MapPin, Phone, Mail, Globe, Instagram, Star,
  MessageSquare, Sparkles, Loader2, Facebook, Send
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

import { toast } from 'sonner';
interface VendorProspectPanelProps {
  prospect: VendorProspect;
}

export function VendorProspectPanel({ prospect }: VendorProspectPanelProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
const updateProspect = useUpdateProspect();
  const scoreProspect = useScoreProspect();
  const logActivity = useLogActivity();
  
  const [isScoring, setIsScoring] = useState(false);
  const [noteText, setNoteText] = useState('');

  const status = statusConfig[prospect.status];
  const priority = priorityConfig[prospect.ai_priority || ''];
  const location = prospect.district || prospect.address || prospect.city;

  const handleStatusChange = (newStatus: string) => {
    updateProspect.mutate({ id: prospect.id, status: newStatus });
  };

  const handleScore = async () => {
    setIsScoring(true);
    try {
      await scoreProspect.mutateAsync(prospect.id);
      toast(isRu ? 'Оценка обновлена' : 'Score updated');
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Failed');
    } finally {
      setIsScoring(false);
    }
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    logActivity.mutate({ prospect_id: prospect.id, activity_type: 'note', new_value: noteText });
    setNoteText('');
    toast(isRu ? 'Заметка добавлена' : 'Note added');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {prospect.business_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{prospect.business_name}</h3>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {prospect.category && (
              <Badge variant="outline" className="text-[10px] h-5">{prospect.category}</Badge>
            )}
            {prospect.ai_score !== null && (
              <Badge variant="secondary" className="text-[10px] h-5 gap-0.5">
                <Star className="h-2.5 w-2.5 text-warning" />
                {prospect.ai_score}
              </Badge>
            )}
            {priority && (
              <Badge className={cn(priority.bgColor, priority.color, "text-[10px] h-5")}>
                {priority.label}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Status */}
      <PanelSection title={isRu ? 'Статус' : 'Status'}>
        <Select value={prospect.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>
                <span className={cfg.color}>
                  {isRu ? cfg.labelRu : cfg.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PanelSection>

      {/* Contacts */}
      <PanelSection title={isRu ? 'Контакты' : 'Contacts'}>
        <div className="space-y-1.5 text-xs">
          {prospect.phone && (
            <a href={`tel:${prospect.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{prospect.phone}</span>
            </a>
          )}
          {prospect.email && (
            <a href={`mailto:${prospect.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{prospect.email}</span>
            </a>
          )}
          {prospect.website && (
            <a href={prospect.website} target="_blank" rel="noopener" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Globe className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{prospect.website}</span>
            </a>
          )}
          {prospect.instagram && (
            <a href={`https://instagram.com/${prospect.instagram}`} target="_blank" rel="noopener" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Instagram className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">@{prospect.instagram}</span>
            </a>
          )}
          {prospect.facebook && (
            <a href={prospect.facebook} target="_blank" rel="noopener" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Facebook className="h-3.5 w-3.5 shrink-0" />
              Facebook
            </a>
          )}
          {location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>
      </PanelSection>

      {/* AI Scoring */}
      <PanelSection 
        title={isRu ? 'AI Скоринг' : 'AI Score'}
        actions={
          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={handleScore} disabled={isScoring}>
            {isScoring ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          </Button>
        }
      >
        {prospect.ai_score !== null ? (
          <div className="bg-muted/50 rounded-none p-2">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">{prospect.ai_score}</span>
              <span className="text-[10px] text-muted-foreground">
                {prospect.ai_score >= 70 
                  ? (isRu ? 'Высокий' : 'High')
                  : prospect.ai_score >= 40
                  ? (isRu ? 'Средний' : 'Medium')
                  : (isRu ? 'Низкий' : 'Low')}
              </span>
            </div>
            {prospect.ai_reasoning && (
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-3">{prospect.ai_reasoning}</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{isRu ? 'Не оценён' : 'Not scored'}</p>
        )}
      </PanelSection>

      {/* Quick actions */}
      <PanelSection title={isRu ? 'Действия' : 'Actions'}>
        <div className="flex gap-2">
          {prospect.phone && (
            <Button variant="outline" size="sm" className="h-7 text-xs flex-1" asChild>
              <a href={`https://wa.me/${prospect.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener">
                <Send className="h-3 w-3 mr-1" />
                WhatsApp
              </a>
            </Button>
          )}
          {prospect.phone && (
            <Button variant="outline" size="sm" className="h-7 text-xs flex-1" asChild>
              <a href={`tel:${prospect.phone}`}>
                <Phone className="h-3 w-3 mr-1" />
                {isRu ? 'Звонок' : 'Call'}
              </a>
            </Button>
          )}
        </div>
      </PanelSection>

      {/* Quick note */}
      <PanelSection title={isRu ? 'Заметка' : 'Note'}>
        <div className="space-y-1.5">
          <Textarea 
            placeholder={isRu ? 'Добавить заметку...' : 'Add a note...'}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={2}
            className="text-xs resize-none"
          />
          <Button 
            size="sm" 
            className="h-7 text-xs w-full"
            onClick={handleAddNote}
            disabled={!noteText.trim() || logActivity.isPending}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            {isRu ? 'Добавить' : 'Add'}
          </Button>
        </div>
      </PanelSection>

      {/* Metadata */}
      <div className="text-[10px] text-muted-foreground space-y-1 pt-2 border-t">
        <div className="flex justify-between">
          <span>{isRu ? 'Источник' : 'Source'}</span>
          <span className="capitalize">{prospect.source_type?.replace('_', ' ')}</span>
        </div>
        <div className="flex justify-between">
          <span>{isRu ? 'Добавлен' : 'Added'}</span>
          <span>{format(new Date(prospect.created_at), 'dd.MM.yy HH:mm')}</span>
        </div>
        {prospect.last_contact_at && (
          <div className="flex justify-between">
            <span>{isRu ? 'Посл. контакт' : 'Last contact'}</span>
            <span>{format(new Date(prospect.last_contact_at), 'dd.MM.yy')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
