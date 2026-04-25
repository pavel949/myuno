import React, { useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { IntakeSession, IntakeSummary, IntakeItem } from '@/hooks/useIntakeAgent';
import { IntakeItemCard } from './IntakeItemCard';
import { IntakeItemEditor } from './IntakeItemEditor';
import { IntakeItemPanel } from './IntakeItemPanel';
import { IntakeBulkActions } from './IntakeBulkActions';
import { IntakeFailedList } from './IntakeFailedList';
import { PersistentPanelLayout } from '@/components/uno/PersistentPanelLayout';
import { useIsDesktop } from '@/hooks/use-desktop';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
import { Clock, CheckCircle, XCircle, List, Keyboard, AlertTriangle } from 'lucide-react';
import { calculateHealthScore } from '@/lib/intake/healthScore';
import { useIntakeQueueHotkeys } from '@/hooks/useIntakeQueueHotkeys';
import { cn } from '@/lib/utils';

interface IntakeQueueProps {
  session: IntakeSession;
  summary: IntakeSummary;
  onApprove: (itemId: string) => Promise<boolean>;
  onDiscard: (itemId: string) => void;
  onEdit: (itemId: string, updates: Partial<IntakeItem>) => void;
  onRetry: (itemId: string) => Promise<boolean>;
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
  onRetry,
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
  const [confirmDiscardId, setConfirmDiscardId] = useState<string | null>(null);
  const [confirmApproveAll, setConfirmApproveAll] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Pending sorted worst-first by health-score so operator fixes the broken ones first.
  const pendingItems = useMemo(() => {
    const arr = session.items.filter(i => i.status === 'pending');
    return arr
      .map(i => ({ i, score: calculateHealthScore(i).score }))
      .sort((a, b) => a.score - b.score)
      .map(x => x.i);
  }, [session.items]);
  const createdItems = session.items.filter(i => i.status === 'created');
  const discardedItems = session.items.filter(i => i.status === 'discarded');
  const failedItems = useMemo(
    () => session.items
      .filter(i => i.status === 'failed')
      .sort((a, b) => (b.lastError?.occurredAt || '').localeCompare(a.lastError?.occurredAt || '')),
    [session.items]
  );

  const handleRetry = async (itemId: string) => {
    setRetryingId(itemId);
    try {
      await onRetry(itemId);
    } finally {
      setRetryingId(null);
    }
  };

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

  // ─── Bulk approve confirmation: trigger AlertDialog when >5 pending items ───
  const requestApproveAll = () => {
    if (pendingItems.length > 5) {
      setConfirmApproveAll(true);
    } else {
      onApproveAll();
    }
  };

  // ─── Hotkeys (only active on the "pending" tab — others are read-only) ───
  const { activeId, setActiveId } = useIntakeQueueHotkeys({
    items: activeTab === 'pending' ? pendingItems : [],
    enabled: activeTab === 'pending' && !editingItem,
    onApprove: (id) => handleApprove(id),
    onDiscard: (id) => setConfirmDiscardId(id),
    onEdit: (id) => {
      const target = pendingItems.find(i => i.id === id);
      if (target) setEditingItem(target);
    },
    onApproveAll: requestApproveAll,
  });

  const gridClass = "grid gap-4 lg:gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  const renderItems = (items: IntakeItem[], showActions: boolean) => (
    <div className={gridClass}>
      {items.map(item => {
        const isActive = activeTab === 'pending' && activeId === item.id;
        const isPanelSelected = selectedItem?.id === item.id;
        return (
          <div
            key={item.id}
            data-intake-card-id={item.id}
            onClick={() => {
              handleCardClick(item);
              if (showActions) setActiveId(item.id);
            }}
            className={cn(
              'rounded-none transition-all',
              isPanelSelected && 'ring-2 ring-primary',
              !isPanelSelected && isActive && 'ring-2 ring-accent'
            )}
          >
            <IntakeItemCard
              item={item}
              onApprove={showActions ? () => handleApprove(item.id) : () => {}}
              onDiscard={showActions ? () => setConfirmDiscardId(item.id) : () => {}}
              onEdit={showActions ? () => setEditingItem(item) : () => {}}
              isApproving={approvingItemId === item.id}
              swipeable={showActions}
            />
          </div>
        );
      })}
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
        onApproveAll={requestApproveAll}
        onReset={onReset}
        isApproving={isApproving}
        approvedCount={session.approvedCount}
        discardedCount={session.discardedCount}
      />

      {/* Persistent failure banner — shown above tabs whenever any item failed */}
      {failedItems.length > 0 && activeTab !== 'failed' && (
        <button
          type="button"
          onClick={() => setActiveTab('failed')}
          className="w-full flex items-center justify-between gap-3 border-l-4 border-destructive bg-destructive/5 hover:bg-destructive/10 transition-colors px-3 py-2 text-left"
        >
          <span className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="font-medium">
              {isRu
                ? `${failedItems.length} ошибк${failedItems.length === 1 ? 'а' : failedItems.length < 5 ? 'и' : 'ок'} в очереди`
                : `${failedItems.length} error${failedItems.length === 1 ? '' : 's'} in queue`}
            </span>
          </span>
          <span className="text-xs text-muted-foreground">
            {isRu ? 'Открыть →' : 'Open →'}
          </span>
        </button>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-5">
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
          <TabsTrigger
            value="failed"
            className={cn(
              'gap-1',
              failedItems.length > 0 && 'data-[state=inactive]:text-destructive'
            )}
          >
            <AlertTriangle className="h-4 w-4" />
            {isRu ? 'Ошибки' : 'Failed'}
            <span className="text-xs text-muted-foreground">({failedItems.length})</span>
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

        <TabsContent value="failed" className="mt-4">
          <IntakeFailedList
            items={failedItems}
            onRetry={handleRetry}
            onEdit={(it) => setEditingItem(it)}
            onDiscard={(id) => setConfirmDiscardId(id)}
            retryingId={retryingId}
          />
        </TabsContent>

        <TabsContent value="discarded" className="mt-4">
          {discardedItems.length === 0
            ? emptyState(<XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />, isRu ? 'Нет отклонённых объектов' : 'No discarded items')
            : renderItems(discardedItems, false)
          }
        </TabsContent>
      </Tabs>

      {/* Keyboard hint bar — shown on the pending tab on desktop only */}
      {activeTab === 'pending' && pendingItems.length > 0 && isDesktop && (
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground border-t pt-3 mt-2 flex-wrap">
          <Keyboard className="h-3.5 w-3.5" />
          <span className="font-medium">{isRu ? 'Клавиши:' : 'Hotkeys:'}</span>
          <Badge variant="outline" className="font-mono px-1.5 py-0">↑ ↓</Badge>
          <span>{isRu ? 'навигация' : 'navigate'}</span>
          <Badge variant="outline" className="font-mono px-1.5 py-0">A</Badge>
          <span>{isRu ? 'создать' : 'approve'}</span>
          <Badge variant="outline" className="font-mono px-1.5 py-0">D</Badge>
          <span>{isRu ? 'удалить' : 'discard'}</span>
          <Badge variant="outline" className="font-mono px-1.5 py-0">E</Badge>
          <span>{isRu ? 'редактировать' : 'edit'}</span>
          <Badge variant="outline" className="font-mono px-1.5 py-0">Shift+A</Badge>
          <span>{isRu ? 'создать всё' : 'approve all'}</span>
        </div>
      )}
    </div>
  );

  const itemToDiscard = confirmDiscardId ? session.items.find(i => i.id === confirmDiscardId) : null;
  const discardTitle = itemToDiscard
    ? (isRu ? itemToDiscard.suggestedTitle?.ru : itemToDiscard.suggestedTitle?.en) ||
      itemToDiscard.suggestedTitle?.en || itemToDiscard.suggestedTitle?.ru || ''
    : '';

  return (
    <>
      <PersistentPanelLayout
        rightPanel={selectedItem ? (
          <IntakeItemPanel
            item={selectedItem}
            onApprove={() => handleApprove(selectedItem.id)}
            onDiscard={() => { setConfirmDiscardId(selectedItem.id); }}
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

      {/* Discard confirmation */}
      <AlertDialog open={!!confirmDiscardId} onOpenChange={(open) => !open && setConfirmDiscardId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRu ? 'Удалить черновик?' : 'Discard draft?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRu
                ? `«${discardTitle}» будет помечен как отклонённый. Это действие нельзя отменить.`
                : `"${discardTitle}" will be marked as discarded. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDiscardId) {
                  onDiscard(confirmDiscardId);
                  if (selectedItem?.id === confirmDiscardId) setSelectedItem(null);
                }
                setConfirmDiscardId(null);
              }}
            >
              {isRu ? 'Удалить' : 'Discard'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk approve confirmation (>5 items) */}
      <AlertDialog open={confirmApproveAll} onOpenChange={setConfirmApproveAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRu ? 'Создать все листинги?' : 'Create all listings?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRu
                ? `Будет создано до ${summary.readyToApprove} листингов из ${pendingItems.length} в очереди. Невалидные пропустим.`
                : `Up to ${summary.readyToApprove} listings will be created from ${pendingItems.length} in the queue. Invalid items will be skipped.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmApproveAll(false);
                onApproveAll();
              }}
            >
              {isRu ? 'Создать всё' : 'Create all'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

