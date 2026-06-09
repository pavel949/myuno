import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { VerticalSpec, LocalizedText } from '@/lib/vertical-specs/types';
import { FieldRenderer } from './FieldRenderer';
import { QualityPanel } from './QualityPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

const t = (l: LocalizedText, lang: 'en' | 'ru') => l[lang] ?? l.en;

interface Props {
  spec: VerticalSpec;
  initial: Record<string, unknown>;
  onSave: (row: Record<string, unknown>) => Promise<void> | void;
  saving?: boolean;
}

/**
 * Pro tab-style editor for an existing listing.
 * Same FieldRenderer + QualityPanel as the Wizard, different shell.
 */
export const ListingEditor = ({ spec, initial, onSave, saving }: Props) => {
  const { language } = useLanguage();
  const lang = (language === 'ru' ? 'ru' : 'en') as 'en' | 'ru';
  const [row, setRow] = useState<Record<string, unknown>>(initial);
  const [active, setActive] = useState(spec.editorTabs[0]?.id ?? 'basics');

  return (
    <div className="grid gap-6 md:grid-cols-[1fr,320px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{t(spec.label, lang)}</h1>
          <Button onClick={() => onSave(row)} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {lang === 'ru' ? 'Сохранить' : 'Save'}
          </Button>
        </div>

        <Tabs value={active} onValueChange={(v) => setActive(v as typeof active)}>
          <TabsList className="flex flex-wrap h-auto justify-start">
            {spec.editorTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>{t(tab.title, lang)}</TabsTrigger>
            ))}
          </TabsList>

          {spec.editorTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-4 mt-4">
              {tab.groups.map((g) => (
                <section key={g.id} className="rounded-lg border border-border bg-card p-5 space-y-4">
                  <header className="space-y-1">
                    <h3 className="text-base font-medium">{t(g.title, lang)}</h3>
                    {g.description && <p className="text-sm text-muted-foreground">{t(g.description, lang)}</p>}
                  </header>
                  <div className="space-y-4">
                    {g.fields.map((f) => (
                      <FieldRenderer key={f.key} field={f} row={row} onChange={setRow} />
                    ))}
                  </div>
                </section>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <aside className="space-y-4">
        <QualityPanel spec={spec} row={row} />
      </aside>
    </div>
  );
};
