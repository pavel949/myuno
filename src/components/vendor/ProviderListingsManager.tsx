/**
 * ProviderListingsManager - Complete listing management with canonical wizard
 * 
 * Features:
 * - Tabs: Drafts, Active, On Moderation, Archived
 * - Canonical listing wizard integration
 * - P0-safe operations
 * - Proper status management
 */
import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { 
  Plus, 
  MoreVertical, 
  Edit, 
  Archive, 
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/uno/EmptyState';
import { CanonicalListingWizard, CategoryNode, CanonicalListingData } from './wizard';
import { toast } from 'sonner';

type ListingStatus = 'draft' | 'moderation' | 'active' | 'archived';

interface Listing {
  id: string;
  title_en: string;
  title_ru?: string;
  short_description_en?: string;
  cover_image?: string;
  base_price?: number;
  status: ListingStatus;
  category_id: string;
  created_at: string;
  updated_at: string;
}

interface ProviderListingsManagerProps {
  listings: Listing[];
  isLoading: boolean;
  categories: CategoryNode[];
  providerId: string;
  tableName: string;
  onRefetch: () => void;
  onStatusChange: (id: string, status: ListingStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const STATUS_CONFIG: Record<ListingStatus, {
  labelEn: string;
  labelRu: string;
  icon: React.ReactNode;
  color: string;
}> = {
  draft: {
    labelEn: 'Draft',
    labelRu: 'Черновик',
    icon: <FileText className="h-3 w-3" />,
    color: 'bg-muted text-muted-foreground',
  },
  moderation: {
    labelEn: 'On Moderation',
    labelRu: 'На модерации',
    icon: <Clock className="h-3 w-3" />,
    color: 'bg-warning/20 text-warning',
  },
  active: {
    labelEn: 'Active',
    labelRu: 'Активный',
    icon: <CheckCircle className="h-3 w-3" />,
    color: 'bg-success/20 text-success',
  },
  archived: {
    labelEn: 'Archived',
    labelRu: 'Архив',
    icon: <Archive className="h-3 w-3" />,
    color: 'bg-destructive/20 text-destructive',
  },
};

export function ProviderListingsManager({
  listings,
  isLoading,
  categories,
  providerId,
  tableName,
  onRefetch,
  onStatusChange,
  onDelete,
}: ProviderListingsManagerProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [activeTab, setActiveTab] = useState<ListingStatus | 'all'>('all');
  const [showWizard, setShowWizard] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Filter listings by status
  const filteredListings = useMemo(() => {
    if (activeTab === 'all') return listings;
    return listings.filter(l => l.status === activeTab);
  }, [listings, activeTab]);
  
  // Count by status
  const counts = useMemo(() => {
    const result: Record<string, number> = { all: listings.length };
    listings.forEach(l => {
      result[l.status] = (result[l.status] || 0) + 1;
    });
    return result;
  }, [listings]);
  
  const handleEdit = (listing: Listing) => {
    setEditingListing(listing);
    setShowWizard(true);
  };
  
  const handleArchive = async (id: string) => {
    try {
      await onStatusChange(id, 'archived');
      toast.success(isRu ? 'Перемещено в архив' : 'Moved to archive');
    } catch (e) {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };
  
  const handleRestore = async (id: string) => {
    try {
      await onStatusChange(id, 'draft');
      toast.success(isRu ? 'Восстановлено' : 'Restored');
    } catch (e) {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };
  
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await onDelete(deletingId);
      toast.success(isRu ? 'Удалено' : 'Deleted');
      setDeletingId(null);
    } catch (e) {
      toast.error(isRu ? 'Ошибка удаления' : 'Delete failed');
    }
  };
  
  const handleWizardSuccess = () => {
    setShowWizard(false);
    setEditingListing(null);
    onRefetch();
  };
  
  const renderListingCard = (listing: Listing) => {
    const statusConfig = STATUS_CONFIG[listing.status];
    
    return (
      <Card key={listing.id} className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex gap-3 p-3">
            {/* Image */}
            <div className="w-20 h-20 rounded-lg bg-muted shrink-0 overflow-hidden">
              {listing.cover_image ? (
                <img 
                  src={listing.cover_image} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <FileText className="h-6 w-6" />
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-medium text-sm line-clamp-1">
                    {isRu ? (listing.title_ru || listing.title_en) : listing.title_en}
                  </h3>
                  {listing.short_description_en && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {listing.short_description_en}
                    </p>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(listing)}>
                      <Edit className="h-4 w-4 mr-2" />
                      {isRu ? 'Редактировать' : 'Edit'}
                    </DropdownMenuItem>
                    {listing.status !== 'archived' ? (
                      <DropdownMenuItem onClick={() => handleArchive(listing.id)}>
                        <Archive className="h-4 w-4 mr-2" />
                        {isRu ? 'В архив' : 'Archive'}
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleRestore(listing.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        {isRu ? 'Восстановить' : 'Restore'}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => setDeletingId(listing.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isRu ? 'Удалить' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge className={cn('text-xs', statusConfig.color)}>
                  {statusConfig.icon}
                  <span className="ml-1">
                    {isRu ? statusConfig.labelRu : statusConfig.labelEn}
                  </span>
                </Badge>
                
                {listing.base_price && listing.base_price > 0 && (
                  <span className="text-sm font-medium text-primary">
                    ฿{listing.base_price.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }
  
  return (
    <>
      <div className="space-y-4">
        {/* Header with Create Button */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">
            {isRu ? 'Мои листинги' : 'My Listings'}
          </h2>
          <Button onClick={() => setShowWizard(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {isRu ? 'Создать' : 'Create'}
          </Button>
        </div>
        
        {/* Status Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ListingStatus | 'all')}>
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="all" className="text-xs">
              {isRu ? 'Все' : 'All'} ({counts.all || 0})
            </TabsTrigger>
            <TabsTrigger value="draft" className="text-xs">
              {isRu ? 'Черн.' : 'Draft'} ({counts.draft || 0})
            </TabsTrigger>
            <TabsTrigger value="moderation" className="text-xs">
              {isRu ? 'Мод.' : 'Mod.'} ({counts.moderation || 0})
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs">
              {isRu ? 'Актив.' : 'Active'} ({counts.active || 0})
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-xs">
              {isRu ? 'Архив' : 'Arch.'} ({counts.archived || 0})
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-4 space-y-3">
            {filteredListings.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-8 w-8" />}
                title="No listings yet"
                titleRu="Нет листингов"
                description="Create your first listing to start selling"
                descriptionRu="Создайте первый листинг, чтобы начать продавать"
                action={
                  <Button onClick={() => setShowWizard(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    {isRu ? 'Создать листинг' : 'Create Listing'}
                  </Button>
                }
                isRu={isRu}
              />
            ) : (
              filteredListings.map(renderListingCard)
            )}
          </div>
        </Tabs>
      </div>
      
      {/* Canonical Listing Wizard */}
      <CanonicalListingWizard
        open={showWizard}
        onOpenChange={(open) => {
          setShowWizard(open);
          if (!open) setEditingListing(null);
        }}
        categories={categories}
        providerId={providerId}
        tableName={tableName}
        initialData={editingListing ? {
          category_id: editingListing.category_id,
          title_en: editingListing.title_en,
          title_ru: editingListing.title_ru || '',
          short_description_en: editingListing.short_description_en || '',
          cover_image: editingListing.cover_image || '',
          base_price: editingListing.base_price || 0,
          status: editingListing.status,
        } : undefined}
        editingId={editingListing?.id}
        onSuccess={handleWizardSuccess}
      />
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRu ? 'Удалить листинг?' : 'Delete Listing?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRu 
                ? 'Это действие нельзя отменить. Листинг будет удалён навсегда.'
                : 'This action cannot be undone. The listing will be permanently deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {isRu ? 'Отмена' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {isRu ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
