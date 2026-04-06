import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { statusConfig, priorityConfig, useUpdateProspect, useScoreProspect, useGenerateOutreach, useLogActivity, type VendorProspect } from '@/hooks/useVendorAcquisition';
import { supabase } from '@/integrations/supabase/client';
import { useMyCompanyId } from '@/hooks/useAgentDeals';
import { 
  MapPin, Phone, Mail, Globe, Instagram, Star, 
  Send, Bot, Copy, MessageSquare, UserPlus,
  Sparkles, Loader2, Facebook
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface VendorProspectDetailProps {
  prospect: VendorProspect;
  open: boolean;
  onClose: () => void;
}

export function VendorProspectDetail({ prospect, open, onClose }: VendorProspectDetailProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { toast } = useToast();
  
  const updateProspect = useUpdateProspect();
  const scoreProspect = useScoreProspect();
  const generateOutreach = useGenerateOutreach();
  const logActivity = useLogActivity();
  const { data: myCompany } = useMyCompanyId();
  
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [isConvertingToCrm, setIsConvertingToCrm] = useState(false);
  const [noteText, setNoteText] = useState('');

  const handleStatusChange = (newStatus: string) => {
    updateProspect.mutate({ 
      id: prospect.id, 
      status: newStatus
    });
  };

  const handleGenerateOutreach = async () => {
    setIsGenerating(true);
    try {
      const result = await generateOutreach.mutateAsync({
        prospectId: prospect.id,
        channel: 'whatsapp',
        language: isRussian ? 'ru' : 'en',
        stage: prospect.status
      });
      setGeneratedMessage(result.message || '');
      toast({
        title: isRussian ? 'Сообщение сгенерировано' : 'Message generated',
      });
    } catch (error) {
      toast({
        title: isRussian ? 'Ошибка генерации' : 'Generation failed',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleScoreProspect = async () => {
    setIsScoring(true);
    try {
      await scoreProspect.mutateAsync(prospect.id);
      toast({
        title: isRussian ? 'Оценка обновлена' : 'Score updated',
      });
    } catch (error) {
      toast({
        title: isRussian ? 'Ошибка оценки' : 'Scoring failed',
        variant: 'destructive'
      });
    } finally {
      setIsScoring(false);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(generatedMessage);
    toast({
      title: isRussian ? 'Скопировано' : 'Copied',
    });
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    logActivity.mutate({
      prospect_id: prospect.id,
      activity_type: 'note',
      new_value: noteText
    });
    setNoteText('');
    toast({
      title: isRussian ? 'Заметка добавлена' : 'Note added',
    });
  };

  const handleConvertToCrm = async () => {
    setIsConvertingToCrm(true);
    try {
      const nameParts = (prospect.contact_name || prospect.business_name || '').split(' ');
      const firstName = nameParts[0] || prospect.business_name;
      const lastName = nameParts.slice(1).join(' ') || '';

      // Check for duplicate by email or phone
      if (prospect.email) {
        const { data: byEmail } = await supabase
          .from('crm_contacts')
          .select('id, first_name')
          .eq('email', prospect.email)
          .maybeSingle();
        if (byEmail) {
          toast({
            title: isRussian ? 'Контакт уже в CRM' : 'Contact already in CRM',
            description: `${byEmail.first_name} (${prospect.email})`,
          });
          setIsConvertingToCrm(false);
          return;
        }
      }

      // Extract enriched data from source_data
      const sd = (prospect.source_data || {}) as Record<string, any>;
      const tags = [
        prospect.category,
        sd.price_tier,
        ...(sd.is_verified ? ['verified'] : []),
        'ai_discovery',
      ].filter(Boolean) as string[];

      // Rich CRM mapping
      const { error } = await supabase.from('crm_contacts').insert({
        first_name: firstName,
        last_name: lastName || null,
        email: prospect.email,
        phone: prospect.phone,
        whatsapp: prospect.whatsapp || prospect.phone,
        instagram: prospect.instagram,
        facebook: prospect.facebook,
        website: prospect.website,
        company_name: prospect.business_name,
        contact_type: 'vendor',
        source: 'ai_discovery',
        lead_score: prospect.ai_score,
        lead_temperature: prospect.ai_priority === 'hot' ? 'hot' : prospect.ai_priority === 'warm' ? 'warm' : 'cold',
        address_city: prospect.city || 'Phuket',
        address_street: prospect.address,
        tags,
        notes: [
          `[Supplier Discovery] ${prospect.business_name}`,
          prospect.category ? `Category: ${prospect.category}` : null,
          `AI Score: ${prospect.ai_score || 'N/A'}`,
          prospect.ai_reasoning,
          sd.services_offered?.length ? `Services: ${sd.services_offered.join(', ')}` : null,
          sd.working_hours ? `Hours: ${sd.working_hours}` : null,
          sd.description_ru ? `RU: ${sd.description_ru}` : null,
        ].filter(Boolean).join(' | '),
        lifecycle_stage: 'lead',
      } as any);

      if (error) throw error;

      // Mark prospect as converted
      updateProspect.mutate({ id: prospect.id, status: 'won' });

      toast({
        title: isRussian ? 'Контакт добавлен в CRM' : 'Contact added to CRM',
        description: `${firstName} ${lastName} — ${tags.join(', ')}`,
      });
    } catch (error: any) {
      toast({
        title: isRussian ? 'Ошибка добавления в CRM' : 'Failed to add to CRM',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsConvertingToCrm(false);
    }
  };

  const status = statusConfig[prospect.status];
  const priority = priorityConfig[prospect.ai_priority || ''];
  const location = prospect.district || prospect.address || prospect.city;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary">
                {prospect.business_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg">{prospect.business_name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1">
                {prospect.category && (
                  <Badge variant="outline" className="text-xs">{prospect.category}</Badge>
                )}
                {prospect.ai_score !== null && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Star className="h-3 w-3 text-warning" />
                    {prospect.ai_score}
                  </Badge>
                )}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Status selector */}
        <div className="pb-4">
          <label className="text-xs text-muted-foreground mb-1 block">
            {isRussian ? 'Статус' : 'Status'}
          </label>
          <Select value={prospect.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  <span className={cfg.color}>
                    {isRussian ? cfg.labelRu : cfg.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority badge */}
        {priority && (
          <div className="pb-4">
            <Badge className={cn(priority.bgColor, priority.color)}>
              {priority.label}
            </Badge>
          </div>
        )}

        {/* Convert to CRM button */}
        {!prospect.converted_provider_id && (
          <div className="pb-4">
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={handleConvertToCrm}
              disabled={isConvertingToCrm}
            >
              {isConvertingToCrm ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              {isRussian ? 'Добавить в CRM' : 'Add to CRM'}
            </Button>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="info">{isRussian ? 'Инфо' : 'Info'}</TabsTrigger>
            <TabsTrigger value="outreach">{isRussian ? 'Outreach' : 'Outreach'}</TabsTrigger>
            <TabsTrigger value="notes">{isRussian ? 'Заметки' : 'Notes'}</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4 mt-4">
            {/* Contact info */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{isRussian ? 'Контакты' : 'Contacts'}</h4>
              <div className="space-y-2 text-sm">
                {prospect.phone && (
                  <a href={`tel:${prospect.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <Phone className="h-4 w-4" />
                    {prospect.phone}
                  </a>
                )}
                {prospect.email && (
                  <a href={`mailto:${prospect.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <Mail className="h-4 w-4" />
                    {prospect.email}
                  </a>
                )}
                {prospect.website && (
                  <a href={prospect.website} target="_blank" rel="noopener" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <Globe className="h-4 w-4" />
                    {prospect.website}
                  </a>
                )}
                {prospect.instagram && (
                  <a href={`https://instagram.com/${prospect.instagram}`} target="_blank" rel="noopener" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <Instagram className="h-4 w-4" />
                    @{prospect.instagram}
                  </a>
                )}
                {prospect.facebook && (
                  <a href={prospect.facebook} target="_blank" rel="noopener" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </a>
                )}
                {location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {location}
                  </div>
                )}
              </div>
            </div>

            {/* AI Score section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">{isRussian ? 'AI Скоринг' : 'AI Scoring'}</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleScoreProspect}
                  disabled={isScoring}
                >
                  {isScoring ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-1" />
                      {isRussian ? 'Оценить' : 'Score'}
                    </>
                  )}
                </Button>
              </div>
              {prospect.ai_score !== null && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-primary">{prospect.ai_score}</div>
                    <div className="text-sm text-muted-foreground">
                      {prospect.ai_score >= 70 
                        ? (isRussian ? 'Высокий потенциал' : 'High potential')
                        : prospect.ai_score >= 40
                        ? (isRussian ? 'Средний потенциал' : 'Medium potential')
                        : (isRussian ? 'Низкий потенциал' : 'Low potential')}
                    </div>
                  </div>
                  {prospect.ai_reasoning && (
                    <p className="text-sm text-muted-foreground mt-2">{prospect.ai_reasoning}</p>
                  )}
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>{isRussian ? 'Источник' : 'Source'}</span>
                <span className="capitalize">{prospect.source_type?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span>{isRussian ? 'Добавлен' : 'Added'}</span>
                <span>{format(new Date(prospect.created_at), 'dd.MM.yyyy HH:mm')}</span>
              </div>
              {prospect.last_contact_at && (
                <div className="flex justify-between">
                  <span>{isRussian ? 'Последний контакт' : 'Last contact'}</span>
                  <span>{format(new Date(prospect.last_contact_at), 'dd.MM.yyyy HH:mm')}</span>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Outreach Tab */}
          <TabsContent value="outreach" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">{isRussian ? 'AI Outreach' : 'AI Outreach'}</h4>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleGenerateOutreach}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Bot className="h-4 w-4 mr-1" />
                      {isRussian ? 'Сгенерировать' : 'Generate'}
                    </>
                  )}
                </Button>
              </div>
              
              {generatedMessage && (
                <div className="space-y-2">
                  <Textarea 
                    value={generatedMessage}
                    onChange={(e) => setGeneratedMessage(e.target.value)}
                    rows={6}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyMessage}>
                      <Copy className="h-4 w-4 mr-1" />
                      {isRussian ? 'Копировать' : 'Copy'}
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href={`https://wa.me/${prospect.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(generatedMessage)}`}
                        target="_blank"
                        rel="noopener"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        WhatsApp
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Textarea 
                placeholder={isRussian ? 'Добавить заметку...' : 'Add a note...'}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
              />
              <Button 
                size="sm" 
                onClick={handleAddNote}
                disabled={!noteText.trim() || logActivity.isPending}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                {isRussian ? 'Добавить' : 'Add'}
              </Button>
            </div>

            {/* Notes from prospect */}
            {prospect.notes && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="text-muted-foreground">{prospect.notes}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
