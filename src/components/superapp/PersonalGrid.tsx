/**
 * PersonalGrid — "Для вас сейчас". Ranks FLAT_SERVICES against active role +
 * personas and shows top 8 as an icon grid. Reacts to RoleSheet changes.
 */
import React, { useMemo } from 'react';
import { AVAILABLE_SERVICES } from '@/lib/catalog/taxonomy';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { useLifeOSRole } from '@/hooks/useLifeOS';
import { useLanguage } from '@/contexts/LanguageContext';
import { rankServices } from '@/lib/superapp/rankServices';
import { IconGrid } from './IconGrid';

export const PERSONAL_GRID_DEFAULT_LIMIT = 8;

export interface PersonalGridProps {
  limit?: number;
  activeSituationCode?: string;
}

/**
 * Ids of the services PersonalGrid would render for the current role/personas.
 * Used by sibling sections (cluster mini-app grids) to avoid showing the same
 * tile twice on one page.
 */
export function usePersonalGridServiceIds(
  limit: number = PERSONAL_GRID_DEFAULT_LIMIT,
  activeSituationCode?: string,
): string[] {
  const { effectivePersonas } = useUserPersonas();
  const role = useLifeOSRole();

  return useMemo(
    () =>
      rankServices(AVAILABLE_SERVICES, { role, personas: effectivePersonas, activeSituationCode })
        .slice(0, limit)
        .map((s) => s.id),
    [role, effectivePersonas, activeSituationCode, limit],
  );
}

export const PersonalGrid: React.FC<PersonalGridProps> = ({
  limit = PERSONAL_GRID_DEFAULT_LIMIT,
  activeSituationCode,
}) => {
  const { effectivePersonas } = useUserPersonas();
  const role = useLifeOSRole();
  const { t } = useLanguage();

  const ranked = useMemo(
    () =>
      rankServices(AVAILABLE_SERVICES, {
        role,
        personas: effectivePersonas,
        activeSituationCode,
      }).slice(0, limit),
    [role, effectivePersonas, activeSituationCode, limit],
  );

  return (
    <IconGrid
      title={t('discover.forYouNow')}
      caption={t('discover.forYouNowCaption')}
      services={ranked}
      showCategoryCaption
    />
  );
};

export default PersonalGrid;
