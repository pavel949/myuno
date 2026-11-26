import { PageHeader, PageShell } from '@/components/page';
/**
 * Admin page: documents vault for a specific project.
 * Route: /admin/newbuilds/projects/:id/documents
 */
import { useParams, Link } from 'react-router-dom';
import { ProjectDocumentsVault } from '@/components/admin/newbuilds/ProjectDocumentsVault';
import { ProjectReviewSummary } from '@/components/admin/newbuilds/ProjectReviewSummary';
import { DriveImportPanel } from '@/components/admin/newbuilds/DriveImportPanel';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AdminProjectDocuments() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = (labels: LangValues) => pickLang(language, labels);
  const { data: project } = useQuery({
    queryKey: ['admin-project-meta', user?.id, id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('property_projects').select('id, name_en, name_ru').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id && user?.id),
  });

  if (!id) return null;
  const projectTitle = language === 'ru' ? project?.name_ru || project?.name_en : project?.name_en;
  const pageName = t({ en: 'Project documents', ru: 'Документы проекта', th: 'เอกสารโครงการ' });

  return (
    <PageShell width="workspace" className="space-y-4">
      <Button asChild variant="ghost">
        <Link to="/admin/newbuilds">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t({ en: 'New developments', ru: 'Новостройки', th: 'โครงการใหม่' })}
        </Link>
      </Button>
      <PageHeader title={projectTitle || pageName} subtitle={projectTitle ? pageName : undefined} />
      {user && <ProjectReviewSummary projectId={id} viewerId={user.id} />}
      <DriveImportPanel projectId={id} />
      <ProjectDocumentsVault projectId={id} />
    </PageShell>
  );
}
