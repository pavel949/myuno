import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  useAIAgent, 
  useUpdateAgent, 
  useSaveKnowledge, 
  usePublishKnowledge,
  useAIAgentStats,
  type AIAgentKnowledge 
} from '@/hooks/useAIAgents';
import { AIAgentLogsPanel } from '@/components/admin/ai-agents/AIAgentLogsPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft,
  Save,
  Send,
  History,
  BarChart3,
  Settings,
  BookOpen,
  MessageSquare,
  Check,
  Clock,
  Star,
  ScrollText
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

const MODELS = [
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash (быстрый)' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro (мощный)' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini' },
  { value: 'openai/gpt-5', label: 'GPT-5 (мощный)' },
];

const TONES = [
  { value: 'professional', label: 'Профессиональный' },
  { value: 'friendly', label: 'Дружелюбный' },
  { value: 'helpful', label: 'Помогающий' },
  { value: 'concise', label: 'Краткий' },
  { value: 'expert', label: 'Экспертный' },
];

const ICONS = ['Bot', 'Building2', 'Search', 'MessageCircle', 'Sparkles', 'Users', 'Settings'];

export default function AdminAIAgentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  
  const { data: agent, isLoading } = useAIAgent(id);
  const { data: stats } = useAIAgentStats(id);
  const updateAgent = useUpdateAgent();
  const saveKnowledge = useSaveKnowledge();
  const publishKnowledge = usePublishKnowledge();
  
  // Form state
  const [formData, setFormData] = useState({
    slug: '',
    name_en: '',
    name_ru: '',
    description_en: '',
    description_ru: '',
    icon: 'Bot',
    model: 'google/gemini-3-flash-preview',
    temperature: 0.7,
    max_tokens: 2000,
    is_active: false,
    is_public: true,
    tone: 'professional',
  });
  
  const [systemPrompt, setSystemPrompt] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [activeTab, setActiveTab] = useState('settings');
  
  // Load agent data
  useEffect(() => {
    if (agent) {
      setFormData({
        slug: agent.slug,
        name_en: agent.name_en,
        name_ru: agent.name_ru,
        description_en: agent.description_en || '',
        description_ru: agent.description_ru || '',
        icon: agent.icon,
        model: agent.model,
        temperature: Number(agent.temperature),
        max_tokens: agent.max_tokens,
        is_active: agent.is_active,
        is_public: agent.is_public,
        tone: agent.tone,
      });
      
      // Load latest knowledge version
      const latestKnowledge = agent.ai_agent_knowledge
        ?.sort((a, b) => b.version - a.version)[0];
      if (latestKnowledge) {
        setSystemPrompt(latestKnowledge.system_prompt);
        setKnowledgeBase(latestKnowledge.knowledge_base || '');
      }
    }
  }, [agent]);
  
  const handleSaveSettings = () => {
    if (!id) return;
    updateAgent.mutate({ id, ...formData });
  };
  
  const handleSaveDraft = () => {
    if (!id) return;
    saveKnowledge.mutate({
      agentId: id,
      systemPrompt,
      knowledgeBase,
      publish: false,
    });
  };
  
  const handlePublish = () => {
    if (!id) return;
    saveKnowledge.mutate({
      agentId: id,
      systemPrompt,
      knowledgeBase,
      publish: true,
    });
  };
  
  const handlePublishVersion = (knowledge: AIAgentKnowledge) => {
    if (!id) return;
    publishKnowledge.mutate({ knowledgeId: knowledge.id, agentId: id });
  };
  
  const publishedVersion = agent?.ai_agent_knowledge?.find(k => k.is_published);
  const versions = agent?.ai_agent_knowledge?.sort((a, b) => b.version - a.version) || [];

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-96" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-4 md:p-6">
        <p>{isRussian ? 'Агент не найден' : 'Agent not found'}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/ai-agents')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">
              {isRussian ? agent.name_ru : agent.name_en}
            </h1>
            <p className="text-muted-foreground text-sm">{agent.slug}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={agent.is_active ? 'default' : 'secondary'}>
            {agent.is_active ? (isRussian ? 'Активен' : 'Active') : (isRussian ? 'Неактивен' : 'Inactive')}
          </Badge>
          {publishedVersion && (
            <Badge variant="outline">v{publishedVersion.version}</Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <MessageSquare className="h-4 w-4" />
                {isRussian ? 'Сегодня' : 'Today'}
              </div>
              <p className="text-2xl font-bold mt-1">{stats.todaySessions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <BarChart3 className="h-4 w-4" />
                {isRussian ? 'Всего' : 'Total'}
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalSessions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="h-4 w-4" />
                {isRussian ? 'Ответ' : 'Response'}
              </div>
              <p className="text-2xl font-bold mt-1">{stats.avgResponseTime}ms</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Star className="h-4 w-4" />
                {isRussian ? 'Оценка' : 'Rating'}
              </div>
              <p className="text-2xl font-bold mt-1">
                {stats.avgRating > 0 ? stats.avgRating : '—'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            {isRussian ? 'Настройки' : 'Settings'}
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="gap-2">
            <BookOpen className="h-4 w-4" />
            {isRussian ? 'База знаний' : 'Knowledge'}
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <ScrollText className="h-4 w-4" />
            {isRussian ? 'Логи' : 'Logs'}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            {isRussian ? 'Версии' : 'Versions'}
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {isRussian ? 'Основные данные' : 'Basic Info'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Slug (ID)' : 'Slug (ID)'}</Label>
                    <Input 
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Иконка' : 'Icon'}</Label>
                    <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICONS.map((icon) => (
                          <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>{isRussian ? 'Название (EN)' : 'Name (EN)'}</Label>
                  <Input 
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>{isRussian ? 'Название (RU)' : 'Name (RU)'}</Label>
                  <Input 
                    value={formData.name_ru}
                    onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>{isRussian ? 'Описание (EN)' : 'Description (EN)'}</Label>
                  <Textarea 
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>{isRussian ? 'Описание (RU)' : 'Description (RU)'}</Label>
                  <Textarea 
                    value={formData.description_ru}
                    onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {isRussian ? 'Параметры AI' : 'AI Parameters'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{isRussian ? 'Модель' : 'Model'}</Label>
                  <Select value={formData.model} onValueChange={(v) => setFormData({ ...formData, model: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>{isRussian ? 'Тональность' : 'Tone'}</Label>
                  <Select value={formData.tone} onValueChange={(v) => setFormData({ ...formData, tone: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((tone) => (
                        <SelectItem key={tone.value} value={tone.value}>{tone.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{isRussian ? 'Температура' : 'Temperature'}</Label>
                    <span className="text-sm text-muted-foreground">{formData.temperature}</span>
                  </div>
                  <Slider 
                    value={[formData.temperature]}
                    onValueChange={([v]) => setFormData({ ...formData, temperature: v })}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                  <p className="text-xs text-muted-foreground">
                    {isRussian ? '0 = точный, 1 = креативный' : '0 = precise, 1 = creative'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>{isRussian ? 'Макс. токенов' : 'Max Tokens'}</Label>
                  <Input 
                    type="number"
                    value={formData.max_tokens}
                    onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) || 2000 })}
                  />
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <Label>{isRussian ? 'Активен' : 'Active'}</Label>
                    <p className="text-xs text-muted-foreground">
                      {isRussian ? 'Доступен пользователям' : 'Available to users'}
                    </p>
                  </div>
                  <Switch 
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                  />
                </div>
                
                <Button 
                  onClick={handleSaveSettings} 
                  disabled={updateAgent.isPending}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isRussian ? 'Сохранить настройки' : 'Save Settings'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Knowledge Tab */}
        <TabsContent value="knowledge" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {isRussian ? 'Системный промпт' : 'System Prompt'}
                </CardTitle>
                <CardDescription>
                  {isRussian 
                    ? 'Используйте {{KNOWLEDGE_BASE}} для вставки базы знаний' 
                    : 'Use {{KNOWLEDGE_BASE}} to inject knowledge base'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea 
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                  placeholder="You are a helpful assistant..."
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {isRussian ? 'База знаний' : 'Knowledge Base'}
                </CardTitle>
                <CardDescription>
                  {isRussian 
                    ? 'Markdown с данными, которые агент должен знать' 
                    : 'Markdown with data the agent should know'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea 
                  value={knowledgeBase}
                  onChange={(e) => setKnowledgeBase(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                  placeholder="# Knowledge Base..."
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={handleSaveDraft}
              disabled={saveKnowledge.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {isRussian ? 'Сохранить черновик' : 'Save Draft'}
            </Button>
            <Button 
              onClick={handlePublish}
              disabled={saveKnowledge.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {isRussian ? 'Опубликовать' : 'Publish'}
            </Button>
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-4">
          {id && <AIAgentLogsPanel agentId={id} />}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isRussian ? 'История версий' : 'Version History'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {versions.map((knowledge) => (
                    <div 
                      key={knowledge.id}
                      className={`p-4 rounded-lg border ${knowledge.is_published ? 'border-primary bg-primary/5' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={knowledge.is_published ? 'default' : 'outline'}>
                            v{knowledge.version}
                          </Badge>
                          {knowledge.is_published && (
                            <Badge variant="secondary" className="gap-1">
                              <Check className="h-3 w-3" />
                              {isRussian ? 'Опубликовано' : 'Published'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(knowledge.created_at).toLocaleString()}
                          </span>
                          {!knowledge.is_published && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handlePublishVersion(knowledge)}
                              disabled={publishKnowledge.isPending}
                            >
                              {isRussian ? 'Опубликовать' : 'Publish'}
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {knowledge.system_prompt.substring(0, 150)}...
                      </p>
                    </div>
                  ))}
                  
                  {versions.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      {isRussian ? 'Нет версий' : 'No versions yet'}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
