/**
 * Admin page: documents vault for a specific project.
 * Route: /admin/newbuilds/projects/:id/documents
 */
import { useParams, Link } from 'react-router-dom';
import { ProjectDocumentsVault } from '@/components/admin/newbuilds/ProjectDocumentsVault';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AdminProjectDocuments() {
  const { id } = useParams<{ id: string }>();
  const { data: project } = useQuery({
    queryKey: ['admin-project-meta', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await supabase.from('property_projects').select('id, name_en').eq('id', id).maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  if (!id) return null;

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/admin/newbuilds"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Console</Button></Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold">{project?.name_en || 'Проект'}</h1>
        <p className="text-sm text-muted-foreground">Документы проекта</p>
      </div>
      <ProjectDocumentsVault projectId={id} />
    </div>
  );
}
