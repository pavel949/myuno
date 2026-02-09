import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { IntakeSession, IntakeSummary, IntakeItem } from '@/hooks/useIntakeAgent';
import { IntakeItemCard } from './IntakeItemCard';
import { IntakeItemEditor } from './IntakeItemEditor';
import { IntakeItemPanel } from './IntakeItemPanel';
import { IntakeBulkActions } from './IntakeBulkActions';
import { PersistentPanelLayout } from '@/components/uno/PersistentPanelLayout';
import { useIsDesktop } from '@/hooks/use-desktop';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle, XCircle, List } from 'lucide-react';

interface IntakeQueueProps {
  session: IntakeSession;
  summary: IntakeSummary;
  onApprove: (itemId: string) => Promise<boolean>;
  onDiscard: (itemId: string) => void;
  onEdit: (itemId: string, updates: Partial<IntakeItem>) => void;
  onApproveAll: () => void;
  onReset: () => void;
  isApproving: boolean;
}

export function IntakeQueue({
  session,
  summary,
  onApprove,
  onDiscard,
  onEdit,
  onApproveAll,
  onReset,
  isApproving
}: IntakeQueueProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isDesktop = useIsDesktop();
  
  const [activeTab, setActiveTab] = useState('pending');
  const [editingItem, setEditingItem] = useState<IntakeItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<IntakeItem | null>(null);
  const [approvingItemId, setApprovingItemId] = useState<string | null>(null);

  const pendingItems = session.items.filter(i => i.status === 'pending');
  const createdItems = session.items.filter(i => i.status === 'created');
  const discardedItems = session.items.filter(i => i.status === 'discarded');

  const handleApprove = async (itemId: string) => {
    setApprovingItemId(itemId);
    await onApprove(itemId);
    setApprovingItemId(null);
  };

  const handleEditSave = (itemId: string, updates: Partial<IntakeItem>) => {
    onEdit(itemId, updates);
    setEditingItem(null);
  };

  const handleCardClick = (item: IntakeItem) => {
    if (isDesktop) {
      setSelectedItem(item);
    }
  };

  const gridClass = "grid gap-4 lg:gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  const renderItems = (items: IntakeItem[], showActions: boolean) => (
    <div className={gridClass}>
      {items.map(item => (
        <div 
          key={item.id}
          onClick={() => handleCardClick(item)}
          className={selectedItem?.id === item.id ? 'ring-2 ring-primary rounded-lg' : ''}
        >
          <IntakeItemCard
            item={item}
            onApprove={showActions ? () => handleApprove(item.id) : () => {}}
            onDiscard={showActions ? () => onDiscard(item.id) : () => {}}
            onEdit={showActions ? () => setEditingItem(item) : () => {}}
            isApproving={approvingItemId === item.id}
          />
        </div>
      ))}
    </div>
  );

  const emptyState = (icon: React.ReactNode, text: string) => (
    <div className="text-center py-12 text-muted-foreground">
      {icon}
      <p>{text}</p>
    </div>
  );

  const mainContent = (
    <div className="space-y-4">
      {/* Bulk actions bar */}
      <IntakeBulkActions
        summary={summary}
        onApproveAll={onApproveAll}
        onReset={onReset}
        isApproving={isApproving}
        approvedCount={session.approvedCount}
        discardedCount={session.discardedCount}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="all" className="gap-1">
            <List className="h-4 w-4" />
            {isRu ? 'Все' : 'All'}
            <span className="text-xs text-muted-foreground">({session.items.length})</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-1">
            <Clock className="h-4 w-4" />
            {isRu ? 'Ожидают' : 'Pending'}
            <span className="text-xs text-muted-foreground">({pendingItems.length})</span>
          </TabsTrigger>
          <TabsTrigger value="created" className="gap-1">
            <CheckCircle className="h-4 w-4" />
            {isRu ? 'Созданы' : 'Created'}
            <span className="text-xs text-muted-foreground">({createdItems.length})</span>
          </TabsTrigger>
          <TabsTrigger value="discarded" className="gap-1">
            <XCircle className="h-4 w-4" />
            {isRu ? 'Отклонены' : 'Discarded'}
            <span className="text-xs text-muted-foreground">({discardedItems.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {renderItems(session.items, true)}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          {pendingItems.length === 0 
            ? emptyState(<Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />, isRu ? 'Нет ожидающих объектов' : 'No pending items')
            : renderItems(pendingItems, true)
          }
        </TabsContent>

        <TabsContent value="created" className="mt-4">
          {createdItems.length === 0
            ? emptyState(<CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />, isRu ? 'Пока нет созданных листингов' : 'No created listings yet')
            : renderItems(createdItems, false)
          }
        </TabsContent>

        <TabsContent value="discarded" className="mt-4">
          {discardedItems.length === 0
            ? emptyState(<XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />, isRu ? 'Нет отклонённых объектов' : 'No discarded items')
            : renderItems(discardedItems, false)
          }
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <>
      <PersistentPanelLayout
        rightPanel={selectedItem ? (
          <IntakeItemPanel
            item={selectedItem}
            onApprove={() => handleApprove(selectedItem.id)}
            onDiscard={() => { onDiscard(selectedItem.id); setSelectedItem(null); }}
            onEdit={() => setEditingItem(selectedItem)}
            isApproving={approvingItemId === selectedItem.id}
          />
        ) : null}
        rightPanelTitle={isRu ? 'Детали' : 'Details'}
        onCloseRightPanel={() => setSelectedItem(null)}
      >
        {mainContent}
      </PersistentPanelLayout>

      {/* Editor modal — shared by both mobile and desktop */}
      <IntakeItemEditor
        item={editingItem}
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onSave={handleEditSave}
      />
    </>
  );
}
