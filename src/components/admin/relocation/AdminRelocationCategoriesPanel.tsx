import { useMemo, useState } from 'react';
import { Surface } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RELOCATION_ARTICLE_CATEGORIES } from '@/data/relocationArticles.seed';
import {
  AdminRelocationArticleRow,
  useRenameRelocationCategory,
} from '@/hooks/admin/useAdminRelocationArticles';

interface Props {
  articles: AdminRelocationArticleRow[];
}

export function AdminRelocationCategoriesPanel({ articles }: Props) {
  const rename = useRenameRelocationCategory();
  const [renaming, setRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const stats = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of articles) map.set(a.category, (map.get(a.category) ?? 0) + 1);
    const seedIds = new Set(RELOCATION_ARTICLE_CATEGORIES.map((c) => c.id));
    const all = new Set<string>([...map.keys(), ...seedIds]);
    return Array.from(all).sort().map((id) => {
      const seed = RELOCATION_ARTICLE_CATEGORIES.find((c) => c.id === id);
      return {
        id,
        count: map.get(id) ?? 0,
        labelRu: seed?.label_ru ?? '—',
        labelEn: seed?.label_en ?? '—',
        inSeed: !!seed,
      };
    });
  }, [articles]);

  return (
    <Surface variant="card" padding="md" radius="xl" className="space-y-3">
      <div>
        <h2 className="text-base font-semibold">Категории</h2>
        <p className="text-xs text-muted-foreground">
          Лейблы RU/EN живут в коде (<code>relocationArticles.seed.ts</code>). Здесь можно
          переименовать ID категории — все статьи будут обновлены массово.
        </p>
      </div>

      <div className="divide-y">
        {stats.map((c) => (
          <div key={c.id} className="py-2 flex items-center gap-2 flex-wrap">
            <code className="text-sm font-mono">{c.id}</code>
            {!c.inSeed && <Badge variant="outline">нет в seed</Badge>}
            <span className="text-xs text-muted-foreground">{c.labelRu} / {c.labelEn}</span>
            <Badge variant="secondary" className="ml-auto">{c.count}</Badge>
            {renaming === c.id ? (
              <div className="flex items-center gap-2 w-full mt-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="новый id"
                  className="h-8"
                />
                <Button
                  size="sm"
                  disabled={rename.isPending || !newName.trim()}
                  onClick={async () => {
                    await rename.mutateAsync({ from: c.id, to: newName });
                    setRenaming(null);
                    setNewName('');
                  }}
                >
                  Применить
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRenaming(null)}>
                  Отмена
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                disabled={c.count === 0}
                onClick={() => {
                  setRenaming(c.id);
                  setNewName(c.id);
                }}
              >
                Переименовать
              </Button>
            )}
          </div>
        ))}
      </div>
    </Surface>
  );
}
