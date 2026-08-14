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

export interface PersonalGridProps {
  limit?: number;
  activeSituationCode?: string;
}

export const PersonalGrid: React.FC<PersonalGridProps> = ({
  limit = 8,
  activeSituationCode,
}) => {
  const { effectivePersonas } = useUserPersonas();
  const role = useLifeOSRole();
  const { language, t } = useLanguage();
  const isRu = language === 'ru';

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
