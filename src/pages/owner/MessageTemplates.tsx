import React, { useState } from 'react';
import { logger } from '@/lib/logger';
import { Plus, Edit2, Trash2, FileText, Save } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useMessageTemplates, TEMPLATE_CATEGORIES, TemplateCategory, MessageTemplate } from '@/hooks/useMessageTemplates';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { cn } from '@/lib/utils';

interface TemplateFormData {
  name: string;
  category: TemplateCategory;
  body: string;
  body_ru: string;
}

const defaultFormData: TemplateFormData = {
  name: '',
  category: 'custom',
  body: '',
  body_ru: '',
};

export default function MessageTemplates() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate, isCreating, isUpdating } = useMessageTemplates();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(defaultFormData);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {isRu ? 'Шаблоны сообщений' : 'Message Templates'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isRu ? 'Войдите для управления шаблонами' : 'Sign in to manage templates'}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {isRu ? 'Войти' : 'Sign In'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category as TemplateCategory,
      body: template.body,
      body_ru: template.body_ru || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.body) return;

    try {
      if (editingTemplate) {
        await updateTemplate({
          id: editingTemplate.id,
          name: formData.name,
          category: formData.category,
          body: formData.body,
          body_ru: formData.body_ru || null,
        });
      } else {
        await createTemplate({
          name: formData.name,
          category: formData.category,
          body: formData.body,
          body_ru: formData.body_ru || null,
          subject: null,
          subject_ru: null,
          is_default: false,
          is_active: true,
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      logger.error('Error saving template:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isRu ? 'Удалить шаблон?' : 'Delete template?')) return;
    await deleteTemplate(id);
  };

  const filteredTemplates = activeCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === activeCategory);

  const getCategoryInfo = (category: string) => {
    return TEMPLATE_CATEGORIES.find(c => c.value === category) || TEMPLATE_CATEGORIES.find(c => c.value === 'custom')!;
  };

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Шаблоны сообщений' : 'Message Templates'}
        subtitle={isRu ? 'Быстрые ответы для чата с гостями' : 'Quick replies for guest chat'}
        showBack
        fallbackPath="/owner"
      />

      <div className="flex justify-end mb-4">
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {isRu ? 'Создать шаблон' : 'Create Template'}
        </Button>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-4">
        <TabsList className="w-full flex-wrap h-auto p-1">
          <TabsTrigger value="all" className="text-xs">
            {isRu ? 'Все' : 'All'}
          </TabsTrigger>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value} className="text-xs">
              <span className="mr-1">{cat.icon}</span>
              {isRu ? cat.labelRu : cat.labelEn}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">
              {isRu ? 'Нет шаблонов' : 'No Templates'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isRu 
                ? 'Создайте шаблоны для быстрых ответов гостям'
                : 'Create templates for quick guest replies'}
            </p>
            <Button variant="outline" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              {isRu ? 'Создать первый шаблон' : 'Create First Template'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTemplates.map((template) => {
            const catInfo = getCategoryInfo(template.category);
            return (
              <Card key={template.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{catInfo.icon}</span>
                        <h3 className="font-medium truncate">{template.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                          {isRu ? catInfo.labelRu : catInfo.labelEn}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {isRu && template.body_ru ? template.body_ru : template.body}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(template)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate 
                ? (isRu ? 'Редактировать шаблон' : 'Edit Template')
                : (isRu ? 'Новый шаблон' : 'New Template')
              }
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isRu ? 'Название' : 'Name'}</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={isRu ? 'Например: Инструкции по заезду' : 'E.g.: Check-in instructions'}
              />
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Категория' : 'Category'}</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as TemplateCategory }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{isRu ? cat.labelRu : cat.labelEn}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Текст (English)' : 'Text (English)'}</Label>
              <Textarea
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                placeholder={isRu ? 'Текст сообщения на английском...' : 'Message text in English...'}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Текст (Русский)' : 'Text (Russian)'}</Label>
              <Textarea
                value={formData.body_ru}
                onChange={(e) => setFormData(prev => ({ ...prev, body_ru: e.target.value }))}
                placeholder={isRu ? 'Текст сообщения на русском...' : 'Message text in Russian...'}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.name || !formData.body || isCreating || isUpdating}
            >
              <Save className="h-4 w-4 mr-2" />
              {isRu ? 'Сохранить' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
