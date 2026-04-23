import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FlaskConical, Plus, Play, Pause, Copy, Pencil,
  Trash2, Trophy, Loader2,
} from 'lucide-react';
import {
  useABVariantsByLanding,
  useCreateABTest,
  useToggleABTest,
  useDuplicateABTest,
  useDeleteABTest,
  useDeclareWinner,
  useUpdateABVariant,
  type ABTest,
  type VariantContent,
} from '@/hooks/useABVariants';
import { ABVariantEditorModal } from './ABVariantEditorModal';
import { ABVariantPerformancePanel } from './ABVariantPerformancePanel';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ABVariantManagerProps {
  landingId: string;
  landingName: string;
}

export function ABVariantManager({ landingId, landingName }: ABVariantManagerProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: tests, isLoading } = useABVariantsByLanding(landingId);
  const createMut = useCreateABTest();
  const updateMut = useUpdateABVariant();
  const toggleMut = useToggleABTest();
  const dupMut = useDuplicateABTest();
  const deleteMut = useDeleteABTest();
  const winnerMut = useDeclareWinner();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<ABTest | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [winnerConfirm, setWinnerConfirm] = useState<{ id: string; winner: 'A' | 'B' } | null>(null);

  const handleSave = (variantA: VariantContent, variantB: VariantContent) => {
    if (editingTest) {
      updateMut.mutate(
        { id: editingTest.id, variant_a: variantA, variant_b: variantB },
        {
          onSuccess: () => { toast.success(isRu ? 'Обновлено' : 'Updated'); setEditorOpen(false); },
          onError: () => toast.error(isRu ? 'Ошибка' : 'Failed'),
        }
      );
    } else {
      createMut.mutate(
        { landing_id: landingId, variant_a: variantA, variant_b: variantB },
        {
          onSuccess: () => { toast.success(isRu ? 'Тест создан' : 'Test created'); setEditorOpen(false); },
          onError: () => toast.error(isRu ? 'Ошибка' : 'Failed'),
        }
      );
    }
  };

  const handleToggle = (test: ABTest) => {
    const nextActive = !test.is_active;
    if (nextActive && tests?.some(t => t.is_active && t.id !== test.id)) {
      toast.error(isRu ? 'Только один активный тест' : 'Only one active test allowed');
      return;
    }
    toggleMut.mutate(
      { id: test.id, is_active: nextActive },
      { onSuccess: () => toast.success(isRu ? 'Статус обновлён' : 'Status updated') }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{isRu ? 'A/B тесты Hero' : 'A/B Hero Tests'}</h3>
          <Badge variant="secondary" className="text-[10px]">{tests?.length || 0}</Badge>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1" onClick={() => { setEditingTest(null); setEditorOpen(true); }}>
          <Plus className="h-3 w-3" />
          {isRu ? 'Новый' : 'New Test'}
        </Button>
      </div>

      {/* Empty state */}
      {(!tests || tests.length === 0) ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FlaskConical className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Нет A/B тестов' : 'No A/B tests yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        tests.map(test => (
          <Card key={test.id} className={test.is_active ? 'border-primary/30' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="capitalize">{test.test_type.replace('_', ' ')}</span>
                  {test.is_active ? (
                    <Badge variant="default" className="text-[10px]">{isRu ? 'Активен' : 'Live'}</Badge>
                  ) : test.winner ? (
                    <Badge variant="success" className="text-[10px] gap-0.5">
                      <Trophy className="h-2.5 w-2.5" />{test.winner}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">{isRu ? 'Черновик' : 'Draft'}</Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-1">
                  {!test.winner && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggle(test)} disabled={toggleMut.isPending}>
                      {test.is_active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingTest(test); setEditorOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => dupMut.mutate(test, { onSuccess: () => toast.success(isRu ? 'Дублировано' : 'Duplicated') })} disabled={dupMut.isPending}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirm(test.id)} disabled={!!test.is_active}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Variant summary cards */}
              <div className="grid grid-cols-2 gap-3">
                {(['A', 'B'] as const).map(label => {
                  const v = label === 'A' ? test.variant_a : test.variant_b;
                  return (
                    <div key={label} className="bg-muted/40 rounded-none p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px]">
                          {label} {label === 'A' ? (isRu ? '(Контроль)' : '(Control)') : (isRu ? '(Тест)' : '(Test)')}
                        </Badge>
                        {test.is_active && !test.winner && ((test.impressions_a ?? 0) + (test.impressions_b ?? 0)) >= 20 && (
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-0.5" onClick={() => setWinnerConfirm({ id: test.id, winner: label })}>
                            <Trophy className="h-2.5 w-2.5" />{isRu ? 'Выбрать' : 'Pick'}
                          </Button>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">{v.headline_en || '—'}</p>
                      <p className="text-xs text-muted-foreground truncate">{v.subheadline_en || '—'}</p>
                      {v.cta_label_en && (
                        <span className="inline-block mt-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-none">
                          {v.cta_label_en}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Performance */}
              <ABVariantPerformancePanel test={test} />
            </CardContent>
          </Card>
        ))
      )}

      {/* Editor Modal */}
      <ABVariantEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        initialA={editingTest?.variant_a}
        initialB={editingTest?.variant_b}
        isLoading={createMut.isPending || updateMut.isPending}
      />

      {/* Delete dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRu ? 'Удалить тест?' : 'Delete test?'}</AlertDialogTitle>
            <AlertDialogDescription>{isRu ? 'Это действие необратимо.' : 'This cannot be undone.'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => { deleteMut.mutate(deleteConfirm!, { onSuccess: () => setDeleteConfirm(null) }); }}>
              {isRu ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Winner dialog */}
      <AlertDialog open={!!winnerConfirm} onOpenChange={() => setWinnerConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRu ? `Победитель: ${winnerConfirm?.winner}?` : `Winner: ${winnerConfirm?.winner}?`}</AlertDialogTitle>
            <AlertDialogDescription>{isRu ? 'Тест будет остановлен.' : 'Test will be stopped.'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { winnerMut.mutate(winnerConfirm!, { onSuccess: () => setWinnerConfirm(null) }); }}>
              <Trophy className="h-4 w-4 mr-1" />{isRu ? 'Подтвердить' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
