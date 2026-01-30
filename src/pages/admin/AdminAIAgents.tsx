import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAIAgents, useCreateAgent, useDeleteAgent, type AIAgent } from '@/hooks/useAIAgents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Bot, 
  Building2, 
  Search, 
  MessageCircle, 
  Sparkles,
  Users,
  Settings,
  MoreVertical,
  Trash2,
  Edit,
  Play,
  Pause,
  BarChart3
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUpdateAgent } from '@/hooks/useAIAgents';

// AI Insights Components
import { AIInsightsOverview } from '@/components/admin/ai-insights/AIInsightsOverview';
import { AIROIReport } from '@/components/admin/ai-insights/AIROIReport';
import { AIWeeklySummary } from '@/components/admin/ai-insights/AIWeeklySummary';

const iconMap: Record<string, React.ElementType> = {
  Bot,
  Building2,
  Search,
  MessageCircle,
  Sparkles,
  Users,
  Settings,
};

function AgentCard({ agent, onEdit, onDelete, onToggleActive }: { 
  agent: AIAgent; 
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const IconComponent = iconMap[agent.icon] || Bot;
  
  const audienceLabels: Record<string, string> = {
    owner: isRussian ? 'Владельцы' : 'Owners',
    guest: isRussian ? 'Гости' : 'Guests',
    user: isRussian ? 'Пользователи' : 'Users',
    provider: isRussian ? 'Провайдеры' : 'Providers',
  };

  return (
    <Card className={`transition-all hover:shadow-md ${!agent.is_active ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${agent.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">
                {isRussian ? agent.name_ru : agent.name_en}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {agent.slug}
              </CardDescription>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                {isRussian ? 'Редактировать' : 'Edit'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleActive}>
                {agent.is_active ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    {isRussian ? 'Деактивировать' : 'Deactivate'}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    {isRussian ? 'Активировать' : 'Activate'}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                {isRussian ? 'Удалить' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {isRussian ? agent.description_ru : agent.description_en}
        </p>
        
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={agent.is_active ? 'default' : 'secondary'} className="text-xs">
            {agent.is_active 
              ? (isRussian ? 'Активен' : 'Active') 
              : (isRussian ? 'Неактивен' : 'Inactive')
            }
          </Badge>
          {agent.target_audience.map((audience) => (
            <Badge key={audience} variant="outline" className="text-xs">
              {audienceLabels[audience] || audience}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>{agent.model.split('/')[1] || agent.model}</span>
          <span>T: {agent.temperature}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminAIAgents() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const navigate = useNavigate();
  
  const { data: agents, isLoading } = useAIAgents();
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [agentToDelete, setAgentToDelete] = React.useState<AIAgent | null>(null);

  const handleCreateAgent = async () => {
    const newAgent = await createAgent.mutateAsync({
      slug: `agent-${Date.now()}`,
      name_en: 'New Agent',
      name_ru: 'Новый агент',
      description_en: 'Description',
      description_ru: 'Описание',
      icon: 'Bot',
      is_active: false,
      target_audience: ['user'],
    });
    navigate(`/admin/ai-agents/${newAgent.id}`);
  };

  const handleEdit = (agent: AIAgent) => {
    navigate(`/admin/ai-agents/${agent.id}`);
  };

  const handleToggleActive = (agent: AIAgent) => {
    updateAgent.mutate({ id: agent.id, is_active: !agent.is_active });
  };

  const handleDeleteClick = (agent: AIAgent) => {
    setAgentToDelete(agent);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (agentToDelete) {
      deleteAgent.mutate(agentToDelete.id);
    }
    setDeleteDialogOpen(false);
    setAgentToDelete(null);
  };

  const activeAgents = agents?.filter(a => a.is_active) || [];
  const inactiveAgents = agents?.filter(a => !a.is_active) || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            {isRussian ? 'AI Агенты' : 'AI Agents'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRussian 
              ? 'Управление AI-ассистентами и аналитика' 
              : 'Manage AI assistants & analytics'}
          </p>
        </div>
        <Button onClick={handleCreateAgent} disabled={createAgent.isPending}>
          <Plus className="h-4 w-4 mr-2" />
          {isRussian ? 'Создать агента' : 'Create Agent'}
        </Button>
      </div>

      {/* Tabs for Agents vs Insights */}
      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents" className="gap-2">
            <Bot className="w-4 h-4" />
            {isRussian ? 'Агенты' : 'Agents'}
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            {isRussian ? 'Аналитика' : 'Insights'}
          </TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-6">
          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <Skeleton className="h-5 w-32 mt-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Active Agents */}
          {!isLoading && activeAgents.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                {isRussian ? 'Активные агенты' : 'Active Agents'} ({activeAgents.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeAgents.map((agent) => (
                  <AgentCard 
                    key={agent.id} 
                    agent={agent}
                    onEdit={() => handleEdit(agent)}
                    onDelete={() => handleDeleteClick(agent)}
                    onToggleActive={() => handleToggleActive(agent)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Inactive Agents */}
          {!isLoading && inactiveAgents.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                {isRussian ? 'Неактивные агенты' : 'Inactive Agents'} ({inactiveAgents.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inactiveAgents.map((agent) => (
                  <AgentCard 
                    key={agent.id} 
                    agent={agent}
                    onEdit={() => handleEdit(agent)}
                    onDelete={() => handleDeleteClick(agent)}
                    onToggleActive={() => handleToggleActive(agent)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && agents?.length === 0 && (
            <Card className="p-12 text-center">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">
                {isRussian ? 'Нет агентов' : 'No Agents'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {isRussian 
                  ? 'Создайте первого AI-агента для вашей платформы' 
                  : 'Create your first AI agent for the platform'}
              </p>
              <Button onClick={handleCreateAgent}>
                <Plus className="h-4 w-4 mr-2" />
                {isRussian ? 'Создать агента' : 'Create Agent'}
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Insights Tab - Phase J */}
        <TabsContent value="insights" className="space-y-6">
          {/* Overview + Weekly Summary Row */}
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <AIInsightsOverview />
            </div>
            <div>
              <AIWeeklySummary />
            </div>
          </div>
          
          {/* ROI Report */}
          <AIROIReport />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRussian ? 'Удалить агента?' : 'Delete Agent?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRussian 
                ? `Агент "${agentToDelete?.name_ru}" будет удалён вместе со всей историей. Это действие нельзя отменить.`
                : `Agent "${agentToDelete?.name_en}" will be deleted along with all history. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {isRussian ? 'Отмена' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              {isRussian ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
