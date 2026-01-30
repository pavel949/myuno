import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { IntakeSession, IntakeSummary, IntakeItem } from '@/hooks/useIntakeAgent';
import { IntakeItemCard } from './IntakeItemCard';
import { IntakeItemEditor } from './IntakeItemEditor';
import { IntakeBulkActions } from './IntakeBulkActions';
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
  
  const [activeTab, setActiveTab] = useState('pending');
  const [editingItem, setEditingItem] = useState<IntakeItem | null>(null);
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

  return (
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {session.items.map(item => (
              <IntakeItemCard
                key={item.id}
                item={item}
                onApprove={() => handleApprove(item.id)}
                onDiscard={() => onDiscard(item.id)}
                onEdit={() => setEditingItem(item)}
                isApproving={approvingItemId === item.id}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          {pendingItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{isRu ? 'Нет ожидающих объектов' : 'No pending items'}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingItems.map(item => (
                <IntakeItemCard
                  key={item.id}
                  item={item}
                  onApprove={() => handleApprove(item.id)}
                  onDiscard={() => onDiscard(item.id)}
                  onEdit={() => setEditingItem(item)}
                  isApproving={approvingItemId === item.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="created" className="mt-4">
          {createdItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{isRu ? 'Пока нет созданных листингов' : 'No created listings yet'}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {createdItems.map(item => (
                <IntakeItemCard
                  key={item.id}
                  item={item}
                  onApprove={() => {}}
                  onDiscard={() => {}}
                  onEdit={() => {}}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="discarded" className="mt-4">
          {discardedItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{isRu ? 'Нет отклонённых объектов' : 'No discarded items'}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {discardedItems.map(item => (
                <IntakeItemCard
                  key={item.id}
                  item={item}
                  onApprove={() => {}}
                  onDiscard={() => {}}
                  onEdit={() => {}}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Editor modal */}
      <IntakeItemEditor
        item={editingItem}
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onSave={handleEditSave}
      />
    </div>
  );
}
