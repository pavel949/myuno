import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Target, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  useCampaigns,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  useDuplicateCampaign,
  useToggleCampaignStatus,
  useLaunchCampaign,
  useCompleteCampaign,
} from '@/hooks/useCampaignFactory';
import { CampaignFormSheet } from './CampaignFormSheet';
import { CampaignDetailSheet } from './CampaignDetailSheet';
import { CampaignCard } from './CampaignCard';
import type { Campaign, CampaignFormData, CampaignStatus, CampaignGoal } from '@/types/marketing';
import { GOAL_LABELS, STATUS_LABELS } from '@/types/marketing';

export function MCCCampaignsTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Filters
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [goalFilter, setGoalFilter] = useState<CampaignGoal | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sheet states
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Queries and mutations
  const { data: campaigns, isLoading } = useCampaigns({
    status: statusFilter,
    goal: goalFilter,
    search: searchQuery || undefined,
  });

  const createMutation = useCreateCampaign();
  const updateMutation = useUpdateCampaign();
  const deleteMutation = useDeleteCampaign();
  const duplicateMutation = useDuplicateCampaign();
  const toggleStatusMutation = useToggleCampaignStatus();
  const launchMutation = useLaunchCampaign();
  const completeMutation = useCompleteCampaign();

  // Handlers
  const handleCreate = () => {
    setSelectedCampaign(null);
    setFormOpen(true);
  };

  const handleEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setFormOpen(true);
  };

  const handleView = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setDetailOpen(true);
  };

  const handleFormSubmit = async (data: CampaignFormData) => {
    if (selectedCampaign) {
      await updateMutation.mutateAsync({ id: selectedCampaign.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setFormOpen(false);
    setSelectedCampaign(null);
  };

  const handleToggleStatus = (campaign: Campaign) => {
    toggleStatusMutation.mutate(campaign);
  };

  const handleLaunch = (id: string) => {
    launchMutation.mutate(id);
  };

  const handleComplete = (id: string) => {
    completeMutation.mutate(id);
    setDetailOpen(false);
  };

  const handleDuplicate = (id: string) => {
    duplicateMutation.mutate(id);
    setDetailOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(isRu ? 'Удалить кампанию?' : 'Delete this campaign?')) {
      deleteMutation.mutate(id);
    }
  };

  const isFormLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            {isRu ? 'Кампании' : 'Campaigns'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Управляйте маркетинговыми кампаниями' : 'Manage your marketing campaigns'}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {isRu ? 'Новая кампания' : 'New Campaign'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isRu ? 'Поиск кампаний...' : 'Search campaigns...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as CampaignStatus | 'all')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={isRu ? 'Статус' : 'Status'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRu ? 'Все статусы' : 'All Statuses'}</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, labels]) => (
              <SelectItem key={value} value={value}>
                {isRu ? labels.ru : labels.en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={goalFilter} onValueChange={(v) => setGoalFilter(v as CampaignGoal | 'all')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={isRu ? 'Цель' : 'Goal'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRu ? 'Все цели' : 'All Goals'}</SelectItem>
            {Object.entries(GOAL_LABELS).map(([value, labels]) => (
              <SelectItem key={value} value={value}>
                {isRu ? labels.ru : labels.en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Campaign Grid */}
      {!isLoading && campaigns && campaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onEdit={handleEdit}
              onView={handleView}
              onToggleStatus={handleToggleStatus}
              onLaunch={handleLaunch}
              onComplete={handleComplete}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!campaigns || campaigns.length === 0) && (
        <Card className="p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Target className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-2">
            {isRu ? 'Нет кампаний' : 'No campaigns yet'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {isRu ? 'Создайте первую маркетинговую кампанию' : 'Create your first marketing campaign'}
          </p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {isRu ? 'Создать кампанию' : 'Create Campaign'}
          </Button>
        </Card>
      )}

      {/* Form Sheet */}
      <CampaignFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        campaign={selectedCampaign}
        onSubmit={handleFormSubmit}
        isLoading={isFormLoading}
      />

      {/* Detail Sheet */}
      <CampaignDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        campaign={selectedCampaign}
        onEdit={(c) => {
          setDetailOpen(false);
          handleEdit(c);
        }}
        onToggleStatus={(c) => {
          handleToggleStatus(c);
        }}
        onComplete={handleComplete}
        onDuplicate={handleDuplicate}
      />
    </div>
  );
}
