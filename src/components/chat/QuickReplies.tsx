import React, { useState } from 'react';
import { Zap, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMessageTemplates, DEFAULT_QUICK_REPLIES, TEMPLATE_CATEGORIES, TemplateCategory } from '@/hooks/useMessageTemplates';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface QuickRepliesProps {
  onSelect: (message: string) => void;
  disabled?: boolean;
}

export const QuickReplies: React.FC<QuickRepliesProps> = ({ onSelect, disabled }) => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { templates, isLoading } = useMessageTemplates();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'quick'>('quick');

  const handleSelect = (message: string) => {
    onSelect(message);
    setIsOpen(false);
  };

  // Group templates by category
  const templatesByCategory = TEMPLATE_CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = templates.filter(t => t.category === cat.value);
    return acc;
  }, {} as Record<TemplateCategory, typeof templates>);

  const categoriesWithTemplates = TEMPLATE_CATEGORIES.filter(
    cat => templatesByCategory[cat.value]?.length > 0
  );

  return (
    <div className="flex items-center gap-2">
      {/* Quick reply chips (always visible) */}
      <ScrollArea className="flex-1 max-w-[calc(100%-48px)]">
        <div className="flex gap-1.5 pb-1">
          {DEFAULT_QUICK_REPLIES.map((reply) => (
            <button
              key={reply.id}
              onClick={() => handleSelect(isRu ? reply.bodyRu : reply.body)}
              disabled={disabled}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full",
                "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
                "transition-colors whitespace-nowrap",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {isRu ? reply.labelRu : reply.labelEn}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Templates popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-8 w-8"
            disabled={disabled}
          >
            <FileText className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-3 border-b">
            <h4 className="font-medium text-sm">
              {isRu ? 'Шаблоны сообщений' : 'Message Templates'}
            </h4>
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Выберите шаблон для быстрого ответа' : 'Select a template for quick reply'}
            </p>
          </div>

          <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as typeof activeCategory)}>
            <div className="border-b px-2">
              <ScrollArea className="w-full">
                <TabsList className="h-10 w-max bg-transparent p-0">
                  <TabsTrigger 
                    value="quick" 
                    className="text-xs data-[state=active]:bg-secondary rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    {isRu ? 'Быстрые' : 'Quick'}
                  </TabsTrigger>
                  {categoriesWithTemplates.map((cat) => (
                    <TabsTrigger
                      key={cat.value}
                      value={cat.value}
                      className="text-xs data-[state=active]:bg-secondary rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                    >
                      <span className="mr-1">{cat.icon}</span>
                      {isRu ? cat.labelRu : cat.labelEn}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>

            <ScrollArea className="h-[200px]">
              <TabsContent value="quick" className="m-0 p-2">
                <div className="space-y-1">
                  {DEFAULT_QUICK_REPLIES.map((reply) => (
                    <button
                      key={reply.id}
                      onClick={() => handleSelect(isRu ? reply.bodyRu : reply.body)}
                      className="w-full text-left p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <p className="text-sm font-medium">{isRu ? reply.labelRu : reply.labelEn}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {isRu ? reply.bodyRu : reply.body}
                      </p>
                    </button>
                  ))}
                </div>
              </TabsContent>

              {categoriesWithTemplates.map((cat) => (
                <TabsContent key={cat.value} value={cat.value} className="m-0 p-2">
                  <div className="space-y-1">
                    {templatesByCategory[cat.value].map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleSelect(isRu && template.body_ru ? template.body_ru : template.body)}
                        className="w-full text-left p-2 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <p className="text-sm font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {isRu && template.body_ru ? template.body_ru : template.body}
                        </p>
                      </button>
                    ))}
                  </div>
                </TabsContent>
              ))}

              {templates.length === 0 && activeCategory !== 'quick' && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {isRu 
                    ? 'Нет шаблонов. Создайте их в настройках.'
                    : 'No templates. Create them in settings.'}
                </div>
              )}
            </ScrollArea>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
};
