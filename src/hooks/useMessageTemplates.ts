import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MessageTemplate {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  subject: string | null;
  subject_ru: string | null;
  body: string;
  body_ru: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TemplateCategory = 
  | 'welcome'
  | 'check_in'
  | 'check_out'
  | 'house_rules'
  | 'directions'
  | 'amenities'
  | 'emergency'
  | 'thank_you'
  | 'custom';

export const TEMPLATE_CATEGORIES: { value: TemplateCategory; labelEn: string; labelRu: string; icon: string }[] = [
  { value: 'welcome', labelEn: 'Welcome', labelRu: 'Приветствие', icon: '👋' },
  { value: 'check_in', labelEn: 'Check-in', labelRu: 'Заезд', icon: '🔑' },
  { value: 'check_out', labelEn: 'Check-out', labelRu: 'Выезд', icon: '🚪' },
  { value: 'house_rules', labelEn: 'House Rules', labelRu: 'Правила', icon: '📋' },
  { value: 'directions', labelEn: 'Directions', labelRu: 'Как добраться', icon: '🗺️' },
  { value: 'amenities', labelEn: 'Amenities', labelRu: 'Удобства', icon: '🏠' },
  { value: 'emergency', labelEn: 'Emergency', labelRu: 'Экстренные', icon: '🚨' },
  { value: 'thank_you', labelEn: 'Thank You', labelRu: 'Благодарность', icon: '💝' },
  { value: 'custom', labelEn: 'Custom', labelRu: 'Свой', icon: '✏️' },
];

// Default quick replies (not saved to DB, always available)
export const DEFAULT_QUICK_REPLIES = [
  { id: 'qr-1', labelEn: 'Thank you!', labelRu: 'Спасибо!', body: 'Thank you!', bodyRu: 'Спасибо!' },
  { id: 'qr-2', labelEn: 'One moment...', labelRu: 'Одну минуту...', body: 'One moment, I\'ll check and get back to you.', bodyRu: 'Одну минуту, проверю и отвечу.' },
  { id: 'qr-3', labelEn: 'Sure!', labelRu: 'Конечно!', body: 'Sure, no problem!', bodyRu: 'Конечно, без проблем!' },
  { id: 'qr-4', labelEn: 'Contact manager', labelRu: 'Свяжитесь с менеджером', body: 'Please contact our UNO manager for assistance.', bodyRu: 'Пожалуйста, свяжитесь с менеджером UNO для помощи.' },
];

export function useMessageTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['message-templates', user?.id];

  const { data: templates, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('owner_id', user.id)
        .eq('is_active', true)
        .order('category')
        .order('name');

      if (error) throw error;
      return data as MessageTemplate[];
    },
    enabled: !!user,
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Omit<MessageTemplate, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('message_templates')
        .insert({
          ...template,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Template created');
    },
    onError: (error) => {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MessageTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('message_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Template updated');
    },
    onError: (error) => {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('message_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Template deleted');
    },
    onError: (error) => {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    },
  });

  const getTemplatesByCategory = (category: TemplateCategory) => {
    return templates?.filter(t => t.category === category) || [];
  };

  return {
    templates: templates || [],
    isLoading,
    createTemplate: createTemplate.mutateAsync,
    updateTemplate: updateTemplate.mutateAsync,
    deleteTemplate: deleteTemplate.mutateAsync,
    isCreating: createTemplate.isPending,
    isUpdating: updateTemplate.isPending,
    isDeleting: deleteTemplate.isPending,
    getTemplatesByCategory,
  };
}
