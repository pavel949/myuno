/**
 * Legacy /newbuilds/projects and /newbuilds/developers/* → Property Hub canonical URLs.
 */
import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { useNewbuildProject } from '@/hooks/useNewbuildProjects';
import { useDeveloperSlugOrId } from '@/hooks/useDevelopers';
import { LoadingState } from '@/components/uno/LoadingSpinner';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined): value is string {
  return !!value && UUID_RE.test(value);
}

export function NewbuildProjectToOffplanRedirect() {
  const { slug } = useParams<{ slug: string }>();

  if (isUuid(slug)) {
    return <Navigate to={APP_ROUTES.OFFPLAN_DETAIL(slug)} replace />;
  }

  const { data, isLoading, isError } = useNewbuildProject(slug);

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError || !data) {
    return <Navigate to={APP_ROUTES.OFFPLAN} replace />;
  }

  return <Navigate to={APP_ROUTES.OFFPLAN_DETAIL(data.id)} replace />;
}

export function NewbuildDeveloperToHubRedirect() {
  const { slug } = useParams<{ slug: string }>();

  if (isUuid(slug)) {
    return <Navigate to={APP_ROUTES.DEVELOPER_DETAIL(slug)} replace />;
  }

  const { data, isLoading, isError } = useDeveloperSlugOrId(slug);

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError || !data) {
    return <Navigate to={APP_ROUTES.DEVELOPERS} replace />;
  }

  return <Navigate to={APP_ROUTES.DEVELOPER_DETAIL(data.id)} replace />;
}
