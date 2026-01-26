import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Languages, Database, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslationsAdmin } from '@/hooks/useTranslationsAdmin';
import { TranslationsTable } from '@/components/admin/translations/TranslationsTable';
import { TranslationEditor } from '@/components/admin/translations/TranslationEditor';
import { ImportExportPanel } from '@/components/admin/translations/ImportExportPanel';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminTranslations() {
  const {
    translations,
    isLoading,
    error,
    categories,
    refetch,
    updateTranslation,
    createTranslation,
    deleteTranslation,
    importTranslations,
  } = useTranslationsAdmin();

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Languages className="h-6 w-6" />
            Переводы
          </h1>
          <p className="text-muted-foreground">
            Управление текстами приложения на всех языках
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <ImportExportPanel 
            translations={translations} 
            onImport={importTranslations} 
          />
          <TranslationEditor 
            onSave={createTranslation}
            existingCategories={categories}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{translations.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Всего ключей</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{categories.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Категорий</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {translations.filter(t => t.is_custom).length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Изменённых</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">3</span>
            </div>
            <p className="text-sm text-muted-foreground">Языка</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Все переводы</CardTitle>
            <CardDescription>
              Редактируйте тексты напрямую в таблице
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={refetch} disabled={isLoading}>
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              {error}
              <Button variant="link" onClick={refetch}>
                Попробовать снова
              </Button>
            </div>
          ) : (
            <TranslationsTable
              translations={translations}
              categories={categories}
              onUpdate={updateTranslation}
              onDelete={deleteTranslation}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
